---
layout: post
date: 2015-3-4 21:43:00
title: mongoDB 常用命令
description: "mongoDB 比较常用的命令以及示例."
updated: 2015-3-4 21:43:00
categories: [数据库]
comments: true
---

网上收集了一部分（地址忘记了）， 自己也记录了一些(●—●)


### 1、超级用户相关

	use admin 					`#切换库`  
	db.addUser(ixigua,'pwd') 	`#增加或修改用户密码`  
	db.system.users.find() 		`#查看用户列表`  
	db.auth(ixigua,'pwd') 		`#用户认证`  
	db.removeUser('mongodb') 	`#删除用户`  
	show users 					`#查看所有用户`  
	show dbs 					`#查看所有数据库`  
	show collections 			`#查看所有的collection`  
	db.printCollectionStats() 	`#查看各collection的状态`  
	db.printReplicationInfo() 	`#查看主从复制状态`  
	db.repairDatabase() 		`#修复数据库`  
	db.setProfilingLevel(1) 	`#设置记录profiling，0=off 1=slow 2=all`  
	show profile 				`#查看profiling`  
	db.copyDatabase('mail_addr','mail_addr_tmp') `#拷贝数据库`  
	db.mail_addr.drop() 		`#删除collection`  
	db.dropDatabase() 			`#删除当前的数据库`

### 2、客户端连接  
MongoDB连接远程服务器的命令格式如下:  
`mongo 远程主机ip或DNS:MongoDB端口号/数据库名 -u user -p password`  
例子：

	mongo 192.168.1.200:27017/test -u user -p password  
	/usr/local/mongodb/bin/mongo 192.168.1.100:27017/testdb -u test -p 'pwd'


### 3、增删改

	db.foo.save({'name':'ysz','address':{'city':'beijing','post':100096},'phone':[138,139]}) 	`#存储嵌套的对象`  
	db.user_addr.save({'Uid':'yushunzhi@sohu.com','Al':['test-1@sohu.com','test-2@sohu.com']}) 	`#存储数组对象`  
	db.foo.update({'yy':5},{'$set':{'xx':2}},upsert=true,multi=true) 	`#根据query条件修改，如果不存在则插入，允许修改多条记录`  
	db.foo.remove({'yy':5}) 					`#删除yy=5的记录`  
	db.foo.remove()								`#删除所有的记录`  

### 4、索引

	db.things.ensureIndex({firstname: 1, lastname: 1}, {unique: true}); `#增加索引：1(ascending),-1(descending)`  
	db.user_addr.ensureIndex({'Al.Em': 1}) 		`#索引子对象`  
	db.deliver_status.getIndexes() 				`#查看索引信息`  
	db.deliver_status.getIndexKeys()  
	db.user_addr.dropIndex('Al.Em_1') 			`#根据索引名删除索引`  

### 5、查询

	db.foo.find() 								`#查找所有,相当于 mysql的select`  
	db.foo.findOne() 							`#查找一条记录`  
	db.foo.find({'msg':'Hello 1'}).limit(10) 	`#根据条件检索10条记录`  
	db.deliver_status.find({'From':'ixigua@sina.com'}).sort({'Dt',-1}) `#sort排序`  
	db.deliver_status.find().sort({'Ct':-1}).limit(1)  
	db.user_addr.count() 						`#count操作`  
	db.foo.distinct('msg') 						`#distinct操作`  
	db.foo.find({"timestamp": {"$gte" : 2}}) 	`#比较操作`  
	db.foo.find({'address.city':'beijing'}) 	`#子对象的查找`  

### 6、管理

	db.deliver_status.dataSize() 				`#查看collection数据的大小`  
	db.deliver_status.stats() 					`#查看colleciont状态`  
	db.deliver_status.totalIndexSize() 			`#查询所有索引的大小`

### 7、mongodb中的数组操作
可以参考：  
1、[http://blog.51yip.com/nosql/1639.html](http://blog.51yip.com/nosql/1639.html)；  
2、[http://www.2cto.com/database/201304/205027.html](http://www.2cto.com/database/201304/205027.html)；  
3、[http://howsun.blog.sohu.com/305176472.html](http://howsun.blog.sohu.com/305176472.html)

#### 更新数组中某个元素的值：
根据下标或使用“$”来更新。  
例如：

	db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), 
	"name" : "test001", 
	"friends" : [ { "name" : "test002", "age" : 20 }, { "name" : "test003", "age" : 30 } ] }

（1）、可以直接根据下标来更新

	#数组第一个元素的age字段更新为27
	>db.foo.update({name:"test001"},{$set:{"friends.0.age":27}})

	更新后的结果：
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), 
	"name" : "test001", 
	"friends" : [ { "name" : "test002", "age" : 27 }, { "name" : "test003", "age" : 30 } ] }

（2）、使用 “$” 来更新，需要配合find条件  

	> db.foo.update({"friends.name":"test003"},{$set:{"friends.$.age":77}}) 
	#查询出数组中 name为test003的元素，然后再更新，此时的update中的“$”表示查询语句 {"friends.name":"test003"} 查找到的数组下标。

	更新后的结果：
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), 
	"name" : "test001", "friends" : [ { "name" : "test002", "age" : 27 }, { "name" : "test003", "age" : 77 } ] }


#### 添加元素到数组中：
有两个操作符可以进行添加，$push 和 $addToSet。  
关于 $push的高级操作，例如：$push 和 $each,$sort,$slice,$position 结合使用。请查看上面的**参考1**的博客，里面有介绍。

（1）、$addToSet  
 如果数组中没有该数据，向数组中添加数据，如果该数组中有相同数组，不添加。

	#原始数据
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), 
	"name" : "test001", "friends" : [ { "name" : "test002", "age" : 27 }, { "name" : "test003", "age" : 77 } ] }
	
	#添加与数组第一个元素相同的值
	> db.foo.update({name:"test001"},{$addToSet:{"friends":{"name" : "test002", "age" : 27}}})
 
	#添加后的结果，发现无法重复插入相同的元素
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), 
	"name" : "test001", "friends" : [ { "name" : "test002", "age" : 27 }, { "name" : "test003", "age" : 77 } ] }

（2）、$push  
向数组末尾加入一个元素，但是它不检查数组中是否有相同的元素。示例同上，更新后的结果会出现重复的两个 { "name" : "test002", "age" : 27 }

#### 删除数组元素
有两个操作符进行数组元素的删除：$pop 和 $pull 已经根据数组索引$unset。  
（1）、$pop   
只能从数组的头部或者尾部pop元素，{$pop:{friends:1}}表示从数组尾部删除；如果要从头部删除，则把1改为-1。

  
	#原数据
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), 
	"name" : "test001", 
	"friends" : [ 
		{ "name" : "test002", "age" : 27 },
		{ "name" : "test003", "age" : 77 }, 
		{ "name" : "test002", "age" : 27 } 
	] }
	
	#从尾部弹出一个元素	
	> db.foo.update({name:"test001"},{$pop:{friends:1}})

	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), 
	"name" : "test001", 
	"friends" : [ { "name" : "test002", "age" : 27 }, { "name" : "test003", "age" : 77 } ] }

（2）、$pull  
可以删除数组中间的元素。

	#原数据
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), "name" : "test001", 
	"friends" : [ { "name" : "test002", "age" : 27 }, { "name" : "test004", "age" : 24 } ] }
	
	#删除 age=24的元素
	> db.foo.update({"name":"test001"},{$pull:{"friends":{"age" : 24}}})

	#删除后的数据 
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), "name" : "test001", 
	"friends" : [ { "name" : "test002", "age" : 27 } ] }

（3）、$unset  
该操作符只会设置数组元素为null，并不会改变数组的size。

	#根据索引删除
	> db.foo.update({"name":"test001"},{$unset:{"friends.1":1}})
	
	#删除后，我们发现元素设置为null了。
	> db.foo.find()
	{ "_id" : ObjectId("5631bc714c165179900185ae"), "name" : "test001", 
	"friends" : [ { "name" : "test002", "age" : 27 }, null ] }
	
	#通过$size，可以知道元素的长度还是2
	> db.foo.find({friends:{$size:2}})
	{ "_id" : ObjectId("5631bc714c165179900185ae"), "name" : "test001", 
	"friends" : [ { "name" : "test002", "age" : 27 }, null ] }