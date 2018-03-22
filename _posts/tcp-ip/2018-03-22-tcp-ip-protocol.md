---
layout: post
title:  "TCP/IP协议族详解（一）"
date:   2018-03-22
excerpt: "这个系列的文章主要详细了解TCP/IP协议族"
tag:
- TCP/IP
comments: true
---

本系列文章是**教程：**[TCP、IP协议族详解](http://study.163.com/course/courseMain.htm?courseId=1003343002)的学习笔记。

该系列大概分为下面几个部分：
1、TCP/IP协议4层结构以及每层的作用
2、IP协议详解
3、ARP协议和RARP协议详解
4、ICMP协议详解
5、TCP协议详解
6、UDP协议详解

本文主要介绍TCP/IP网络体系四层结构，以及每层的作用。

### 1、ISO/OSI

英文全称为**Open Systems Interconnection Reference Model**(开放式通信系统互联参考模型)，它是国际标准化组织ISO(International Organization for Standardization)提出的一个框架，注意的是，OSI只是一个参考模型，现在的厂商并不是完全按照这个标准，而是参考了这个标准，所以才有现在比较常用的TCP/IP四层网络体系结构，它简化了OSI模型。

OSI标准分为7层，从下往上分别是： 

	- 物理层
	- 数据链路层
	- 网络层
	- 传输层
	- 会话层
	- 表示层
	- 应用层

![OIS/RM 七层模型](/images/posts/tcp-ip/osi.png)
