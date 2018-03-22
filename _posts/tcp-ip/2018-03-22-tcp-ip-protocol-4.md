---
layout: post
title:  "TCP/IP协议族详解（四）"
date:   2018-03-22
excerpt: "这个系列的文章主要详细了解TCP/IP协议族，本篇主要介绍ICMP协议"
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

本文主要介绍TCP/IP网络体系中网络层的ICMP协议。


## 1、IP协议的缺点

- 无差错报告和差错纠正机制
- 缺少一种为主机和管理查询的机制

例如：当IP数据报在网络中超过了它的TTL，那么路由器就会将这个数据报丢弃，但是没有对这个丢弃操作返回错误报告。

因为IP协议的这些缺点，所以就产生了ICMP协议。需要注意的是：ICMP没有纠正错误的机制。