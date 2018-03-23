---
layout: post
title:  "TCP/IP协议族详解（三）"
date:   2018-03-22
excerpt: "这个系列的文章主要详细了解TCP/IP协议族，本篇主要介绍ARP协议"
tag:
- TCP/IP
comments: true
---


本系列文章是**教程：**[TCP、IP协议族详解](http://study.163.com/course/courseMain.htm?courseId=1003343002)的学习笔记。

该系列大概分为下面几个部分：

- 1、TCP/IP协议4层结构以及每层的作用
- 2、IP协议详解
- 3、ARP协议和RARP协议详解
- 4、ICMP协议详解
- 5、TCP协议详解
- 6、UDP协议详解

本文主要介绍TCP/IP网络体系中网络层的ARP协议。

## 1、IP地址和MAC地址

一般，我们知道网络中的计算机，会有ip地址和mac地址（物理地址），那么这两个地址有什么区别和联系？

**逻辑地址**（IP地址）：它工作在网络层，全局唯一（全球范围内，公网IP地址是唯一的），用软件实现。

**物理地址**（MAC地址）：它工作在网络接口层，本地范围唯一（同一个通讯子网内，可以均指以太网），用硬件实现(路由器，计算机bios芯片)，一般为48位，一般在设备出厂是，就已经将Mac地址烧录进入了设备中。

简单说就是一个在子网里面，MAC地址可以在这个子网络里面定位到不同的网络设备，IP地址可以在整个因特网中定位到不同的子网。

注：MAC地址长度为6byte（48bit），前24位为厂家代码，后24位为序列号，例如我现在的mac地址为：FC-AA-14-95-BC-xx，可以通过Mac地址查询网址，知道我的网卡生产厂商为：**GIGA-BYTE TECHNOLOGY CO.,LTD**，也就是技嘉主板，因为网卡直接集成在了主板中。


## 2、IP协议和ARP协议的关系

首先，我们想象这样一个生活中的场景，在新生入学时，一堆学生分配到一个教室，大家彼此不知道名字（无重名），但是每个人都有座位号，此时，如果学生A想要和学生B交流，A知道B的座位号（假如为10号），但是他不知道B的名字，那么A就开始大喊：“我是A，我坐在2号，座位号为10号的同学，你叫什么名字？”，然后B听到后，发现找的就是我，就回复A说：“我是B，我坐在10号”，后面，两人都知道名字后，就成为了好基友。

套用上面的例子，可以把这个教室认为是一个通讯子网，把座位号认为是IP地址（座位号是可以随意变动的），把名字认为是MAC地址（名字在这个教室内是唯一的），如果通过座位号找到名字，就是ARP协议负责的内容。

也就是说，ARP协议可以动态地在三层IP地址和二层MAC地址之间建立一种映射关系，用来获取目标IP地址所对应的MAC地址的。如果所要找的主机和源主机不在同一个局域网上，那么就要通过ARP 找到一个位于本局域网上的某个路由器的硬件地址，然后把分组发送给这个路由器，让这个路由器分组转发给下一个网络。剩下的工作就由下一个网络来做。

因为**ARP是为IP协议提供服务的**，所以，把ARP划分到了网络层。

因此，IP协议与ARP协议的关系就是，ARP是为IP协议提供服务，他比IP协议要稍微低一个层次。

![ARP协议与IP协议的关系](/images/posts/tcp-ip/arp-ip.png)


## 3、为什么有了IP地址还要使用Mac地址？

1. IP地址容易修改和变动，不能在网络上固定标示一台设备
2. Mac地址一般在出厂时被烧录到硬件中，不易修改，能在局域网中定位唯一一台设备
3. 从拓扑结构和分层上分析，IP地址属于网络层，主要功能是在**广域网范围**内路由寻址，选择最佳路由，而Mac地址是网络接口层要形成适合于在网络媒体上传输的数据帧。


## 4、ARP头部结构

下图为ARP协议头部格式（分组格式，28字节的ARP请求/应答）：
![ARP协议头部](/images/posts/tcp-ip/arp-head.png)

同IP协议一样，我依然结合抓包来解释每个字段的意义。

1、使用wireshark抓一对(请求和应答)ARP包，本机IP地址为：192.168.2.103，虚拟机IP地址为：192.168.2.172，结果如下图所示
![抓包](/images/posts/tcp-ip/arp-wireshark-0.png)
![请求](/images/posts/tcp-ip/arp-wireshark-1.png)
![应答](/images/posts/tcp-ip/arp-wireshark-3.png)

可以看到后面的二进制数据，这就是ARP协议报文的首部，一共28个字节。
![抓包结果](/images/posts/tcp-ip/arp-wireshark-2.png)

2、详细解释每个字段的意义

- 第1、2个字节（2byte）：值为0001，表示硬件类型为以太网，如图所示：`Hardware Type: Ethernet(1)`
- 第3、4个字节（2byte）：值为0800，表示协议类型为IPV4，如图所示：`Protocol Type: IPV4(0x0800)`
- 第5个字节：值为06，表示Mac地址长度，也就是6byte（单位为字节），如图所示：`Hardware Size:6`
- 第6个字节：值为04，表示IP地址长度，也就是4字节，同上，如图所示：`Protocol size:4`
- 第7、8个字节（2byte）：值为0001，1表示请求，2表示应答，3表示RARP请求、4表示RARP应答，上面两个抓包结果该字段是不一样的，分别是：`Opcode:request(1)`、`Opcode:reply(2)`。
- 第9到14个字节（6byte）：表示发送者的Mac地址，两图字段值不一样。
- 第15到18个字节（4byte）：表示发送者的Ip地址，两图字段值不一样。
- 第19到24个字节（6byte）：表示接收者的Mac地址，两图字段值不一样，对于请求包，因为就是要知道对方的MAC地址，所以请求包的该字段为0值。
- 第25到28个字节（4byte）：表示接收者的Ip地址，两图字段值不一样。


需要注意的是：**请求包是广播，而应答包是单播**。

3、ARP分组封装头部结构

上面分析了ARP头部的结构，下图表示了ARP分组封装的结构，它是在ARP头部前再加了以太网首部字段信息：
![ARP分组封装](/images/posts/tcp-ip/arp-head-1.jpg)

详细的字段分析，就不再赘述，可以参考上面的抓包图。


## 5、ARP缓存表以及ARP相关命令

### ARP高速缓存表的作用：

为了减少网络上的通信量，主机 A 在发送其 ARP 请求分组时，就将自己的 IP 地址到硬件地址的映射写入 ARP 请求分组。当主机 B 收到 A 的 ARP 请求分组时，就将主机 A 的这一地址映射写入主机 B 自己的 ARP 高速缓存中。这对主机 B 以后向 A 发送数据报时就更方便了。

注意：arp缓存表分为静态和动态两种方式，默认情况下ARP缓存的超时时限是**两分钟**。


### ARP命令

- `arp –d`清除本机arp缓存表
- `arp –a`查看本机当前arp表
- `arp –s`绑定arp地址（注意：本次机器生效，下次重启后会全部失效）


## 6、RARP协议

反向地址解析协议，解决MAC地址对于IP地址的一种映射关系，即知道目的主机的MAC地址，但是不知道IP地址，此时就需要用到RARP协议。一般用于无盘工作站，现在已经很少使用了。