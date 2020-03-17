---
layout: post
title: Mysql学习笔记
excerpt: "Mysql的学习笔记。"
date: 2019-05-20 12:00:00
tag: [数据库,读书笔记]
comments: true

---


### 第一讲：一条sql查询语句是如何执行的？


1. 大体来说，MySQL 可以分为Server层和存储引擎层两个部分：

	- server层，即服务层，提供核心的服务组件，包括链接器、查询缓存（mysql 8.0已经删除改功能）、分析器、优化器、执行器等。
	- 存储引擎层，负责数据存储和提取

	![Mysql的两层框架](/images/posts/mysql/mysql框架.png) 

2. 当链接器查询到你拥有的权限后，这个链接的所有权限判断逻辑，都依赖于此时读取到的权限。所以，一个连接成功后，即时管理员对你的权限进行了修改，也不会影响当前已存在的连接。

3. 连接完成后，如果没有后续的动作，这个连接就处于空闲状态。可以使用命令：`show processlist;`来查询每个连接的状态。

	每个字段的意义可以参考[这篇文章](https://www.cnblogs.com/f-ck-need-u/p/7742153.html)。

### 第二讲：一条sql更新语句是如何执行的？

1. 与查询流程不一样的是，更新流程涉及到两个重要的日志模块：

	- redo log(重做日志)，专属于innoDB引擎。
	- binlog(归档日志)，属于msyql的server层，所有引擎都可以使用。

2. 这两种日志的不同处：

	- redo log是**innoDB引擎特有**，而binlog是Mysql的server层实现的，**所有引擎都可以使用**。
	- redo log是**物理日志**，不是记录数据页“更新之后的状态”，而是记录这个页 “做了什么改动”；binlog是**逻辑日志**，记录的是这个语句的原始逻辑。
	- redo log是**循环写入**，日志空间会用完（类似 ring-buffer）；binlog是**追加写入**，当写入一定大小后，会切换到下一个，并不会覆盖。

3. binlog的两种模式：
	- statement 模式，记录的是sql语句
	- row 模式，记录的是行的内容，且记录两条，更新前和更新后的行内容。

4. redolog使用的是WAL技术（Write-Ahead Logging,预写式日志），关键是：先写日志，等不忙的时候再写磁盘。因为有了redolog，因此，即时数据库发生了异常重启，之前的记录也不会丢失。这种能力称之为**crash-safe**。

5. redo log的**两阶段提交**，其实做了三件重要的事情，包括：

	- 第2阶段：redo log的prepare
	- 第2阶段：写入binlog
	- 第2阶段：redo log的commit

6. 为什么我们需要两阶段提交？

	1. 假设mysql在第2阶段发生崩溃：
	
		- 重启恢复：后发现没有commit，回滚。
		- 备份恢复：没有binlog。
		- 恢复结果：一致。
	2. 假设mysql在第3阶段发生崩溃：

		- 重启恢复：虽没有commit，但满足prepare和binlog完整，所以重启后会自动commit。
		- 备份恢复：有binlog。
		- 恢复结果：一致。

	假设没有两阶段提交，那么，由于redo log 和 bin log是两个独立的逻辑，要么先写入redo log，后写入bin log，或者采用反过来的顺序。此时，若采用重启恢复和备份恢复后，都会发生结果不一致的情况。

	这里为了更形象的描述这个两阶段提交，我将教材中的例子也搬过来，方便理解和记忆“为什么我们需要两阶段提交？”。

	假设有这样一个table：

	~~~sql
	CREATE TABLE `test` (
	  `id` int(11) unsigned NOT NULL COMMENT 'ID',
	  `c` int(11) unsigned NOT NULL COMMENT '字段C',
	  PRIMARY KEY (`id`)
	) DEFAULT CHARSET=utf8;
	~~~

	现在有一个更新操作，“把id=2的行的字段c加1”。大概的流程如下图：

	![update执行流程](/images/posts/mysql/redolog-update.png)

7. `innodb_flush_log_at_trx_commit`和`sync_binlog`两个参数是控制MySQL磁盘写入策略以及数据安全性的关键参数。前者是控制redo log；后者是控制binlog。

8. `innodb_flush_log_at_trx_commit`参数设置：

	这里我附加一些额外的知识点，首先需要大致了解一下mysql物理日志操作步骤：

	~~~
	log_buff ---mysql写 (write)---> log_file ---OS刷新 (flush)---> disk
	~~~

	如图所示：
	![redo log策略](/images/posts/mysql/redolog-write.png)
	
	
	- 当设置该值为1时，每次事务提交都要做一次fsync，这是最安全的配置，即使宕机也不会丢失事务；
	- 当设置为2时，则在事务提交时只做write操作，只保证写到系统的page cache，因此实例crash不会丢失事务，但宕机则可能丢失事务；
	- 当设置为0时，事务提交不会触发redo写操作，而是留给后台线程每秒一次的刷盘操作，因此实例crash将最多丢失1秒钟内的事务。


9. `sync_binlog`参数设置：

	1. sync_binlog=0，**默认设置**，表示MySQL不控制binlog的刷新，由文件系统自己控制它的缓存的刷新。这时候的性能是最好的，但是风险也是最大的。因为一旦系统Crash，在binlog_cache中的所有binlog信息都会被丢失。
	2. sync_binlog>0，（1或者N）表示每N次事务提交，MySQL调用文件系统的刷新操作将缓存刷下去。
	
		最安全的就是sync_binlog=1了，表示每次事务提交，MySQL都会把binlog刷下去，是最安全但是性能损耗最大的设置。这样的话，在数据库所在的主机操作系统损坏或者突然掉电的情况下，系统才**有可能丢失1个事务**的数据。


	**推荐**：可以将sync_binlog设置为0，或者一个大于1的值（需要根据具体情况定），牺牲一定的一致性，来保证更高的并发和性能。
