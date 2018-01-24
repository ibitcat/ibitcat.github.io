---
layout: post
title:  "每日笔记 —— 开源项目和学习资料篇"
date:   2017-10-16
excerpt: "记录了工作中，每天的笔记，分类整理。本篇文章主要记录开源项目学习和自己收集的学习资料。"
tag:
- 读书笔记
comments: true
---

## 1、开源项目
### 1-1、redis

1. redis项目里面的网络框架（Redis ae事件驱动库）非常不错，称得上是短小精悍，我已经star了两个仓库，在我的star搜索关键字`redis`。
2. 关于**Redis ae事件驱动库**的讲解，网上有比较多的教程，例如：[教程1](http://www.wzxue.com/%E8%A7%A3%E8%AF%BBredis-ae%E4%BA%8B%E4%BB%B6%E9%A9%B1%E5%8A%A8%E5%BA%93/) 和 [教程2](https://m.oschina.net/blog/161077)

### 1-2、libev

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


### 1-3、Snowflake算法

1. Twitter-Snowflake算法，64位自增ID算法，可以用来替换UUID算法。关于该算法的介绍，可以参考[这篇文章](http://www.lanindex.com/twitter-snowflake%EF%BC%8C64%E4%BD%8D%E8%87%AA%E5%A2%9Eid%E7%AE%97%E6%B3%95%E8%AF%A6%E8%A7%A3/
)。

2. Snowflake算法，[C语言实现](https://github.com/korialuo/skynet/blob/master/lualib-src/lua-snowflake.c)。


### 1-4、skynet

1. [skynet架构](http://www.cnblogs.com/ychellboy/archive/2012/10/15/2723470.html)，基本的框架介 以及 [Skynet 设计综述](https://my.oschina.net/zengjs275/blog/719663)。

### 1-5、raft(分布式系统 RAFT 一致性算法)

1. [raft 简单介绍](http://thesecretlivesofdata.com/raft/)。 

### 1-6、groupcache

1. [groupcache（已star）](https://github.com/golang/groupcache)是一个分布式缓存 go 语言库,支持多节点互备热数据,有良好的稳定性和较高的并发性。寥寥2000来行代码完成了个lru cache库，核心只用一个list和一个map，出自brad大神之手（memcached作者）。


### 1-7、UUID生成

1. [**rfc4122**](https://tools.ietf.org/html/rfc4122)详细介绍了UUID的生成。在我自己的游戏服务器中有[简单的实现](https://github.com/shuimu98/game_server/blob/master/src/lualib-src/lbase64.c)并对生成的uuid进行了base64。

## 2、游戏开发

1. 游戏常用的编程设计模式：[游戏编程模式](http://gpp.tkchu.me/)。
2. 行为树：

	- [行为树的理解和学习](http://www.cnblogs.com/hammerc/p/5044815.html)
	- [行为树及其实现](http://godorz.info/2015/10/behaviourtree/)
	- [使用行为树(Behavior Tree)实现游戏AI](http://blog.csdn.net/kenkao/article/details/6099966)
3. 棋牌游戏开发：

	- [棋牌游戏感悟](https://zhuanlan.zhihu.com/cronlygames)

4. [基于Lua的游戏服务端框架简介](http://blog.csdn.net/lalate/article/details/51498869)，是以C/C++为底层，lua为上次的游戏框架为基础，做了比较全面的介绍。
5. 游戏的同步方式：**帧同步**和**状态同步**。前者适用于FPS/RTS游戏，后者适用于mmorpg游戏。

	参考： [状态同步与帧同步](http://www.cnblogs.com/sevenyuan/p/5283265.html)和[动作手游实时PVP帧同步方案（客户端）](https://www.cnblogs.com/shown/p/6108617.html)
