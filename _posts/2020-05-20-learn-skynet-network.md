---
title:  "深入理解skynet —— 网络"
date: 2020-05-20
tag:
- skynet
---

## 前言
当我们接触一些服务器项目时，都会对其中的网络部分有“如临大敌”之感，但其实是我们在理解网络框架时把问题复杂化了，抑或是没有对网络框架划分出一个清晰的层次结构。当我遇到一个框架时，则采用“黑盒化”的一种方式，先把一些较为细节的部分想象成一个黑盒，把它“包”起来，然后对这些黑盒进行梳理，整理好整个框架的大致架构，在这个大框架的基础上再深入“黑盒”中，抽丝剥茧，最终从“黑盒”转变成“白盒”。当然，若配合现实例子能更好的帮助理解。

接下来，带着上面的“利器”，进入到 skynet 的网络世界中吧。

## 网络框架
任何网络框架的核心工作内容其实很简单，即：**接收并读取 socket 中的数据并进行相应处理，然后写入处理后的返回消息**。只不过一个优秀的网络框架会提供更多的功能和细节优化，例如：socket 的管理、网络读写分离、读写数据缓存等等。

skynet 的网络库同样如此，我们对其进行“黑盒化”之后，会得到三个部分：网络工作线程(`thread_socket`)、网络服务管理器(`socket_server`)、内部命令。然后对这三个“黑盒”梳理串联，就得到了整个网络库的的核心工作流程：CPU 驱动网络线程运行，线程则调用网络服务的 poll (`skynet_socket_poll`)接口，进而推动外部网络处理和内部网络命令。正如云风大佬所说：
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
管理器对应了网络库中的 socket_server 实例（或称对象），这里只简单阐述下它的作用，我在下一节中对其做了详细的剖析。

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
在 skynet 中，管道配合 select 模型使用，管道为“服务”操控网络模块提供了支持。那我们要思考一下，为什么在已经有了 epoll/kqueue 后，还需要配置使用 pipe + select？

这里就涉及到了我前面提到的 `self pipe trick` 技巧，也就是 pipe 的异步使用场景。以 epoll 举例（**本文后面都以epoll为例**），一般我们使用 epoll 做网络开发时，基本遵循以下套路：

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
在单线程模式下，以上的处理流程是完全没有问题的，但是在多线程的模式下，问题就出现了。就拿 skynet 来说，当一个工作线程中的 lua 服务需要对网络模块执行一些操作时，例如关闭某个socket，在工作线程发出请求后，网络线程却正处于 epoll wait 状态，也就是网络线程阻塞了，epoll 没有网络事件的话，只能等待 wait 超时后，才能有机会处理工作线程发来的请求，而且若 timeout = -1 时，则会导致 epoll_wait 无限期阻塞，这显然很有可能会导致工作线程的请求长时间不被处理，然而，skynet 就是将 timeout 设为 -1。

PS. 关于epoll_wait 的 timeout 参数，可以参考 man 手册：
> Note that the timeout interval will be rounded up to the  system  clock  granularity,  and  kernel  scheduling delays  mean that  the  blocking  interval  may overrun by a small amount.  Specifying a timeout of -1 causes epoll_wait() to block indefinitely, while specifying a timeout equal to  zero  cause  epoll_wait()  to  return immediately, even if no events are available.

为了解决上面的问题，管道就派上用场，它是半双工的，一端写入，另一端读取，我们只需要把读端 fd 注册到 epoll 中，这就解决了内部请求的唤醒问题。

需要注意的是，使用管道需要关注两个问题：**管道容量(pipe capacity)**和**管道原子性**。
- pipe capacity，在 linux 中，管道容量为 65535 byte，即 16 个页大小，若写入数据大于管道容量，则写入会阻塞或者失败。引用 man 手册中的叙述(`man 7 pipe`)：
>A pipe has a limited capacity. If the pipe is full, then a write(2) will block or fail, depending on whether the O_NONBLOCK flag is set (see below). Different implementations have different limits for the pipe capacity. Applications should not rely on a particular capacity: an application should be designed so that a reading process consumes data as soon as it is available, so that a writing process does not remain blocked.
>In Linux versions before 2.6.11, the capacity of a pipe was the same as the system page size (e.g., 4096 bytes on i386). Since Linux 2.6.11, the pipe capacity is 65536 bytes.

- 原子性，对管道写入小于 **PIPE_BUF** 的数据都是原子的，也就是说向写端写入小于 PIPE_BUF 的数据，能在读端一次完整收取到，而不会被截断成多个部分。这一点是很重要的，否则若数据过大，读取端可能还需要做一些数据缓存操作，以保证收到数据的完整性。关于PIPE_BUF，依然引用man文档的叙述：
>POSIX 规定，小于 PIPE_BUF 的写操作必须是原子的：要写的数据应被连续地写到管道；  
大于 PIPE_BUF 的写操作可能是非原子的：内核可能会将数据与其它进程写入的数据交织在一起。  
POSIX 规定 PIPE_BUF 至少为512字节（Linux 中为4096字节），具体的语义如下：（其中n为要写的字节数）  
n <= PIPE_BUF，O_NONBLOCK disable  
    写入具有原子性。如果没有足够的空间供 n 个字节全部立即写入，则阻塞直到有足够空间将n个字节全部写入管道。  
n <= PIPE_BUF，O_NONBLOCK enable  
    写入具有原子性。如果有足够的空间写入 n 个字节，则 write 立即成功返回，并写入所有 n 个字节；否则一个都不写入，write 返回错误，并将 errno 设置为 EAGAIN。  
n > PIPE_BUF，O_NONBLOCK disable  
    写入不具有原子性。可能会和其它的写进程交替写，直到将 n 个字节全部写入才返回，否则阻塞等待写入。  
n > PIPE_BUF，O_NONBLOCK enable  
    写入不具有原子性。如果管道已满，则写入失败，write 返回错误，并将 errno 设置为 EAGAIN；否则，可以写入 1 ~ n 个字节，即部分写入，此时 write 返回实际写入的字节数，并且写入这些字节时可能与其他进程交错写入。

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
		e[i].read = (flag & (EPOLLIN | EPOLLHUP)) != 0;
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
2. read 标识需要关注 EPOLLHUP。

## socket 封装
### socket 状态
### 写入队列
### dw_buffer

## 消息的封装
### skynet_message
### socket_message
### skynet_socket_message

## 网络处理
### 内部命令
### 消息读取
### 消息写入

## lua库
### socketdriver
### netpack

<hr>
**参考：**
- [skynet 网络线程的一点优化](https://blog.codingnow.com/2017/06/skynet_socket.html)
- [skynet 网络层的一点小优化](https://blog.codingnow.com/2019/11/skynet_socket_rawpointer.html)
- [管道的读写规则以及原子性问题](https://blog.csdn.net/X_Perseverance/article/details/99179114)
- [Linux-socket的close和shutdown区别及应用场景](https://www.cnblogs.com/JohnABC/p/7238241.html)