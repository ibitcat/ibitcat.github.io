---
title:  "深入理解skynet —— 网络库(二)"
date: 2020-05-21
tag:
- skynet
---

在上一篇博文中，我已经把 skynet 网络库的核心的数据结构做了一个非常详细的剖析，本文将继续深入，探讨网络库的消息封装以及消息处理流程（包括内部命令消息和外部网络消息）。

## 消息的封装
网络库的一个核心功能就是**收发网络消息**(内部命令也可以看成是一类网络消息)，且收发流程都会对原始数据做封装处理，对于收包流程来说，需要网络库把收到的数据封装成服务能够处理的数据结构，同时还需要附加一些额外的数据；而对于发包流程而言，同样需要进行数据封装处理。

### 收包
我们知道，skynet 是一个 actor 模型的框架，actor 之间使用“消息”进行通讯，且“消息”遵循一个统一的格式，就像信封一样，大家都用一套统一通用的格式，才能相互顺畅通信。
![信封](/assets/image/posts/2020-05-21-01.png?style=centerme)
<p align="center"><em>信封模板</em></p>

在 skynet 服务间流通的消息被封装为 `skynet_message`，其结构体定义如下：
```c
struct skynet_message {
	uint32_t source; 		// 消息源的服务id
	int session;			// 消息的session id
	void * data;			// 消息的payload（指针）
	size_t sz;				// payload 大小
};
```
关于 `skynet_message` 结构本文不再做过多解析，可以参考我之前博文的详细剖析[深入理解skynet —— 服务](/_posts/2020-05-10-learn-skynet-service/#插入消息)，我们只需要记住一点：**skynet_message 是 skynet 服务能处理消息的唯一格式**，即其他模块派发给服务的通知都需要封装成 `skynet_message`，以便服务能够处理，例如：定时器模块的定时消息、网络模块的内部命令结果和外部网络消息，都转换成 `skynet_message`，然后发送给对应的服务，可谓“殊途同归”。

在转换过程中，我们需要关注很多细节，包括消息负载数据是否需要拷贝，确定消息类型等等。下图展示了收包过程中数据的封装及数据的流向：
![收包数据流向](/assets/image/posts/2020-05-21-02.svg?style=centerme)

### 发包
这里所说的发包是指向一个外部网络连接发送数据，需要注意的是，发包可能需要依赖内部命令，因为需要把**在工作线程无法直接发送的数据，透过内部管道，将这部分数据转交给网络线程发送**（发送流程我在下面会有更加详细的描述）。

任何需要交由网络模块发送的数据，都会封装为 `socket_sendbuffer`，其结构体定义如下：
```c
#define SOCKET_BUFFER_MEMORY 0 		// 内存块，能明确知道内存大小
#define SOCKET_BUFFER_OBJECT 1		// 内存指针，需要做相应处理(send_object_init)才能知道数据的真实大小
#define SOCKET_BUFFER_RAWPOINTER 2	// 原始内存，对应lua userdata

struct socket_sendbuffer {
	int id;					// socket id
	int type;				// 要发送的数据类型（参见上面的宏定义）
	const void *buffer;		// 数据指针（这里并非是真实要发送的数据的内存指针）
	size_t sz;				// 数据大小
};
```
在 sendbuffer 这个结构体中，`buffer`是一个指向待发送数据的指针，`type`则用来区分这个指针的类型。类型分为一下三种：
- MEMORY，表示大小已知的内存指针，例如通过 `concat_table` 得到的字符串数据；
- OBJECT，表示大小未知的数据对象指针，其真实发送的数据(*最终往 fd 中写入的数据*)需要二次提取，例如 lua 的 lightuserdata；
- RAWPOINTER，特指 lua userdata，当该类型的数据透传给网络库时，需要进行内存数据拷贝；

此外，在发包过程中，skynet 还做了一些优化，会优先在工作线程直接发送，若无法直发，则透传给网络线程发送。下图展示了发包过程中数据封装和流向：
![发包数据流向](/assets/image/posts/2020-05-21-03.svg?style=centerme)

## poll 流程
在前面已经介绍过网络线程的主要逻辑，在这一节我将“庖丁解牛”般的拆解网络库的 **event poll** 流程，即`socket_server_poll`接口，对其进行梳理后，可以分为三个部分：内部处理、事件捕获、事件处理，以下是经过简化后的代码：
```c
int 
socket_server_poll(struct socket_server *ss, struct socket_message * result, int * more) {
	for (;;) {
		if (ss->checkctrl) {
			// 内部命令处理
			if (has_cmd(ss)) {
				int type = ctrl_cmd(ss, result);
				...
			} else {
				ss->checkctrl = 0;
			}
		}

		if (ss->event_index == ss->event_n) {
			// 事件wait
			ss->event_n = sp_wait(ss->event_fd, ss->ev, MAX_EVENT);
			ss->checkctrl = 1;
			...
		}

		...

		// 事件处理
		switch (s->type) {
		case SOCKET_TYPE_CONNECTING:
			// 主动连接
			return report_connect(ss, s, &l, result);
		case SOCKET_TYPE_LISTEN: {
			// 被动连接
			int ok = report_accept(ss, s, result);
			...
		}
		case SOCKET_TYPE_INVALID:
			// 非法socket
			fprintf(stderr, "socket-server: invalid socket\n");
			break;
		default:
			if (e->read) {
				// 读取处理
				...
			}

			if (e->write) {
				// 写入处理
				...
			}

			if (e->error) {
				// 错误处理
				...
			}

			if(e->eof) {
				// 文件尾(for kqueue)
				...
			}
			break;
		}
	}
}
```

**内部命令处理**是指在进程内的服务与网络库之间的通讯，例如在 lua 服务中监听一个端口，或发起一个 TCP 连接。这些内部命令，通过网络库提供的管道传递到网络库，最终由网络线程执行命令。网络线程在捕获到事件后，会优先处理所有的内部命令（如果有内部消息的话），具体的命令处理流程可查阅 `ctrl_cmd` 函数，这里不再详述，需要注意该函数的返回值 `type`，当 `type = -1` 表示内部命令还不能返回确切的结果（例如命令'L'），或者这个内部命令不需要返回结果（例如命令'T'），当 `type > -1` 则表示该命令已经执行成功且能返回明确的结果给服务。

关于返回值 `type` 的宏定义如下：
```c
#define SOCKET_DATA 0   		// socket 接收到了数据
#define SOCKET_CLOSE 1			// socket 被关闭
#define SOCKET_OPEN 2			// socket 连接成功（主动连接、被动连接）
#define SOCKET_ACCEPT 3			// 接收到新的连接（需要后续 start 才能使用）
#define SOCKET_ERR 4			// socket 错误，需要关闭
#define SOCKET_EXIT 5			// 退出网络线程
#define SOCKET_UDP 6			// 收到 UDP 包
#define SOCKET_WARNING 7 		// socket 报警（待发送的数据过大）
```
此外，当 type 为`SOCKET_CLOSE`或`SOCKET_ERR`(向一个已关闭的fd发送数据)时，表示连接已经关闭，则需要回收这个 socket 。

**事件捕获**部分就较为简单，对于 epoll 就是 `epoll_wait`，对于 kqueue 就是 `kenvet`，唯一需要注意的点是 wait api 使用的无限期阻塞，即没有事件则一直阻塞，具体可以参考上一篇博文关于 `epoll_wait` 的讲解，此处不再赘述。

**事件处理**主要负责网络连接的处理，包括对外的主动连接和外部的被动连接。有事件的 socket 依据其状态有不同的事件处理流程，如对于 CONNECTING 的 socket 连接，则会完成之前发起的主动连接请求并上报给服务；对于 LISTEN 的 socket，则接收新连接（未start）并上报给服务；对于其他已经建立好连接，则对其进行读、写以及错误处理。

## 内部命令
内部命令是指进程内服务发送给网络库有关网络操作的消息，这些消息经由管道透传到网络库，此过程的原理和细节可跳转到上一篇文章的[管道](/_posts/2020-05-20-learn-skynet-network1/#管道)章节，里面有很详细的介绍，这里主要介绍各个内部命令的功能及其封装结构。

我们知道，在一个通道上要实现信息通信，那么在这个通道上流通的消息就需要遵循统一格式的消息封装。就像 skynet 中两个服务之间进行通讯，就需要把消息封装成 `skynet_message`; 再如当和 mysql 数据库进行交互时，就需要消息包遵循 mysql 数据包格式；同样，内部命令也会封装成统一的格式在管道上传递，其封装结构体定义如下：
```c
struct request_package {
	uint8_t header[8];	// 6 bytes dummy，头部，前6个字节预留，第7个字节表示命令类型，第8个字节表示命令内容的长度
	union {
		char buffer[256];
		struct request_open open;
		struct request_send send;
		struct request_send_udp send_udp;
		struct request_close close;
		struct request_listen listen;
		struct request_bind bind;
		struct request_start start;
		struct request_setopt setopt;
		struct request_udp udp;
		struct request_setudp set_udp;
	} u;
	uint8_t dummy[256];	// 预留256字节
};
```

所有的命令内容都封装在一个大小为 256 字节的联合体 `u` 内，具体的消息长度由 `char header[7]` 控制，这就是为什么联合体需要一个 `char buffer[256]` 的字符数组；命令类型由 `char header[6]` 控制，一个大写字母代表一种内部命令。下面列出了目前支持的命令：
```
S Start socket
B Bind socket
L Listen socket
K Close socket
O Connect to (Open)
X Exit
D Send package (high)
P Send package (low)
A Send UDP package
T Set opt
U Create UDP socket
C set udp address
```

为什么会使用一个 `char header[8]` 作为头部，而只使用最后两个字节，这样做的原因是要考虑结构体的**内存对齐**问题。假如我们只用 `char header[2]` 来作为头部，那么会在往管道写入数据时，会因为内存对齐的原因，导致写入的命令头部和内容之间存在6个“**未初始化**”的字节。

下图展示了内部命令的内存结构以及管道的工作流程：
![内部命令封装](/assets/image/posts/2020-05-21-04.svg?style=centerme)

## 事件处理
网络线程在捕获到事件后，若是管道的事件，则走内部命令处理流程，而剩下的网络事件，则根据不同的 socket 状态(或类型)做不同的处理。

### 主动连接
关于主动向外发起连接，可以回看上一篇文章关于 connect 的时序图，回忆一下在 skynet 的服务中发起一个主动连接的整个过程。其核心逻辑在 `open_socket` 函数中，这里我抠出关键部分的代码：
```c
// return -1 when connecting
static int
open_socket(struct socket_server *ss, struct request_open * request, struct socket_message *result) {
	...

	int sock= -1;
	for (ai_ptr = ai_list; ai_ptr != NULL; ai_ptr = ai_ptr->ai_next ) {
		sock = socket( ai_ptr->ai_family, ai_ptr->ai_socktype, ai_ptr->ai_protocol );
		if ( sock < 0 ) {
			continue;
		}
		socket_keepalive(sock);
		sp_nonblocking(sock); // 设置为非阻塞
		status = connect( sock, ai_ptr->ai_addr, ai_ptr->ai_addrlen);
		if ( status != 0 && errno != EINPROGRESS) {
			close(sock);
			sock = -1;
			continue;
		}
		break;
	}

	...

	if(status == 0) {
		ns->type = SOCKET_TYPE_CONNECTED;
		...
		return SOCKET_OPEN;
	} else {
		ns->type = SOCKET_TYPE_CONNECTING;
		sp_write(ss->event_fd, ns->fd, ns, true);
	}

	...
}
```
上面的代码是一个标准的**非阻塞 connect**，我们需要关注 `connect(sock, ...)` api 的返回值 `status`，如果返回 0，则表示连接已经建立，这通常是在服务器和客户在同一台主机上时发生；如果返回 -1，则需要关注 `errno`，若 `errno = EINPROGRESS`，表示连接建立，建立启动但是尚未完成，则需要把这个 sock 注册到 epoll 中，并关注该描述符的可写事件。

### 接收新连接
该事件处理主要为监听 fd 服务，当 listen_fd 收到新连接到来时，则生成一个新的 socket 实例，然后上报给 listen_fd 所绑定的那个服务，处理流程较为简单。可能需要注意的点是，新接收到的 socket 需要服务对其 start，才能把新连接注册到 epoll/kqueue 中。关于 listen 流程可以回看上一篇文章关于监听的时序图。

### 消息读取


### 消息写入

>当每次要写数据时，先检查一下该 fd 中发送队列是否为空，如果为空的话，就尝试直接在当前工作线程发送（这往往是大多数情况）。发送成功就皆大欢喜，如果失败或部分发送，则把没发送的数据放在 socket 结构中，并开启 epoll 的可写事件。
>
>网络线程每次发送待发队列前，需要先检查有没有直接发送剩下的部分，有则加到队列头，然后再依次发送。  
>
>当然 udp 会更简单一些，一是 udp 包没有部分发送的可能，二是 udp 不需要保证次序。所以 udp 立即发送失败后，可以直接按原流程扔到发送队列尾即可。

<hr>
**参考：**
- [skynet 网络线程的一点优化](https://blog.codingnow.com/2017/06/skynet_socket.html)
- [Linux下connect超时处理](https://www.jianshu.com/p/3be00ce8dc76)