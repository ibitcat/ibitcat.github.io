---
layout: post
title: "TCP/IP协议族详解（六）"
date: 2018-03-24
tag:
- TCP/IP

---


本系列文章是**教程：**[TCP、IP协议族详解](http://study.163.com/course/courseMain.htm?courseId=1003343002)的学习笔记。

该系列大概分为下面几个部分：

- 1、TCP/IP协议4层结构以及每层的作用
- 2、IP协议详解
- 3、ARP协议和RARP协议详解
- 4、ICMP协议详解
- 5、TCP协议详解
- 6、UDP协议详解

本文主要介绍TCP/IP网络体系中网络层的UDP协议。


## 1、UDP协议详解

它是与TCP协议相对的，它有两个特点：

- 无连接
- 不可靠

TCP像一个细心的小女子，UDP像一个糙汉子。

UDP协议的功能：
- 创建进程到进程间的通信（由端口号完成）
- 有限的差错控制，出现差错悄悄丢弃报文分组


## 2、UDP首部格式

UDP数据包报包含两个部分：UDP首部+数据

![UDP数据报](/assets/image/posts/2018-03-24-01.png?style=centerme)
![UDP首部格式](/assets/image/posts/2018-03-24-02.png?style=centerme)

UDP首部非常简单，占8个byte，下面是一个UDP报文的抓包结果：
![UDP首部抓吧](/assets/image/posts/2018-03-24-03.png?style=centerme)

字段解释：

- 第1、2字节：源端口
- 第3、4字节：目的端口
- 第5、6字节：报文长度，包括头部+数据，例如上图`Length:664`，单位为字节，即：Data(656+8首部)= 664byte
- 第7、8字节：校验和，同理TCP

## 3、应用层

最后，顺便提一下应用层常用的协议，以及它们所使用的传输层协议：

- 网页浏览

	- HTTP，使用TCP协议，端口80
	- SSL，建立在http基础上，端口443
 
- 文件传输

	- FTP，使用TCP协议，端口为20、21
	- TFTP，使用UDP，传送小文件

- E-Mail

	- SMTP，使用TCP，端口25
	- POP3，使用TCP，端口110

- 远程登录

	- Telnet，使用TCP，端口23
	- SSH，使用TCP，端口22

- 域名服务（DNS），使用UDP协议，端口53

- 网络管理（SNMP），使用UDP协议，端口161、162