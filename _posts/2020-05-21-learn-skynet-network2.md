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
关于 `skynet_message` 结构本文不再做过多解析，可以参考我之前博文的详细剖析[深入理解skynet —— 服务](_posts/2020-05-10-learn-skynet-service/#插入消息)，我们只需要记住一点：**skynet_message 是 skynet 服务能处理消息的唯一格式**，即其他模块派发给服务的通知都需要封装成 `skynet_message`，以便服务能够处理，可谓“殊途同归”，例如：定时器模块的定时消息、网络模块的内部命令结果和外部网络消息，都转换成 `skynet_message`，然后发送给对应的服务。

在转换过程中，我们需要关注很多细节，包括消息负载数据是否需要拷贝，确定消息类型等等。下图展示了收包过程中数据的封装及数据的流向：
![收包数据流向](/assets/image/posts/2020-05-21-02.svg?style=centerme)

### 发包
ada

## poll
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

## lua库
### socketdriver
### netpack

<hr>
**参考：**
