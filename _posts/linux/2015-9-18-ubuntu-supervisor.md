---
layout: post
title: ubuntu下supervisor安装与使用笔记
date: 2015-9-18 09:10:00
updated: 2015-11-05 17:26:00
categories: [环境搭建]
comments: true

---

### 1、supervisor 介绍

它是个什么东东？用来干嘛的？  
supervisor是linux下的进程管理工具，python编写。用来监控进程的运行。比如说你要一直运行进程A，使用supervisor后，如果A进程崩掉了，
或者意外被kill了，supervisor可以快速帮你重新启动A，当然还有其他功能。待我后面一一挖掘。

<!-- more -->

### 2、supervisor 安装

**安装环境：**

> ubuntu 14.04  
> python 2.7.6

这里我选择在线安装，可以参考[官网的文档](http://supervisord.org/installing.html)， 使用Setuptools在线安装。需要先安装Setuptools，这里，我尝试了两种方式安装：

（1）、手动下载 ez_setup.py,[下载地址](https://pypi.python.org/pypi/setuptools#downloads),然后使用命令：  

	root@st-B85M-DS3H:~/tools# python ez_setup.py 
如果安装成功，会显示：

	Installed /usr/local/lib/python2.7/dist-packages/setuptools-18.2-py2.7.egg
	Processing dependencies for setuptools==18.2
	Finished processing dependencies for setuptools==18.2 

（2）、ubuntu下，直接使用apt-get安装

	root@st-B85M-DS3H:~/Projects# sudo apt-get install python-setuptools

如果安装成功，最后会显示：

	Unpacking python-setuptools (3.3-1ubuntu2) ...
	Setting up python-pkg-resources (3.3-1ubuntu2) ...
	Setting up python-setuptools (3.3-1ubuntu2) ...

输入命令：

	root@st-B85M-DS3H:~/Projects# easy_install --help
检查是否安装成功。

安装好setuptools之后，使用命令`easy_install supervisor` ,开始安装supervisor。  
当然，也可以下载源码，解压后，使用命令 `python setup.py install`来进行安装。

### 3、supervisor 配置
关于详细的配置，可以参[考这篇文章](http://www.2cto.com/os/201503/378878.html)。

创建默认的配置文件，`echo_supervisord_conf  >/etc/supervisord.conf`，

supervisor的配置文件路径： `vim /etc/supervisord.conf`，可以看到这里已经很多默认配置，只不过大部分都注释掉了。如果添加一个要监视的进程，可以再配置文件最后添加如下配置：  

	;command=/bin/echo;         supervisor启动时将要开启的进程。相对或绝对路径均可。若是相对路径则会从supervisord的$PATH变中查找。命令可带参数。
	;priority=999                   指明进程启动和关闭的顺序。低优先级表明进程启动时较先启动关闭时较后关闭。高优先级表明进程启动时启动时较后启动关闭时较先关闭。
	;autostart=true                 是否随supervisord启动而启动
	;autorestart=true               进程意外退出后是否自动重启
	;startsecs=10                   进程持续运行多久才认为是启动成功
	;startretries=3                 重启失败的连续重试次数
	;exitcodes=0,2                  若autostart设置为unexpected且监控的进程并非因为supervisord停止而退出，那么如果进程的退出码不在exitcode列表中supervisord将重启进程
	;stopsignal=QUIT                杀进程的信号
	;stopwaitsecs=10                向进程发出stopsignal后等待OS向supervisord返回SIGCHILD 的时间。若超时则supervisord将使用SIGKILL杀进程
	
### 4、启动和关闭 supervisord
（1）、启动

使用命令 `supervisord -c /etc/supervisord.conf`来启动，现在，来检查是否启动成功。  

	root@st-B85M-DS3H:~# ps -aux|grep supervisord
	root      2562  0.0  0.1  66132 12928 ?        Ss    9月16   0:19 /usr/bin/python /usr/local/bin/supervisord -c /etc/supervisord.conf
	root     17791  0.0  0.1 182920 10396 pts/21   Sl+  21:24   0:00 vim /etc/supervisord.conf
	root     17836  0.0  0.0  15940   960 pts/20   S+   21:32   0:00 grep --color=auto supervisord

可以看到，我已经成功启动了supervisor。之后所有的操作都可以用`supervisorctl`，具体参数`supervisorctl --help`

（2）、关闭  

	supervisorctl shutdown	

或

	username=user
	passwd=123
	/usr/local/bin/supervisorctl -u{$username} -p{$passwd} stop all
	/usr/local/bin/supervisorctl -u{$username} -p{$passwd} shutdown

### 5、使用 supervisor
现在我添加一个要守护的进程：   

	[program:domi-admin]
	command =/root/Projects/gopath/src/domi-admin/domi-admin
	autostart=true
	autorestart=true
	startsecs=3 

保存，重启`supervisorctl restart`。

输入 `supervisorctl`,会显示出当前正在监视的进程，例如：  

	root@st-B85M-DS3H:~# supervisorctl 
	domi-admin                       RUNNING   pid 17969, uptime 0:04:40
	supervisor> ?
	
	default commands (type help <topic>):
	=====================================
	add    clear  fg        open  quit    remove  restart   start   stop  update 
	avail  exit   maintail  pid   reload  reread  shutdown  status  tail  version
	
	supervisor> 

可以使用上面的命令进行更多的操作，例如 `tail -f domi-admin`，可以实时查看打印信息。  

	root@st-B85M-DS3H:~# supervisorctl 
	domi-admin                       RUNNING   pid 17969, uptime 0:06:58
	supervisor> tail -f domi-admin 
	==> Press Ctrl-C to exit <==
	读取的服务器个数:  16
	2015/09/17 21:42:48 [app.go:103] [I] http server Running on :8080
	2015/09/17 21:42:55 [router.go:845] [D] | GET        | /broadcast/add                           | 1.658723ms       | match      | /broadcast/add                           | 
	2015/09/17 21:42:55 [router.go:845] [D] | GET        | /login                                   | 33.091105ms      | match      | /login                                   | 

### 6、在浏览器中查看

这个功能很实用，而且配置非常简单，打开配置文件，找到[inet_http_server]节点，把前面的注释 ";" 去掉，  

	[inet_http_server]         ; inet (TCP) server disabled by default                                                                                                                                      
	port=192.168.1.112:9001        ; (ip_address:port specifier, *:port for all iface)
	username=user              ; (default is no username (open server))
	password=123               ; (default is no password (open server))

重启，然后在浏览器中输入 192.168.1.112:9001，就可以很方便的操作了。来一张图。如果不想每次都输入密码，可以注释掉username和password。

![pic](/images/posts/supervisor.png)

### 7、遇到的问题
（1）、Cannot open an HTTP server  

	root@VM-169-246-ubuntu:~/Projects/sti/src/domi-admin# supervisord -c /etc/supervisord.conf 
	Error: Cannot open an HTTP server: socket.error reported errno.EADDRNOTAVAIL (99)
	For help, use /usr/local/bin/supervisord -h

此问题是开启浏览器查看产生的，后面查了好久没有解决，后面发现这台远程机器有一个内网ip还一个公网ip，而在配置中，port 用了公网ip，想了想，把port配置内网ip，然后用nginx反向代理到内网ip。

具体想要达到的目的：

**服务器A**，有一个公网ip和一个内网ip，内网ip可以和内部的其他服务器通讯，在**服务器A**修改nginx配置，监听9002 端口（supervisor 监听的9001）,我需要在浏览器中输入公网ip:9002，能够反向代理到服务器A上的9001端口，从而达到在浏览器中操作supervisor的目的。

具体配置如下：  

	server{
	        listen 9002;          
	        server_name localhost;
	        charset utf-8;
	        location / {
	                proxy_redirect off;
	                proxy_set_header Host $host:9002;	#注意：这里要加上ngnix要监听的端口号
	                proxy_set_header X-Real-IP $remote_addr;
	                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	                proxy_pass http://10.251.169.246:9001;
	        }
	 }

reload配置并重启，  

	root@VM-169-246-ubuntu:/etc/nginx# service nginx reload  
		* Reloading nginx configuration nginx    [ OK ] 
	root@VM-169-246-ubuntu:/etc/nginx# service nginx restart
		* Restarting nginx nginx      			 [ OK ]     
 
在浏览器中输入 119.x.x.xxx:9002,然后发现死活进不去，检查 9001 和 9002端口，都显示正常。  

	root@VM-169-246-ubuntu:/etc/nginx# netstat -anp|grep 9002
	tcp        0      0 0.0.0.0:9002            0.0.0.0:*               LISTEN      15998/nginx     
	root@VM-169-246-ubuntu:/etc/nginx# netstat -anp|grep 9001
	tcp        0      0 10.251.169.246:9001     0.0.0.0:*               LISTEN      5585/python     

一直以为是nginx配置错误，最后发现是9002被防火墙屏蔽了，输入命令 :

	root@VM-169-246-ubuntu:/etc/nginx# ufw allow 9002
	Rule added
	Rule added (v6)


此时在浏览器输入 ip:port，终于正常了。

参考文章：

[参考1](http://blog.csdn.net/ithomer/article/details/19117777)  
[参考2](http://www.2cto.com/os/201503/378878.html)