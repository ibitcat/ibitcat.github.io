---
title:  "深入理解skynet —— 网络库(一)"
date: 2020-05-20
tag:
- skynet
---

## 前言
当我们接触一些服务器项目时，都会对其中的网络部分有“如临大敌”之感，但其实是我们在理解网络框架时把问题复杂化了，抑或是没有对网络框架划分出一个清晰的层次结构。当我遇到一个框架时，则采用“黑盒化”的一种方式，先把一些较为细节的部分想象成一个黑盒，把它“包”起来，然后对这些黑盒进行梳理，整理好整个框架的大致架构，在这个大框架的基础上再深入“黑盒”中，抽丝剥茧，最终从“黑盒”转变成“白盒”。当然，若配合现实例子能更好的帮助理解。

接下来，带着上面的“利器”，进入到 skynet 的网络世界中吧。

## 网络框架
任何网络框架的核心工作内容其实很简单，即：**接收并读取 socket 中的数据并进行相应处理，然后写入处理后的返回消息**。只不过一个优秀的网络框架会提供更多的功能和细节优化，例如：socket 的管理、网络读写分离、读写数据缓存等等。

skynet 的网络库同样如此，我们对其进行“黑盒化”之后，会得到三个部分：网络工作线程(`thread_socket`)、网络服务管理器(`socket_server`)、网络服务poll。然后对这三个“黑盒”梳理串联，就得到了整个网络库的的核心工作流程：CPU 驱动网络线程运行，线程则调用网络服务的 poll (`skynet_socket_poll`)接口，进而推动外部网络处理和内部网络命令。正如云风大佬所说：
>skynet 网络层的设计目的是，把操作系统层面的 socket 数据从系统内核复制到用户空间，然后再把用户空间的数据地址交给各个不同的服务使用，同时也把用户空间需要发送的数据转移到系统内核中。

为了更具象的描述上面的流程，我举一个“接地气”的例子：中国乡下都能见到的个体家用榨油机，例如最常见的菜籽榨油机，往榨油机漏斗倒入油菜籽，经由机器压榨，最后流出菜籽油。细细品味一下，你会发现这跟上面提到的 skynet 网络库的处理流程是不是大同小异？这种家用榨油设备不就是一个简化版的（*只处理一个socket*）的“网络库”吗，它由 **CPU**（“电机”）驱动 **poll 接口**（“传动轮”）而工作，读取**输入数据**（“油菜籽”），然后**处理数据**（“压榨”），最后**返回结果**（“菜籽油”），还能自我控制（“调节漏斗流量”）。

![家用榨油机](/assets/image/posts/2020-05-20-01.jpg?style=centerme)
<p align="center"><em>家用榨油设备</em></p>

### 网络线程
skynet 使用了一个单独的唯一线程来完成所有网络连接的收发，网络线程代码如下：
```c
static void *
thread_socket(void *p) {
	struct monitor * m = p;
	skynet_initthread(THREAD_SOCKET);
	for (;;) {
		int r = skynet_socket_poll();
		if (r==0)
            // 退出网络轮询，即网络线程退出
			break;
		if (r<0) {
			CHECK_ABORT
            // 一般r=-1,表示还有剩余网络事件需要处理
			continue;
		}

        // r>0, 表示捕获到新的网络事件，若所有worker全部都处于sleep，则唤醒一个
		wakeup(m,0);
	}
	return NULL;
}
```

此线程的逻辑非常简单，它会循环调用 poll 接口，并根据返回值来确定继续或退出线程。关于其返回值，我已经在上面代码注释中有描述，这里着重探讨 poll 接口：`skynet_socket_poll`，它调用了网络库底层的`socket_server_poll`接口，该接口处理由操作系统提供的多路复用IO接口所捕获到的网络事件，包括内部网络命令和外部网络消息，然后根据其处理后的返回的网络消息类型，将返回结果转发给对应的服务（context）。
>skynet 的多路复用IO接口支持 unix-like 系统的跨平台，linux (例如centos、ubuntu等)使用 epoll；unix (MacOS、FreeBSD等)使用kqueue。

### 网络管理器
管理器对应了网络库中的 socket_server 实例（或称对象），这里只简单阐述下它的作用，我会在后面分别做详细的剖析。

它主要作用大致可分为两个部分：
1. socket 的管理，包括 socket的存储、socket 的id分配以及socket 状态的维护等等；
2. 网络事件的处理，包括 efd 的创建、管道的创建与读写处理（用于内部命令）、外部网络事件的捕获与读写处理等。关于网络（内部和外部）的读写处理封装在 `socket_server_poll` 接口中，供网络线程调用，后面也有详细剖析。

## socket_server
这一节我将对 socket_server 进行全方位的剖析，弄清其结构体的字段构成以及每个字段的作用和意义。该结构体定义如下：
```c
struct socket_server {
	volatile uint64_t time; // 等同于 TI->current
	int recvctrl_fd;        // 管道读端
	int sendctrl_fd;        // 管道写端
	int checkctrl;          // 是否需要检查内部命令的标识
	poll_fd event_fd;       // event poll
	int alloc_id;           // socket id分配器
	int event_n;            // 一次捕获到事件总数，该值小于等于 MAX_EVENT
	int event_index;        // 已处理过的事件索引
	struct socket_object_interface soi; // userobjuect 接口
	struct event ev[MAX_EVENT];         // 捕获的事件数组
	struct socket slot[MAX_SOCKET];     // socket 数组
	char buffer[MAX_INFO];              // 临时存放需要转发给其他服务的消息数据
	uint8_t udpbuffer[MAX_UDP_PACKAGE]; // 接收的udp包
	fd_set rfds;                        // select fd set
};
```

下图是我整理的 socket_server 结构体字段关系图，根据该结构图可以很清晰的想象出其内存结构。
![server_socket](/assets/image/posts/2020-05-20-02.svg?style=centerme)
<p align="center"><em>server_socket 结构体关系图</em></p>

### 管道
在 skynet 中，管道配合 select 使用，管道为“服务”操控网络模块提供了支持。那我们要思考一下，为什么在已经有了 epoll/kqueue 后，还需要配置使用 pipe + select？

这里就涉及到了我之前文章提到的 `self pipe trick` 技巧，也就是 pipe 的异步使用场景。以 epoll 举例（**本文后面都以epoll为例**），一般我们使用 epoll 做网络开发时，基本遵循以下套路：

```c
events = epoll_wait(efd, timeout);
for fd, event in events {
    if event & EPOLLIN {
        读取数据
    }
    if event & EPOLLOUT {
        写入数据
    }
    if event & EPOLLERR {
        错误处理
    }
}
```
在单线程模式下，以上的处理流程是完全没有问题的，但是在多线程的模式下，问题就出现了。就拿 skynet 来说，当一个工作线程中的 lua 服务需要对网络模块执行一些操作时，例如关闭某个socket，在工作线程发出请求后，网络线程却正处于 epoll wait 状态，也就是网络线程阻塞了，epoll 没有网络事件的话，只能等待 wait 超时后，才能有机会处理工作线程发来的请求，而且若 timeout = -1 时，则会导致 epoll_wait 无限期阻塞，这显然很有可能会导致工作线程的请求长时间不被处理，“不幸的是”，skynet 就是将 timeout 设为 -1。

*PS. 关于epoll_wait 的 timeout 参数，可以参考 man 手册：*
> Note that the timeout interval will be rounded up to the  system  clock  granularity,  and  kernel  scheduling delays  mean that  the  blocking  interval  may overrun by a small amount.  Specifying a timeout of -1 causes epoll_wait() to block indefinitely, while specifying a timeout equal to  zero  cause  epoll_wait()  to  return immediately, even if no events are available.

为了解决上面的问题，管道就派上用场，它是半双工的，一端写入，另一端读取，我们只需要把读端 fd 注册到 epoll 中，这就解决了内部请求的唤醒问题。

此处还引出一个知识点，我们在使用管道时需要关注两个问题：**管道容量(pipe capacity)**和**管道原子性**。
- pipe capacity，在 linux 中，管道容量为 65535 byte，即 16 个页(page)大小，若写入数据大于管道容量，则写入会阻塞或者失败。引用 man 手册中的叙述(`man 7 pipe`)：
>A pipe has a limited capacity. If the pipe is full, then a write(2) will block or fail, depending on whether the O_NONBLOCK flag is set (see below). Different implementations have different limits for the pipe capacity. Applications should not rely on a particular capacity: an application should be designed so that a reading process consumes data as soon as it is available, so that a writing process does not remain blocked.
>In Linux versions before 2.6.11, the capacity of a pipe was the same as the system page size (e.g., 4096 bytes on i386). Since Linux 2.6.11, the pipe capacity is 65536 bytes.

- 原子性，对管道写入小于 **PIPE_BUF** 的数据都是原子的，也就是说向写端写入小于 PIPE_BUF 的数据，能在读端一次完整收取到，而不会被截断成多个部分。这一点是很重要的，否则若数据过大，读取端可能还需要做一些数据缓存操作，以保证收到数据的完整性。关于PIPE_BUF，依然引用man文档的叙述：
>POSIX 规定，小于 PIPE_BUF 的写操作必须是原子的：要写的数据应被连续地写到管道；大于 PIPE_BUF 的写操作可能是非原子的：内核可能会将数据与其它进程写入的数据交织在一起。 POSIX 规定 PIPE_BUF 至少为512字节（Linux 中为4096字节），具体的语义如下：（其中n为要写的字节数）  
n <= PIPE_BUF，O_NONBLOCK disable，写入具有原子性。如果没有足够的空间供 n 个字节全部立即写入，则阻塞直到有足够空间将n个字节全部写入管道。  
n <= PIPE_BUF，O_NONBLOCK enable，写入具有原子性。如果有足够的空间写入 n 个字节，则 write 立即成功返回，并写入所有 n 个字节；否则一个都不写入，write 返回错误，并将 errno 设置为 EAGAIN。  
n > PIPE_BUF，O_NONBLOCK disable，写入不具有原子性。可能会和其它的写进程交替写，直到将 n 个字节全部写入才返回，否则阻塞等待写入。  
n > PIPE_BUF，O_NONBLOCK enable，写入不具有原子性。如果管道已满，则写入失败，write 返回错误，并将 errno 设置为 EAGAIN；否则，可以写入 1 ~ n 个字节，即部分写入，此时 write 返回实际写入的字节数，并且写入这些字节时可能与其他进程交错写入。

### 事件
一般来说，在使用多路复用IO模型时，会对事件进行二次封装或者二次处理。例如 skynet 中 epoll wait 流程如下：
```c
static int 
sp_wait(int efd, struct event *e, int max) {
	struct epoll_event ev[max];
	int n = epoll_wait(efd , ev, max, -1);
	int i;
	for (i=0;i<n;i++) {
		e[i].s = ev[i].data.ptr;
		unsigned flag = ev[i].events;
		e[i].write = (flag & EPOLLOUT) != 0;
		e[i].read = (flag & (EPOLLIN | EPOLLHUP)) != 0; // 需关注EPOLLHUP
		e[i].error = (flag & EPOLLERR) != 0;
		e[i].eof = false;
	}

	return n;
}
```

由 epoll 捕获的事件，会被封装成 `struct event`，然后把这些封装过的事件交由网络线程处理。它的结构体定义如下：
```c
struct event {
	void * s; 		// socket 实例指针，若s为null，表示是管道事件
	bool read;		// 可读事件标识
	bool write;		// 可写事件标识
	bool error;		// 错误事件标识
	bool eof;		// 文件尾(end-of-file)标识，kqueue专用
};
```
这里需注意两个小细节：
1. 事件的用户数据指针`*s`。当把一个 fd 注册到 event poll 中时，若该 fd 是一个外部网络连接则 `*s` 指向一个 socket 实例；若该 fd 是管道的读端则 `*s` 为null，这样在线程调用`socket_server_poll`时就能根据 `*s` 的值把内部消息流程和外部消息流程分隔，即管道的内部命令处理都使用 select，而外部网络消息使用 epoll/kqueue。
2. read 标识需要关注 EPOLLHUP。查阅`man epoll_ctl`关于 EPOLLHUP 的描述发现并没有讲解得很清晰，经网上搜索以及自己写了一个小例子加以实验，最终弄清了这个事件，详情可参考[这篇文章](https://zhuanlan.zhihu.com/p/149265232)，这里我直接放出结论：该事件是一个“不可标记的事件”，也就是说不需要手动注册事件，该事件被触发的核心原则是收到了对端发送过来的 `RST` 包，例如：向一个对端已经close的 fd 写入数据。实验代码贴在了[gist](https://gist.github.com/shuimu98/939d12c561b02834f4a0a677f042016b)。

## socket
skynet 把网络连接都封装成 `struct socket`，其结构体定义如下（*我这里为了分组改变了字段的顺序*）：
```c
struct socket {
	// 基础信息
	int fd;					// 网络 fd
	int id;					// 自增，范围在 0x01 ~ 0x7fffffff
	uint8_t protocol;		// 协议类型，支持TCP和UDP
	uint8_t type;			// socket类型(称为“状态”更合适)
	uintptr_t opaque;		// 与之关联的服务id
	union {
		int size;
		uint8_t udp_address[UDP_ADDRESS_SIZE];
	} p; // 联合体，tcp使用size表示每次读取数据的字节数；udp使用udp_address表示远端地址信息

	// 写入队列
	struct wb_list high;	// 高优先级写入队列
	struct wb_list low;		// 低优先级写入队列
	int64_t wb_size;		// 待写入的字节数，0表示没有数据需要写入，过大则会发出报警

	// 统计和警告
	struct socket_stat stat;	// 读写统计信息(读写的字节总数、最后读写时间)
	int64_t warn_size;			// 待写入数据过大时报警的阈值

	// 直接写入
	struct spinlock dw_lock;	// 直接写入的锁（后面会详细解释）
	int dw_offset;				// 已经直接写入的数据大小
	const void * dw_buffer; 	// 直接写入的数据指针
	size_t dw_size;				// 直接写入的数据总量
	volatile uint32_t sending;	// 是否正在发送数据
	uint16_t udpconnecting; 	// udp 正在连接标识
};
```
可以看到一个 socket 携带了很多信息，这些字段整理后可以分为四部分：
- 基础信息，例如 socket fd、socket id、协议类型等信息
- 写入队列相关，包括高优先级和低优先级两种写入队列
- 直接写入(direct write)，包括锁(`dw_lock`)、直接写入的数据指针、大小和偏移量等等
- 统计和警告，包括读写数据、读写时间的统计以及待写入数据过载时的警告

其中大部分字段的意义都清晰明了，且我亦给出了较为详细的注释，结合源码阅读就能很轻松掌握。接下来我会对**我认为**需要深入的部分做更仔细的剖析，它们包括：socket id 的生成规则、socket 的状态以及状态的切换、socket 数据发送（直接发送和队列发送）。

### ID 生成
通常，应用层不会直接使用内核返回的 fd 作为一个 socket 连接的唯一id，因为内核会复用 fd，因此内核的 fd 并不具有唯一性，例如服务器收到两个了连接，fd 分别是 1 和 2，当连接 2 被关闭后，此时新的连接到来，内核可能复用 `fd = 2` 分配给新的连接，这就引发一个问题，若应用层还需要对之前关闭的连接 2 做一些收尾操作，而新的连接又复用的连接 2 的 fd，新旧连接的冲突就发生了。

为了解决以上问题，一般服务器都有一套自己的 socket id 生成规则，大部分都是自增 id 作为一个连接的唯一 id。skynet 采用的也是类似方式，且 skynet 把 socket 实例的 id 与 socket 实例所在的数组下标做了哈希映射，其哈希算法也非常简单，就是对 id 做取模运算，取模后的值即为 socket 实例的数组下标。具体代码如下：
```c
// 哈希映射
#define HASH_ID(id) (((unsigned)id) % MAX_SOCKET)

// 生成socket id
static int
reserve_id(struct socket_server *ss) {
	int i;
	for (i=0;i<MAX_SOCKET;i++) {
		int id = ATOM_INC(&(ss->alloc_id));
		if (id < 0) {
			id = ATOM_AND(&(ss->alloc_id), 0x7fffffff);
		}
		struct socket *s = &ss->slot[HASH_ID(id)];
		if (s->type == SOCKET_TYPE_INVALID) {
			if (ATOM_CAS(&s->type, SOCKET_TYPE_INVALID, SOCKET_TYPE_RESERVE)) {
				s->id = id;
				s->protocol = PROTOCOL_UNKNOWN;
				// socket_server_udp_connect may inc s->udpconncting directly (from other thread, before new_fd), 
				// so reset it to 0 here rather than in new_fd.
				s->udpconnecting = 0;
				s->fd = -1;
				return id;
			} else {
				// retry
				--i;
			}
		}
	}
	return -1;
}
```

代码很简单易懂，其核心逻辑：循环查找 `slot` 数组中的 socket 实例，同时自增 `alloc_id` 并通过 `HASH_ID` 计算得到 `slot` 数组下标，直到找到一个处于空闲状态的的 socket 实例。该算法计算得到的 id 分部如下图所示：
![server_socket](/assets/image/posts/2020-05-20-03.svg?style=centerme)

### socket 状态
socket 的状态目前一共有 9 种，其宏定义如下：
```c
#define SOCKET_TYPE_INVALID 0		// 初始状态
#define SOCKET_TYPE_RESERVE 1		// 保留状态
#define SOCKET_TYPE_PLISTEN 2		// 监听前状态
#define SOCKET_TYPE_LISTEN 3		// 监听中状态
#define SOCKET_TYPE_CONNECTING 4	// 连接中状态
#define SOCKET_TYPE_CONNECTED 5		// 已连接状态
#define SOCKET_TYPE_HALFCLOSE 6		// 半关闭状态（能写入但会丢弃读取的数据）
#define SOCKET_TYPE_PACCEPT 7 		// 已接收，但是未添加到epoll（需要start）
#define SOCKET_TYPE_BIND 8			// 绑定系统fd(stdin、stdout、stderr)
```
这些状态有的属于公共状态，每个 socket 实例都能适用，例如 `INVALID` 和 `RESERVE`；有的状态则只适用于与之对应的网络操作，例如 `PLISTEN` 和 `LISTEN` 属于与监听(*listen*)关联的状态。

首先介绍下两个公共状态的作用和意义：
1. `INVALID` 是一个 socket 的初始状态，表示这个 socket 实例暂时未被使用，即可用状态，可用参考上面的 **ID 生成** 那一节内容。
2. `RESERVE` 保留状态，它表示一个 socket 实例正处于某些网络操作(例如listen、connect)的开始和正式结束的“**中间**”状态。

这里我们思考一个问题，为什么需要 `RESERVE` 中间状态呢？

这是因为 skynet 是一个多线程框架，为了保证工作线程尽量少的出现阻塞调用（*服务都是由工作线程驱动*），就需要把网络操作中的阻塞部分交由网络线程处理，当网络线程处理完阻塞逻辑后，抛出消息异步通知给服务，而 RESERVE 状态则确保了工作线程在发起网络调用后能立即返回一个可用的 socket 实例并保留住，以便异步消息的回调。

除了公共状态，其余的状态与网络调用相对应，这些网络调用包括：监听连接、被动连接、主动连接、关闭连接。
- 监听，skynet 把监听操作分成两个步骤：建立监听socket、绑定并监听(有阻塞，如 getaddrinfo)；手动将监听 fd 注册到 epoll/kqueue 中。
![listen](/assets/image/posts/2020-05-20-04.svg?style=centerme)
- 被动连接，也可以看成是两个步骤：由网络线程上报新连接的到来并接收；手动将新连接 fd 注册到 epoll/kqueue 中。
![accept](/assets/image/posts/2020-05-20-05.svg?style=centerme)
- 主动连接，以 connect (对外发起主动连接)举例来说，其单线程执行流程如下：
	```c
	// 解析地址和端口，得到网络地址列表
	int status = getaddrinfo(...);

	// 创建socket
	int sock = socket(ai_family, ai_socktype, ai_protocol);

	// 发起对外连接
	connect(socket, ...);

	// 连接成功，分配socket
	int id = reserve_id(ss);
	```

上面的流程是一个很简单的 connect 流程，但是它不适用在一个高性能的服务器上，这种线性流程存在两个问题：
- getaddrinfo 是一个阻塞 API，linux 提供的各DNS API函数都是阻塞式的，无法设置超时时间等；
- 若 sock 未设置为非阻塞模式，那么 connect API 也将会阻塞，虽然它可以设置超时间；

### 写入队列
### dw_buffer

<hr>
**参考：**
- [skynet 网络线程的一点优化](https://blog.codingnow.com/2017/06/skynet_socket.html)
- [skynet 网络层的一点小优化](https://blog.codingnow.com/2019/11/skynet_socket_rawpointer.html)
- [管道的读写规则以及原子性问题](https://blog.csdn.net/X_Perseverance/article/details/99179114)
- [Linux-socket的close和shutdown区别及应用场景](https://www.cnblogs.com/JohnABC/p/7238241.html)
- [Linux tcp/ip 源码分析 - close](https://cloud.tencent.com/developer/article/1441584)
- [从linux源码看socket的close](https://my.oschina.net/alchemystar/blog/1821680)
- [TCP: When is EPOLLHUP generated?](https://stackoverflow.com/questions/52976152/tcp-when-is-epollhup-generated)
- [EPOLL 事件之 EPOLLRDHUP](https://blog.csdn.net/midion9/article/details/49883063)
- [Linux下connect超时处理](https://www.jianshu.com/p/3be00ce8dc76)