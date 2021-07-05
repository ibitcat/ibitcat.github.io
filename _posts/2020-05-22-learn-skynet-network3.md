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
- udp_send，对应内部命令 `'A'`，用于服务端 udp socket 向客户端发送 udp 数据，且发送数据时需要传入对端的地址信息（因为 udp 是无连接，它不像 tcp 服务器能保留每一个客户端连接的 fd）
- udp_address，解析 udp 地址信息，返回对端的 ip 和 port，当收到 udp 数据时，会给上层传递两个信息：data 和 address，data 为真正接收到的数据；address 为对端的地址信息，它是一个内存数据(以字符串形式传递给上层)，格式为：1字节协议类型(ipv4/ipv6) + 2字节端口 + 4字节/16字节ip，因为原始 address 数据的可读性差，因此可使用该 API 将其转换为 ip 地址和端口的形式。

以上的这些 API 基本都要与 lua 服务强关联，反映在代码中就是说这些 lua c API 都需要 `skynet_context` 这个 upvalue，因为大部分接口在 lua 服务发出请求时，需要明确知道发送的消息是从那个服务发出的，且来自底层网路库的异步消息通知也需要明确的服务地址才能传达，因此这些接口在注入到 lua 中时方式也有所不同：

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
这部分 API 的主要作用是处理收到的网络数据，包括数据缓存、数据读取(按需读取、全部读取、按行读取)等等，关于 socket buffer 的详细结构，我会在本文有更加详细的剖析。

下面列出这些 API 并解释其意义：
- buffer，为一个 TCP 连接创建一个 buffer 队列，当一个 socket 接收到数据后，会抛给与之绑定的服务(一般是 lua 服务)，收到的数据会被包装成**buffer 节点**(`buffer_node`)并 push 到这个 buffer 队列中，等待消费。
- push，将数据包封装成**buffer 节点**(`buffer_node`)插入到对应的 buffer 队列中，若空闲节点不足，则会创建一组新的空闲节点池。
- pop，从 buffer 队列中读取指定长度的数据并返回，若 buffer 数据不够，则返回空，返回的第二个值为 buffer 剩余的数据大小。
- drop，丢弃接收到的数据，即释放掉消息数据的内存。
- readall，读取完 buffer 队列中当前所有的剩余数据。
- clear，清除 buffer 队列中的所有的 buffer 节点。
- readline，根据指定分隔符读取“一行”数据，该 API 有三个参数，第一个参数为 `socket_buffer` userdata；第二个参数若为 nil 则表示仅检查是否能读取到“一行”数据，若参数为 buffer_pool 这个 table，则表示读取“一行”数据并返回给 lua；第三参数指定了分隔符。
- str2p，把从 lua 传入的字符串转换成 lightuserdata（指针），并返回字符串数据的大小。(该 API 暂未使用到)
- header，获取一个数据包的头部，也就是数据内容的长度，它读取 2~4 个字节，并以大端字节序(big-endian)的方式转换成数字。
- info，获取网络库中当前所有 socket 连接的信息，包括：读写字节总数、最后读写事件、socket id、peer 信息、连接类型(例如：LISTEN、TCP、UDP、BIND等)，具体的输出内容，可以使用 debug 命令 netstat 来查看。
- unpack，解析收到的网络数据，其实就是把数据解析成 `skynet_socket_message` 这个结构体，并把该结构体的字段信息都返回给 lua（udp 消息还会返回对端的地址信息），如果看过上一篇文章，你就会知道该 API 的作用就是对[收包](/_posts/2020-05-21-learn-skynet-network2/#收包)过程的反向解析。

## socket api
在上一节，我们对 socketdriver 有一个简单的了解，也列出了其提供的 C API，而我们知道 skynet 底层的网络操作都是异步的方式（发送请求到网络线程，处理完毕后网络线程发送结果消息），为了能在 lua 层更好进行网络操作，skynet 提供了一个名为 socket 的 lua 模块，它利用了 lua 的协程机制，将异步的网络请求包装成同步调用，大大降低了我们开发时的心智负担。

在 lua 服务中，只需要把该模块 require 进来，就可以很方便进行网络操作了。
```lua
local socket = require "skynet.socket"
```

接下来，


## socket buffer


<hr>
**参考：**
- [Socket - Github Wiki](https://github.com/cloudwu/skynet/wiki/Socket)
- [TCP之Nagle算法&&延迟ACK](https://www.cnblogs.com/postw/p/9710772.html)
- [TCP_NODELAY 和 TCP_NOPUSH的解释](https://www.cnblogs.com/wajika/p/6573014.html)
- [结构体 Incomplete type](https://www.zhihu.com/question/29905170)