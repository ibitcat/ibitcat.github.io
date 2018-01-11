---
layout: post
title:  "每日笔记 —— 开源项目"
date:   2017-10-16
excerpt: "记录了工作中，每天的笔记，分类整理。开源项目学习部分。"
tag:
- 读书笔记
comments: true
---

## 1、redis

1. redis项目里面的网络框架（Redis ae事件驱动库）非常不错，称得上是短小精悍，我已经star了两个仓库，在我的star搜索关键字`redis`。
2. 关于**Redis ae事件驱动库**的讲解，网上有比较多的教程，例如：[教程1](http://www.wzxue.com/%E8%A7%A3%E8%AF%BBredis-ae%E4%BA%8B%E4%BB%B6%E9%A9%B1%E5%8A%A8%E5%BA%93/) 和 [教程2](https://m.oschina.net/blog/161077)

## 2、libev

1. windows下visual studio编译libev:

	1. 在vs下添加已存在的项目;
	2. 从vs中移除`ev_epoll.c`, `ev_kqueue.c`, `ev_poll.c`, `ev_select.c`, `ev_win32.c`几个文件;
	3. event.c中要包含winsock2.h头文件; config.h.in复制为config.h, 定义`HAVE_SELECT`和`HAVE_SYS_SELECT_H`
	4. 加上ws2_32.lib

	具体参考：[https://github.com/xmulyj/libev 里面的README](https://github.com/xmulyj/libev/blob/master/readme.txt)

2. libev 教程：可以参考这个[大神的博客](http://dirtysalt.info/)，里面搜索关键字`libev`