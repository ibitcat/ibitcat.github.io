---
title:  "深入理解skynet —— 网络库(三)"
date: 2020-05-22
tag:
- skynet
---

关于网络库底层的内容已经在前两篇文章做了非常详细的剖析，那么这篇文章将主要介绍有关网络库的上层 api 封装（注册 lua 接口）、lua 层 api 的再次封装以及详细解析一个网络连接的数据如何在 lua 中进行缓存和分包。

## socket driver
该模块(socketdriver)是一个 lua 的 C 模块，它为 lua 服务操控网络库提供了支持。我们可以把该模块提供给 lua 层的 api 分成两部分：网络操作相关的 API、buffer 操作相关的 API。

### 网络操作API
这一部分 API 主要是底层网络层提供的操作接口的封装，这些 API 包括：

- connect，对应内部命令 `'O'`，表示主动发起一个对外的 TCP 连接。
- close，对应内部命令 `'k'`(`shutdown`为0)，表示正常关闭一个 socket 连接。
- shutdown，对应内部命令 `'K'`(`shutdown`为1)，表示强制关闭一个 socket 连接，不管这个连接是否还有残余数据未发送。
- listen，对应内部命令 `'L'`，表示启动一个 TCP 监听，该 API 仅支持 TCP。
- send，对应内部命令 `'D'`，表示向一个 socket 连接写入高优先级消息。
- lsend，对应内部命令 `'P'`，表示向一个 socket 连接写入低优先级消息。
- bind，对应内部命令 `'B'`，一般用于把系统的标准 fd 绑定到一个 socket 实例上（协议类型为 TCP，绑定后可以把标准 fd 看成是一个 TCP 连接，可以读取和写入数据）。
- start，对应内部命令 `'S'`，表示启动一个 socket 连接，当返回 `SOCKET_OPEN` 时则表示成功启动了 socket 连接，这就类似这个 socket 处于“万事俱备，只欠东风”，而该 API 就是这个“东风”，另外，该接口也提供了修改与之关联的服务的功能。
- nodelay，使用了内部命令 `'T'`，针对 TCP 套接字专用的选项，目的是为了禁止nagle算法。
- udp，使用了内部命令 `'U'`，用来创建一个服务端 udp 对象，需要传入 ip 和 port。
- udp_connect，对应内部命令 `'C'`，用来获取远端 udp 地址并将地址信息保存到 socket 的 udp_address 中，该 API 用于主动发起 udp 连接的一方，在使用该 API 之前，需要使用 `udp` 接口成功创建一个 udp fd，连接成功后，上层在向远端发送数据时，只需要往该 socket 直接 write (`socket.write(c, "xxx")`)即可 。
- udp_send，对应内部命令 `'A'`，用于服务端 udp socket 向客户端发送 udp 数据，且发送数据时需要传入对端的地址信息（因为 udp 是无连接，它不像 tcp 服务器能保留每一个客户端连接）
- udp_address，解析 udp 地址信息，返回对端的 ip 和 port，当收到 udp 数据时，会给上层传递两个信息：data 和 address，data 为真正接收到的数据；address 为对端的地址信息，它是一个内存数据(以字符串形式传递给上层)，格式为：协议类型(ipv4/ipv6) + 2字节端口 + 4字节/16字节ip，因为原始 address 数据的可读性差，因此使用该 API 将其转换为 ip 地址和端口的形式。

以上的这些 API 基本都要与 lua 服务强关联，反映在代码中就是说这些 lua c API 都需要 `skynet_context` 这个 upvalue，因为大部分接口在 lua 服务发出请求后，都需要有来自底层网路库的异步消息通知，因此这些接口在注入到 lua 中时方式也有所不同：

```c
luaL_Reg l2[] = {
		{ "connect", lconnect },
		{ "close", lclose },
		{ "shutdown", lshutdown },
		{ "listen", llisten },
		{ "send", lsend },
		{ "lsend", lsendlow },
		{ "bind", lbind },
		{ "start", lstart },
		{ "nodelay", lnodelay },
		{ "udp", ludp },
		{ "udp_connect", ludp_connect },
		{ "udp_send", ludp_send },
		{ "udp_address", ludp_address },
		{ NULL, NULL },
	};
	lua_getfield(L, LUA_REGISTRYINDEX, "skynet_context");
	struct skynet_context *ctx = lua_touserdata(L,-1);
	if (ctx == NULL) {
		return luaL_error(L, "Init skynet context first");
	}

    /*
        L2中的所有函数都设置了名为"skynet_context" 的 upvalue，
        这个 upvalue 就是在 snlua 服务 init 时设置的那个 lua context，
        它时一个指向 context 的指针，即 lightuserdata。
    */
	luaL_setfuncs(L,l2,1);
```

### 数据操作API

## socket api

## socket buffer


<hr>
**参考：**
- [Socket - Github Wiki](https://github.com/cloudwu/skynet/wiki/Socket)
- [TCP之Nagle算法&&延迟ACK](https://www.cnblogs.com/postw/p/9710772.html)
- [TCP_NODELAY 和 TCP_NOPUSH的解释](https://www.cnblogs.com/wajika/p/6573014.html)
- [结构体 Incomplete type](https://www.zhihu.com/question/29905170)