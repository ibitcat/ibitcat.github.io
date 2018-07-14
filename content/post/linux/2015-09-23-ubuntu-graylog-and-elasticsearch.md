---
layout: post
title: ubuntu elasticsearch和graylog安装与使用
date: 2015-09-23 11:25:00 +0800
updated: 2015-11-05 17:26:00
tags: [环境搭建]
comments: true

---

本文记录了如何在 ubuntu server 14.04下安装和使用elasticsearch-1.7、graylog-1.2。

### 1、起因

从游戏服务器转到app服务器，发现好多东西需要学习，在给项目添加logger的时候，用到了golang的一个开源日志库[logrus](https://github.com/gogap/logrus)（注意：这个版本是国人fork的版本，添加了文件日志和graylog日志支持），考虑到app后端会有大量日志的产生，将日志写到文件中，可能会出问题，所有就看了下graylog是个什么东西，初步了解，发现比较强大，虽然我比较讨厌java，但是没办法，项目需要。so~ 开始动手搞起来。

<!-- more -->

### 2、前期准备

从百度找了一堆的教程，都是很老以前的版本，最新的1.2界面更清新，于是，只能去[官网](http://docs.graylog.org/en/1.2/pages/installation.html)找帮助文档。

安装graylog之前，需要安装java环境、mongodb和 elasticsearch。

#### 2-1 安装java
这里参考了[http://www.linuxidc.com/Linux/2014-09/106445.htm](http://www.linuxidc.com/Linux/2014-09/106445.htm)

- **检查Java是否已经安装在Ubuntu上**

打开终端，使用下面的命令：**`java -version`**

如果你看到像下面的输出，这就意味着你并没有安装过Java:

	The program ‘java’ can be found in the following packages:
	*default-jre
	* gcj-4.6-jre-headless
	* openjdk-6-jre-headless
	* gcj-4.5-jre-headless
	* openjdk-7-jre-headless
	Try: sudo apt-get install

- **在Ubuntu和Linux Mint上安装Java**

看了各种类型‘Java’的不同之后，让我们看如何安装他们。

在Ubuntu和Linux Mint上安装JRE，打开终端，使用下面的命令安装JRE：**`sudo apt-get install default-jre`**  
在Ubuntu和Linux Mint上安装OpenJDK，在终端，使用下面的命令安装OpenJDK Java开发工具包：**`sudo apt-get install default-jdk`**  
特殊地，如果你想要安装Java 7或者Java 6等等，你可以使用openjdk-7-jdk/openjdk-6jdk，但是记住在此之前安装openjdk-7-jre/openjdk-6-jre。


#### 2-2 安装mongodb

因为之前已经安装了mongdb，就不在记录，个人感觉mongodb官方的帮助非常清新，一路下来，完全没错误。给个地址[http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/)

#### 2-3 安装elasticsearch

**重点部分**

这货真难搞（其实是我linux用的不够熟练），有两种安装方式：

- 下载deb包安装

		wget https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-1.7.2.deb
		dpkg -i elasticsearch-1.7.2.deb
		cp cp /usr/share/elasticsearch/bin/elasticsearch /etc/init.d/    #添加到启动脚本

- apt-get 安装

		#根据官网的教程：
		# 安装key
		wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -

		# 添加软件源
		echo "deb http://packages.elastic.co/elasticsearch/1.7/debian stable main" >> /etc/apt/sources.list

		# 更新apt-get软件源
		sudo apt-get update

		# 安装
		sudo apt-get install elasticsearch

<font color="#FF090f">小知识：</font>

ubuntu 官方的源下载速度很慢，可以更改为国内的镜像，如 163、阿里等。[ubuntu源列表](http://wiki.ubuntu.org.cn/%E6%BA%90%E5%88%97%E8%A1%A8)


**注意：** 使用apt-get 安装后，不能使用 `sudo /usr/share/elasticsearch/bin/elasticsearch`来启动，否则会报下面的错误：
  
	~ $ sudo /usr/share/elasticsearch/bin/elasticsearch
	Failed to configure logging...
	org.elasticsearch.ElasticsearchException: Failed to load logging configuration
	at org.elasticsearch.common.logging.log4j.LogConfigurator.resolveConfig(LogConfigurator.java:117)
	at org.elasticsearch.common.logging.log4j.LogConfigurator.configure(LogConfigurator.java:81)
	at org.elasticsearch.bootstrap.Bootstrap.setupLogging(Bootstrap.java:94)
	at org.elasticsearch.bootstrap.Bootstrap.main(Bootstrap.java:178)
	at org.elasticsearch.bootstrap.Elasticsearch.main(Elasticsearch.java:32)
	Caused by: java.nio.file.NoSuchFileException: /usr/share/elasticsearch/config
	at sun.nio.fs.UnixException.translateToIOException(UnixException.java:86)
	at sun.nio.fs.UnixException.rethrowAsIOException(UnixException.java:102)
	at sun.nio.fs.UnixException.rethrowAsIOException(UnixException.java:107)
	at sun.nio.fs.UnixFileAttributeViews$Basic.readAttributes(UnixFileAttributeViews.java:55)
	at sun.nio.fs.UnixFileSystemProvider.readAttributes(UnixFileSystemProvider.java:144)
	at sun.nio.fs.LinuxFileSystemProvider.readAttributes(LinuxFileSystemProvider.java:97)
	at java.nio.file.Files.readAttributes(Files.java:1686)
	at java.nio.file.FileTreeWalker.walk(FileTreeWalker.java:109)
	at java.nio.file.FileTreeWalker.walk(FileTreeWalker.java:69)
	at java.nio.file.Files.walkFileTree(Files.java:2602)
	at org.elasticsearch.common.logging.log4j.LogConfigurator.resolveConfig(LogConfigurator.java:107)
	... 4 more
	log4j:WARN No appenders could be found for logger (node).  


解决办法参考 ：

[http://stackoverflow.com/questions/24975895/elasticsearch-cant-write-to-log-files](http://stackoverflow.com/questions/24975895/elasticsearch-cant-write-to-log-files)  
[https://discuss.elastic.co/t/running-with-supervisor-via-command-line/28798](https://discuss.elastic.co/t/running-with-supervisor-via-command-line/28798)

>If you installed using a packet manager like yum or apt-get you should not start elasticsearch this way.Try to use the service: for instance /etc/init.d/elasticsearch.

<font color="#FF090f">小知识：</font>

	关于 /etc/init.d/ 目录，里面放的是启动脚本，类似于windows的开机启动项， 该命令的结构大致如下所示：
	     /etc/init.d/command 选项
	comand是实际运行的命令，选项可以有如下几种：
		start
		stop
		reload
		restart
		force-reload
	大多数的情况下，你会使用start,stop,restart选项。


#### 2-4 测试elasticsearch
修改 es配置，配置路径： `/etc/elasticsearch/elasticsearch.yml`，重启。

- linux下  输入：**`curl “http://192.168.1.112:9002”  #9002是ES默认对外的端口`**
- windows下

直接在浏览器中输入`http://192.168.1.112:9002`

如果输出如下信息，则表示启动成功：  

	root@st-B85M-DS3H:~# service elasticsearch start #启动ES
	 * Starting Elasticsearch Server                                                                                                                                                                             * Already running.                             [ OK ] 
	root@st-B85M-DS3H:~# curl "http://192.168.1.112:9200" #测试
	{
	  "status" : 200,
	  "name" : "Rintrah",
	  "cluster_name" : "elasticsearch",
	  "version" : {
	    "number" : "1.7.2",
	    "build_hash" : "e43676b1385b8125d647f593f7202acbd816e8ec",
	    "build_timestamp" : "2015-09-14T09:49:53Z",
	    "build_snapshot" : false,
	    "lucene_version" : "4.10.4"
	  },
	  "tagline" : "You Know, for Search"
	}

另外，也可以通过查看日志来检测ES是否成功启动（注意：log文件的名字是你在 es配置文件内配置的**cluster.name**字段的名字）：  

	root@st-B85M-DS3H:/etc/graylog/server# cat /var/log/elasticsearch/graylog-production.log
	[2015-09-22 17:34:21,346][INFO ][node                     ] [Morgan Le Fay] version[1.7.2], pid[21881], build[e43676b/2015-09-14T09:49:53Z]
	[2015-09-22 17:34:21,346][INFO ][node                     ] [Morgan Le Fay] initializing ...
	[2015-09-22 17:34:21,455][INFO ][plugins                  ] [Morgan Le Fay] loaded [], sites []
	[2015-09-22 17:34:21,531][INFO ][env                      ] [Morgan Le Fay] using [1] data paths, mounts [[/ (/dev/sda1)]], net usable_space [47.6gb], net total_space [98.3gb], types [ext4]
	[2015-09-22 17:34:23,980][INFO ][node                     ] [Morgan Le Fay] initialized
	[2015-09-22 17:34:23,980][INFO ][node                     ] [Morgan Le Fay] starting ...
	[2015-09-22 17:34:24,042][INFO ][transport                ] [Morgan Le Fay] bound_address {inet[/0:0:0:0:0:0:0:0:9300]}, publish_address {inet[/192.168.1.112:9300]}
	[2015-09-22 17:34:24,057][INFO ][discovery                ] [Morgan Le Fay] graylog-production/V659jaOGRF6PYF3L0xiFcw
	[2015-09-22 17:34:27,824][INFO ][cluster.service          ] [Morgan Le Fay] new_master [Morgan Le Fay][V659jaOGRF6PYF3L0xiFcw][st-B85M-DS3H][inet[/192.168.1.112:9300]], reason: zen-disco-join (elected_as_master)
	[2015-09-22 17:34:27,842][INFO ][http                     ] [Morgan Le Fay] bound_address {inet[/0:0:0:0:0:0:0:0:9200]}, publish_address {inet[/192.168.1.112:9200]}
	[2015-09-22 17:34:27,842][INFO ][node                     ] [Morgan Le Fay] started
	[2015-09-22 17:34:27,883][INFO ][gateway                  ] [Morgan Le Fay] recovered [1] indices into cluster_state

### 3、下载安装graylog

看[官网的帮助文档](http://docs.graylog.org/en/1.2/pages/installation/operating_system_packages.html)，找到适合自己系统的安装文档，我的系统是 `ubuntu server 14.04`，按照文档给出的命令，一路下来，到 `sudo apt-get install graylog-server graylog-web` ，这里就一直显示在 `0%[working]`，一直这样，我以为又是可恶的 GFW，后面翻墙后，还是一直显示 0，最后等了好久，才下载完，这里折腾了好久。最后总结出来一个经验： **妈的，linux下面的命令，一定要等它返回结果，不要随便ctrl+c了**。浪费我好多时间。

### 4、修改graylog-server配置

server端配置路径 ： `/etc/graylog/server/server.conf`

glaylog-server的配置可以参考：

[http://kernal.blog.51cto.com/8136890/1426888/](http://kernal.blog.51cto.com/8136890/1426888/)  
[http://askubuntu.com/questions/639418/how-to-install-and-setup-graylog-server-and-graylog-web-on-ubuntu-from-repositro](http://askubuntu.com/questions/639418/how-to-install-and-setup-graylog-server-and-graylog-web-on-ubuntu-from-repositro)  
[http://my.oschina.net/fitnessefan/blog/464351](http://my.oschina.net/fitnessefan/blog/464351)  


### 5、启动/关闭 graylog-server
**注意：** 最新版本的graylog-1.2已经重命名为graylog，而不再叫之前的graylog2了。所以，需要注意路径名称的问题。

两种操作方式：

- 开启：start graylog-server  ； 关闭：stop graylog-server
- 开启：java -jar /usr/share/graylog-server/graylog.jar server ； 关闭：ctrl+c

检查是否开启成功：

**方式1 - 查看日志**  

	root@st-B85M-DS3H:/usr/share/graylog-server# tail -f /var/log/graylog-server/server.log 
	2015-09-23T09:30:46.582+08:00 INFO  [ServerBootstrap] Graylog server up and running.  

**方式2 - 查看进程**  

	ps -aux|grep graglog-server  

**方式3 - 查看端口** 

	netstat -nlpt|grep 12900  # server端默认端口为 12900  

### 6、修改graylog-web配置
web端配置路径 ： `/etc/graylog/web/web.conf`

	graylog2-server.uris="http://192.168.1.112:12900/" # server端地址
	application.secret="xxx" # secret，需要和server端配置的 password_secre字段的值一样  

### 7、启动graylog-web

	start graylog-web

然后，在浏览器中输入， http://192.168.1.112:9000（web的默认端口为 9000），输入server配置里面的 root_username 和 root_password_sha2 ，注意，密码是hash之后的值。登陆成功，如图。

![graylog-web](/images/posts/graylog-web.png)

### 8、使用GELF写日志

首先，要在graylog-web创建一个input：打开浏览器，在网页导航栏 System --> Input，选择 GELF HTTP ，点击 Launch new Input，输入
title，port，例如： title：gelf-http-12201，port：12201，表示可以通过http 的 12201端口写入日志。

测试： 

	curl -XPOST http://192.168.1.112:12202/gelf  -p0 -d '{"short_message":"Hello there,fuck you", "host":"www.baidu.com", "facility":"test", "_foo":"bar"}'  

刷新页面，会出现刚写入的日志。 

之前对于graylog存储日志的概念一直不是很清楚，一直以为日志是存在mongodb中的，可是在mongodb又找不到插入成功后的数据，后面通过慢慢摸索elasticsearch，慢慢有了一些理解，应用程序通过gelf吐出日志到graylog，graylog将日志存到elasticsearch，说白了，就是graylog对elasticsearch的一个封装，它提过一个友好的界面，给你来管理日志。

关于日志的物理存储路径，默认是在 `/usr/share/elasticsearch/data` 下面，但是不知道为什么我本机的好像存储在了 `/var/lib/elasticsearch`。也可以通过修改ES的配置来更改存储路径。

### 9、elasticsearch 使用与head插件

关于elasticsearch，我也是第一次接触，很多东西需要时间来慢慢摸索和熟悉。  
这里有一个国人翻译的es的教程，让我知道了ES是个什么东西，请参考：[http://es.xiaoleilu.com/](http://es.xiaoleilu.com/) 。   
关于head插件的安装，请参考 ：[http://my.oschina.net/pangyangyang/blog/361753](http://my.oschina.net/pangyangyang/blog/361753)，当然，博主还介绍了其他的插件，这个等后面需要的时候，我再尝试使用。  
ES索引的增删改查，参考[http://blog.csdn.net/gdutliuyun827/article/details/40077013](http://blog.csdn.net/gdutliuyun827/article/details/40077013)