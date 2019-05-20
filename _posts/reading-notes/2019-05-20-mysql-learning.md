---
layout: post
title: Mysql学习笔记
excerpt: "Mysql的学习笔记。"
date: 2019-05-20 12:00:00
tag: [Mysql,读书笔记]
comments: true

---


## 第一讲：一条sql查询语句是如何执行的？


- 大体来说，MySQL 可以分为Server层和存储引擎层两个部分：

	- server层，即服务层，提供核心的服务组件，包括链接器、查询缓存（mysql 8.0已经删除改功能）、分析器、优化器、执行器等。
	- 存储引擎层，负责数据存储和提取

![Mysql的两层框架](/images/posts/mysql/mysql框架.png) 

- 当链接器查询到你拥有的权限后，这个链接的所有权限判断逻辑，都依赖于此时读取到的权限。所以，一个连接成功后，即时管理员对你的权限进行了修改，也不会影响当前已存在的连接。

- 连接完成后，如果没有后续的动作，这个连接就处于空闲状态。可以使用命令：`show processlist;`来查询每个连接的状态。

每个字段的意义可以参考[这篇文章](https://www.cnblogs.com/f-ck-need-u/p/7742153.html)。

## 第二讲：一条sql更新语句是如何执行的？

- 与查询流程不一样的是，更新流程涉及到两个重要的日志模块：

	- redo log(重做日志)，专属于innoDB引擎。
	- binlog(归档日志)，属于msyql的server层，所有引擎都可以使用。

- 这两种日志的不同处：

	- redo log是innoDB引擎特有，而binlog是Mysql的server层实现的，所有引擎都可以使用。
	- redo log是物理日志，不是记录数据页“更新之后的状态”，而是记录这个页 “做了什么改动”；binlog是逻辑日志，记录的是这个语句的原始逻辑。
	- redo log是循环写的，日志空间会用完（类似 ring-buffer）；binlog是追加写入，当写入一定大小后，会切换到下一个，并不会覆盖。

- binlog的两种模式：
	- statement 模式，记录的是sql语句
	- row 模式，记录的是行的内容，且记录两条，更新前和更新后的行内容。

- redolog使用的是WAL技术（Write-Ahead Logging,预写式日志），关键是：先写日志，等不忙的时候再写磁盘。因为有了redolog，因此，即时数据库发生了异常重启，之前的记录也不会丢失。这种能力称之为**crash-safe**。



