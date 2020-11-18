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
在前面已经介绍过网络线程的主要逻辑，在这一节我将“庖丁解牛”般的拆解网络库的 **event poll** 流程，即`socket_server_poll`接口，对其进行梳理后，可以分为三个部分：内部处理、事件wait、事件处理，以下是经过简化后的代码：
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

## 内部命令

## 网络处理
### 消息读取
### 消息写入

>把网络写操作从网络线程中拿出来。当每次要写数据时，先检查一下该 fd 中发送队列是否为空，如果为空的话，就尝试直接在当前工作线程发送（这往往是大多数情况）。发送成功就皆大欢喜，如果失败或部分发送，则把没发送的数据放在 socket 结构中，并开启 epoll 的可写事件。  
>网络线程每次发送待发队列前，需要先检查有没有直接发送剩下的部分，有则加到队列头，然后再依次发送。  
>当然 udp 会更简单一些，一是 udp 包没有部分发送的可能，二是 udp 不需要保证次序。所以 udp 立即发送失败后，可以直接按原流程扔到发送队列尾即可。

## lua库
### socketdriver
### netpack

<hr>
**参考：**
