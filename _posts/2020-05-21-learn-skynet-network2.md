---
title:  "深入理解skynet —— 网络库(二)"
date: 2020-05-21
tag:
- skynet
---

## 消息的封装
### skynet_message
### socket_message
### skynet_socket_message

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
- [skynet 网络线程的一点优化](https://blog.codingnow.com/2017/06/skynet_socket.html)
- [skynet 网络层的一点小优化](https://blog.codingnow.com/2019/11/skynet_socket_rawpointer.html)
- [管道的读写规则以及原子性问题](https://blog.csdn.net/X_Perseverance/article/details/99179114)
- [Linux-socket的close和shutdown区别及应用场景](https://www.cnblogs.com/JohnABC/p/7238241.html)
- [Linux tcp/ip 源码分析 - close](https://cloud.tencent.com/developer/article/1441584)
- [从linux源码看socket的close](https://my.oschina.net/alchemystar/blog/1821680)
- [TCP: When is EPOLLHUP generated?](https://stackoverflow.com/questions/52976152/tcp-when-is-epollhup-generated)
- [EPOLL 事件之 EPOLLRDHUP](https://blog.csdn.net/midion9/article/details/49883063)
- [Linux下connect超时处理](https://www.jianshu.com/p/3be00ce8dc76)