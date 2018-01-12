---
layout: post
title:  "每日笔记 —— 开源项目、算法"
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

2. 关于windows下编译libev的问题:
	- 1. cygwin下编译正常,有backend;
	- 2. visual studio中编译的话:

	(1)把config.h.in复制一份改为config.h,然后HAVE_SELECT和HAVE_SYS_SELECT_H都定义为1后;  
	(2)在event.c中包含winsock2.h头文件  
	编译ok, 有backend(select), 运行libev官网上的例子(去掉io watcher,只保留timer watcher)正常.

3. libev 教程：可以参考这个[大神的博客](http://dirtysalt.info/)，里面搜索关键字`libev`


## 3、Snowflake算法

1. Twitter-Snowflake算法，64位自增ID算法，可以用来替换UUID算法。关于该算法的介绍，可以参考[这篇文章](http://www.lanindex.com/twitter-snowflake%EF%BC%8C64%E4%BD%8D%E8%87%AA%E5%A2%9Eid%E7%AE%97%E6%B3%95%E8%AF%A6%E8%A7%A3/
)。

2. Snowflake算法，[C语言实现](https://github.com/korialuo/skynet/blob/master/lualib-src/lua-snowflake.c)。


## 4、skynet

1. [skynet架构](http://www.cnblogs.com/ychellboy/archive/2012/10/15/2723470.html)，基本的框架介 以及 [Skynet 设计综述](https://my.oschina.net/zengjs275/blog/719663)。



