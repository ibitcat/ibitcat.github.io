---
title:  "Mysql 通讯协议"
date: 2020-03-16
tag:
- 数据库
---

当我们使用 Mysql 客户端（命令行或者 Navicat 等）与 Mysql 服务器交互时，这些命令是以什么样的方式在网络上传输的？
客户端和服务器是怎样约定的？传输的包的格式是怎么的？带着这些疑惑，本文将对 MySQL 通讯协议进行一个较为深入的讲解。

> Mysql 客户端和服务器的通讯支持多种协议，例如： TCP 和 UDP 等。但是，目前使用最多的还是 TCP 连接，因此本文也只探讨 TCP 方式的连接。

现在，我们可以先想象 Mysql 通讯的整个过程：
服务器启动时，服务器会监听一个端口（默认3306端口），当客户端连接时，先经过 TCP 3次握手后，建立网络连接，然后进行身份认证。
认证通过后，这个连接就可以开始工作了，客户端发送命令，然后服务器接收命令、执行命令并返回结果。
当客户端要退出时，则向服务器发送退出命令，服务器返回成功后，则结束这个连接。

这个过程可以分为两个阶段：
- 连接认证阶段
- 命令执行阶段

不管是哪个阶段，通讯本质都是一个发送命令，响应命令的过程。在这个过程中，**MySQL 协议包就是通讯的最小单位**。
一个命令由一个协议包封装，一个请求的返回包可能是一个或者多个。


## 协议
什么是 Mysql 协议？

Mysql 协议是用于 Mysql 客户端与服务器之间的**应用层**协议，类似浏览器与 web 服务器通讯的 *http* 协议。
它主要用于：客户端连接、Mysql 代理以及 Mysql 服务器间的主从复制。同时，它还支持以下特性：

- SSL 加密传输
- 压缩传输
- 在连接阶段进行身份认证
- 在命令阶段接受命令并执行

有一点需要注意：在 MySQL 的 C/S 之间，虽然网络连接使用了 TCP 连接，但是通讯机制是一种半双工的形式，一个命令发送出去后，
需要接收完服务器的所有响应，才能继续下一个命令。这也是为什么 Mysql 包头中用一个字节来存放包的序列号。


## 包
### 包的压缩
MySQL 协议包分为：压缩（compressed ）和未压缩（uncompressed ）。通常我们都使用未压缩的方式来通讯。
如果要启用压缩传输，需要客户端和服务器都支持响应的压缩算法（例如：zlib），且都需要开启压缩传输功能。
不同的 MySQL 服务器版本支持的压缩算法也不一样，MySQL 5.7 只支持 zlib；MySQL 8 支持多种压缩算法，包括：`zlib, zstd, uncompresse`。

在 MySQL 8 中，可以通过修改服务器配置 my.cnf 来指定压缩算法。例如：
```cnf
[mysqld]
protocol_compression_algorithms=zlib,zstd,uncompressed
```
详细设置可以参考官方文档[Connection Compression Control](https://dev.mysql.com/doc/refman/8.0/en/connection-compression-control.html)。

在 MySQL 5.7 中，服务器默认以及开启了 zlib 压缩支持，客户端只需在连接服务器时加上 *`-C`* 选项（大写）即可。

虽然压缩会减少数据包的大小，但是它会增加 CPU 的资源消耗，在处理包之前，还需要额外消耗 CPU 来对数据解压缩。
一般情况下，数据库服务器都会同服务进程放在同一个物理机或者同一内网，网络带宽并不会成为瓶颈，因此，也不需要开启压缩功能。
**本文所讨论的也是基于未压缩的包**。

### 包的格式
不论压缩与否，数据包都分为两类：客户端发送的命令和服务器返回的响应。
所有的这些包，都使用了一个统一的包格式：4 byte 包头 + N byte 数据。

![Mysql 协议包](/assets/image/posts/2020-03-16-01.png)

如上图所示，一个 MySQL 协议包可以分为两个部分：包头和数据 payload。其中包头又分为：payload 的长度和包序列号。
如果 MySQL 客户端或服务器想要发送数据，就需要先将发送的数据按照 **2^24-1** 个字节分割，然后再在每个数据分片上加上头部，
最后交由 TCP 传输层发送。

可能你已经注意到一个问题，3 字节的 payload 长度限制了一个 MySQL 包只能容纳 16 MB的数据。那如果一个包的数据如果超过 16 MB，
应该怎么处理。在 4.0 之后的版本，MySQL 支持了超过 16 MB 的包。具体做法：
如果 payload 大于或等于 2^24-1 字节，则包头的 payload length 设置为（ff ff ff），按照这个规则一直分组，
直到分组的 payload 小于 2^24-1 字节，最后将这些分组一起发送出去。

另外，这些分组的包序列号也要依次 +1。还有一点需要注意：可能会出现最后一个包的 payload length 为 0 的情况。
例如：要发送的数据长度刚好等于 2^24-1 个字节。

包的序列号会在每次新的命令通讯时重置，虽然传输层可以保证数据包的传输顺序，但是此字段可以保证应用层的逻辑正确性。

## 基本数据类型
在 MySQL 协议中有两个基本数据类型：整型和字符串。

### 整型
整型值编码又分为两类：定长整型值（FixedLengthInteger）、带长度编码的整型值（LengthEncodedInteger）。

定长整型值其实就是将一个数值编码存放到适当个数的字节中，主要有 int<1>、int<2>、int<3>、int<4>、int<6>、int<8>。
分别对应 1、2、3、4、6、8 个字节长度的整型数值。这些整型值都采用**小端字节序**来存储。例如：一个值为 1 int<3> 的整数值，
它的编码： `01 00 00`。协议包头的 payload length 就是一个 int<3> 的整型值。

带长度编码的整型值，通常使用 1、3、4、9 个字节来存储数据，它会根据数字的大小选择合适的字节数来编码存储。
一般用在数据字段，例如，查询返回的结果集合，集合中的每一行数据就是按照该方式编/解码。
它的编码规则如下：
1. 如果值 < 251，则使用一个字节来存储；
2. 如果值 ≥ 251 and < (2^16), 则使用 0xfc + 2-byte 来存储（3 字节）；
3. 如果值 ≥ (2^16) and < (2^24), 则使用 0xfd + 3-byte 来存储（4 字节）；
4. 如果值 ≥ (2^24) and < (2^64), 则使用 0xfe + 8-byte 来存储（9 字节）；

> 如果数据包的第一个字节是长度编码整数，其字节值为 `0xfe`，则必须检查数据包的长度，以验证它是否有足够的空间容纳 8 字节整数。
如果不是，它可能是一个 EOF_packet。payload 的第一个字节的意义是依赖于上下文的。

### 字符串
字符串的字节编码方式，会稍微比整型数值复杂，主要包括：
- 定长字符串 `string<fix>`，类似 C 语言中的字符数组 `char str[10];`
- 以 NULL 结束的字符串 `string<NUL>`，类似 C 语言中的字符串 `char *pstr = "hello";`
- 变长字符串 `string<var>`，类似 C 语言的变长数组 `int num=10; char str[num];`
- 带长度编码的字符串，编码方式与带长度编码的整数一样（许多序列化库都是采用这种方式，例如：msgpack）
- 剩余字符串 `string<EOF>`

前面 4 种编码都比较好理解，第 5 种字符串编码可能会有些迷惑，其实也很简单，
如果字符串是数据包（playload）的最后一部分，则可以从总数据包长度减去当前位置来计算其长度。
它符合下面的公式：
```markup
字符串长度 = playload 长度 - payload 当前偏移
```
可以结合[下面的抓包示例](#客户端请求包)，会更容易理解。

## 客户端请求包
上面我们已经了解了 MySQL 协议包的格式，那么我们就可以清晰知道客户端的命令是怎么封装在请求包内的，
其本质就是以某种文本协议来处理协议包中的 payload 数据。

命令包格式如下：

![命令包结构](/assets/image/posts/2020-03-16-02.png)

下面我们通过抓包分析来分析验证命令阶段的通讯过程，以 `INSERT` 命令为例。
在这之前启动好 MySQL 服务器，并打开 Wireshark 开始抓包，准备工作都完成后，即可开始 MySQL 客户端的操作了。
当然，为了过滤掉其他包，可以使用下面的过滤规则。
```markup
tcp.port==3306 and mysql
```

首先，新建一个 table。
```sql
CREATE TABLE `test` (
  `id` int(10) unsigned NOT NULL COMMENT 'ID',
  `str` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '长字符串',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

然后，使用 MySQL 客户端工具，插入两行行数据。
```sql
insert into test values(1,"a");
insert into test values(2,"b");
```

此时，Wireshark 会捕获到多组 MySQL 包，我们选取最后一次插入来分析。

![INSERT COMMAND](/assets/image/posts/2020-03-16-03.png)

从抓包的结果可以很清晰的看到整个 MySQL 协议包的结构，即 **4 字节包头 + N 字节负载**。
包头部分在[包的格式](#包的格式)已经详细描述过，这里我们主要分析 payload 部分。
第一个字节用了标识客户端发送给服务器的是哪一个命令，上图中第一个字节为 `0x03`，
对应的命令是 `COM_QUERY`[^footer1]，编码格式为 `int<1>`，即定长整数值，
后面的 30 个字节正好是 sql 语句的字符串长度，编码类型为 `string<EOF>`，
该字符串长度的计算公式：`30 = 31(payload length) - 1(query command)`。


[^footer1]: 详细的命令列表本文未做详细解释，如需了解更多，参考官网文档[Command Phase](https://dev.mysql.com/doc/internals/en/command-phase.html)。

## 服务器返回包
服务器手动一个命令请求后，将对其进行处理并发送一个或者多个响应数据包。服务器返回包主要包括四类：
- 成功报告包
- 错误消息包
- 数据结束包
- 结果集合包


本节将讨论几种类型的响应。

### 成功报告包
服务器向客户端发送一个 OK packet，用来表示命令执行成功。一般是服务器对非结果集查询操作的成功响应，
如： `COM_PING`、`COM_QUERY`(例如：`INSERT`, `UPDATE`, `DELETE`, `ALTER TABLE`)、`COM_REFRESH` 等。

从 MySQL 5.7.5 开始，OK packet 也用于表示 EOF，而 EOF 包则被弃用。
可以通过下面两条规则来区分 OK packet 和 EOF packet：
- OK： 包的长度 > 7 且 payload 的第一个字节为 `0x00`
- EOF： 包的长度 < 9 且 payload 的第一个字节为 `0xfe`

下图是一个 MySQL 登录成功的 OK packet。

![OK packet](/assets/image/posts/2020-03-16-04.png)

### 错误消息包
当命令出现出现问题时，服务器则返回错误包。它的数据格式如下：

![ERR packet](/assets/image/posts/2020-03-16-05.png)

payload 第一个字节固定是 `FF`，接下来是用两个字节(小端)表示的错误码，
再接着是固定 6 个字节的字符串，且一定以字符 ***#*** 开头，例如：`#23000`，
最后就是错误消息字符串。下图就是一个主键冲突的错误返回包：

![主键冲突错误](/assets/image/posts/2020-03-16-06.png?style=centerme)

### 数据结束包
EOF 包（end-of-file），一般用来表示数据流已结束，跟我们操作文件流中的 EOF 标识类似。
但是 MySQL 的 EOF 包能表示更多意义：
- 结果集中的字段结束信息数据
- 结果集中的行数据结束信息数据
- 服务器对 `COM_SHUTDOWN` 命令的确认
- 服务器对 `COM_SET_OPTION` 和 `COM_DEBUG` 成功的响应

它的数据格式如下：

![EOF packet](/assets/image/posts/2020-03-16-07.png)

> 在 MySQL 客户端/服务器协议中，EOF 和 OK 数据包具有相同的用途，都用于标记查询执行结果的结束。
由于 OK 数据包中的 MySQL 5.7 中的更改（如会话状态跟踪），并且为了避免在 EOF 数据包中重复更改，
从 MySQL 5.7.5 开始，已经不再推荐使用 EOF 包。

当我们在处理 EOF 包时，必须检查 payload 的长度是否小于 9 （一般是 5 字节），以确保它是EOF数据包。
原因是，EOF 包的第一个字节固定是 `FE`，它与上面提到的[带长度编码的整型数](#整型)可能存在冲突，
如果是 `LengthEncodedInteger`，且第一个字节也是 `FE`，那么它就需要 9 个字节来进行编码。所以，
可以通过判断 payload 的长度来判断包是不是 EOF 包。

### 结果集合包
上面介绍的 3 种包，都是最基础的包，这一节介绍的 **结果集合包** 并不是一种通用的包，它是一系列包的集合。
例如 `SELECT`，`SHOW`，`CHECK`，`REPAIR` 等查询请求，这些请求并不止期望返回状态信息，还需要服务器返回结果集。

以 `SELECT` 为例，一次成功的 select 查询，可能返回多个 MySQL 包。下图是基于文本协议的 MySQL 查询流程图[^footer2]。

![Mysql query](/assets/image/posts/2020-03-16-08.png?style=centerme)

如果查询成功，返回的包可以分为 3 个部分：字段信息、数据集合、表示数据终止的 EOF。由于抓包结果过多，这里不再贴图。

## 总结
整个 MySQL 的通讯协议涉及到的内容是很多，本文也只是我对其中最基础的一部分的个人研究和理解，还有更多其他内容并未深入学习，
如：连接认证过程、SSL 加密传输、存储过程、事务等，待后续得空再继续深入。

[^footer2]: 图片从 MySQL [官方文档](https://dev.mysql.com/doc/dev/mysql-server/latest/page_protocol_com_query_response.html)获取。

## References
1. [MySQL 通讯协议](https://jin-yang.github.io/post/mysql-protocol.html) 
2. [Client/Server Communication](https://www.oreilly.com/library/view/understanding-mysql-internals/0596009577/ch04.html) 
3. [MySQL Client/Server Protocol](https://dev.mysql.com/doc/internals/en/client-server-protocol.html) 
4. [Client/Server Protocol](https://dev.mysql.com/doc/dev/mysql-server/latest/PAGE_PROTOCOL.html)

<hr>