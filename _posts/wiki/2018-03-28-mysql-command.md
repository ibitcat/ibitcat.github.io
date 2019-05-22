---
layout: post
title: Mysql 常用命令
date: 2016-09-13
excerpt: Mysql 常用命令
tag: [数据库]
---


### Mysql常用命令[^footer2]

| 功能                         | 命令                                         | 
|:-----------------------------|:---------------------------------------------|
| 连接远程数据库                	| mysql -h192.168.2.172 -uroot -p123456;		| 
| 添加密码/修改密码             	| mysqladmin -u用户名 -p旧密码 password 新密码;  	|
| 显示所有库                    	| show databases;  								|
| 切换库                       	| use 库名; 	 									|
| 显示表结构                    	| desc 表名;   									|
| 创建数据库           			| create database 库名;   						|
| 删除数据库			           	| drop database 库名;   							|
| 创建表           				| create table 表名(字段...);  [^footer1]		|
| 删除表           				| drop table 表名;	   							|
| 清空表数据           			| delete from 表名;   							|
| 显示表中的记录           		| select * from 表名;							|
| 导入.sql文件命令           		| use 库名;<br>source d:/mysql.sql;				|
| 命令行修改root密码           	| update mysql.user SET password=PASSWORD('新密码') WHERE User='root';<br>FLUSH PRIVILEGES;|
| 显示当前use的数据库名			| select database();							|
| 显示当前的user					| select user();								|
| 简单描述表结构，字段类型			| desc tabl_name;								|
| 查询表中的结构信息				| select * from information_schema.columns where table_schema='dbname' and table_name='tablename';|
| 查看表生成的DDL 				| show create table table_name;;				|
{: rules="all"}



### 数据库操作示例

- **创建表**

例如创建一张邮件表：

```sql
CREATE TABLE `mail` (
  `pid` int(10) unsigned NOT NULL COMMENT '玩家id,邮件接收者',
  `uuid` char(22) BINARY NOT NULL COMMENT '唯一id',
  `readed` tinyint(3) unsigned NOT NULL DEFAULT '0' COMMENT '邮件读取标志 0未读,1已读未取附件,2已读并取附件',
  `sender` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '邮件发送方ID',
  `createTime` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '创建时间(单位:秒)',
  `subject` varchar(24) BINARY NOT NULL DEFAULT '' COMMENT '标题(24个字符)',
  `content` varchar(512) BINARY NOT NULL DEFAULT '' COMMENT '正文(600个字符)',
  `attachment` text NOT NULL COMMENT '附件',
  PRIMARY KEY (`pid`,`uuid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='邮件';
```

创建一张玩家表：

```sql
CREATE TABLE `player` (
  `pid` int(11) unsigned NOT NULL COMMENT '角色id',
  `name` varchar(32) BINARY NOT NULL DEFAULT '0' COMMENT '角色名',
  `level` int(11) unsigned NOT NULL COMMENT '等级',
  `exp` int(11) unsigned NOT NULL COMMENT '经验',
  PRIMARY KEY (`pid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COMMENT='玩家基本信息';
```

- **查询**

```sql
select * from player; #查询所有记录
select pid,name from player where pid = 1; #按条件查询指定字段
```

- **删除**

```sql
delete from player; #清空所有记录
delete from player where pid = 1; #清空pid等于1的记录
```

- **插入**

```sql
insert into player(pid,name) values(1,"aaa"),(2,"bbb"); #指定字段的插入
insert into player values(1,"test001",5,100),(2,"test002",10,700);
#第二种形式的插入，values必须与字段一一对应
```

- **更新**

```sql
update player set name="fuckyou" where pid = 1; 
update player set name="domicat",level=100 where pid=1;
```

- **修改表结构**

```sql
alter table player ADD `entryId` int(11) unsigned NOT NULL COMMENT '职业';#添加字段
alter table player change `test` `createTime` int(11) unsigned NOT NULL COMMENT '创号时间'; #修改字段
alter table player modify column `entryId` int(11) UNSIGNED NOT NULL COMMENT '职业' after `server`; #更改字段位置
alter table player CHANGE `entryId` `entryId` int(11) UNSIGNED NOT NULL COMMENT '职业'; #修改字段注释
```

- **检查库或者表是否存在**

```sql
DROP DATABASE IF EXISTS db;
CREATE DATABASE IF NOT EXISTS db;
DROP TABLE IF EXISTS tb;
```

- **多表数据删除**

~~~sql
delete from t1 where 条件;
delete t1 from t1 where 条件;
delete t1 from t1,t2 where 条件;
~~~

- **数据库导出**

~~~sql
/*导出：*/
mysqldump -u 用户名 -p 数据库名 > 导出的文件名
mysqldump -u dbuser -p dbname > /root/dbname.sql /*导出表结构和数据*/
mysqldump -u dbuser -p -d dbname > /root/dbname.sql /*只导出表结构*/
~~~


- **数据库导入**

	- 先创建空的数据库
	
	~~~sql
	CREATE DATABASE cn_dalanh5_S10001 DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
	~~~

	- 选择数据库

	~~~sql
	use cn_dalanh5_S10001;	
	~~~

	- 导入sql数据
	~~~sql
	source /root/cn_dalanh5_S1.sql	
	~~~

	

>脚注：

[^footer1]: 这里表示简单的命令结构，详细创建表的方式有很多种，请参考 **数据库操作示例**。
[^footer2]: 参考：[http://www.jb51.net/article/18667.htm](http://www.jb51.net/article/18667.htm)