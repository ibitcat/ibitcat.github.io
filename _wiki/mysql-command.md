---
layout: wiki
title: Mysql
categories: Mysql
description: Mysql 常用命令
keywords: Mysql, Mysql Command
---

### Mysql常用命令

| 功能                         	| 命令                                         	| 
|:-----------------------------	|:---------------------------------------------	|
| 连接远程数据库                	| mysql -h192.168.2.172 -uroot -p123456;       	| 
| 添加密码/修改密码             	| mysqladmin -u用户名 -p旧密码 password 新密码;  	|
| 显示所有库                    	| show databases;  |
| 切换库                       	| use 库名;  |
| 显示表结构                    	| desc 表名;   |
| 创建数据库           			| create database 库名;   |
| 删除数据库			           	| drop database 库名;   |
| 创建表           				| create table 表名(字段...);  [^footer1]|
| 删除表           				| drop table 表名;	   |
| 清空表数据           			| delete from 表名;   |
| 显示表中的记录           		| select * from 表名;|

### 数据库操作示例


脚注：

[^footer1]: 这里表示简单的命令结构，详细创建表的方式有很多种，请参考 **数据库操作示例**。
