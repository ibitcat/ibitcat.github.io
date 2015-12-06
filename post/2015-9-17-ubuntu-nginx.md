---
layout: post
title: ubuntu下nginx安装与使用笔记
date: 2015-9-17 15:37:00
updated: 2015-11-05 17:25:00
description: "ubuntu下搭建nginx环境以及过程中遇到的问题"
tags: [nginx]
comments: true

---

最近转过来开发app，一番折腾+研究，发现真的是隔行如隔山，好多东西都不能按照游戏服务器开发的思路来。

这一篇主要记录关于ngnix的相关知识，暂时只是简单了解一部分皮毛，如果以后遇到更深入的知识，会持续更新。

### 1、nginx 的安装
> 安装环境 ubuntu Release: 14.04  

<font color=#FF090f>**小知识：**</font>
 
	如何查看ubuntu版本号？
	1、cat /etc/issue
	2、lsb_release -a (此方法显示内容更详细)

>安装方法百度很多，这里我只实践了在线安装部分，也推荐在线安装。

#### 1-1 在线安装，推荐
`$sudo apt-get install nginx`

  ubuntu安装Nginx之后的文件结构大致为：  
  所有的配置文件都在	`/etc/nginx`		下，并且每个虚拟主机已经安排在了`/etc/nginx/sites-available`下  
  启动程序文件在		`/usr/sbin/nginx`  
  日志放在了 			`/var/log/nginx`	中，分别是access.log和error.log  
  并已经在 			`/etc/init.d/`		下创建了启动脚本nginx  
  默认的虚拟主机的目录设置在了`/usr/share/nginx/www`  

#### 1-2 源代码安装
>下载地址：http://nginx.org/download/

  安装过程很简单，如下：

	$./configure
	$make
	$make install
  安装成功之后，nginx放置在/usr/local/nginx目录下，主要的配置文件为conf目录下的nginx.conf，nginx的启动文件在sbin目录下的nginx文件。

### 2、nginx 启动
>注意：nginx 默认监听80端口，如果无法启动，请查看80端口是否被占用，请检查是否安装了apache，或者修改ngnix的配置文件，将ngnix的监听端口改为8080。有关nginx配置会在下面详细说明。

<font color=#FF090f>**小知识：**</font>
	
	查看端口占用情况：
	netstat -nltp|grep 80  t表示tcp协议;l表示仅列出有在 Listen (监听) 的服務状态
	或者
	netstat -anp|grep 80

#### 2-1 在线安装的启动过程
`$sudo /etc/init.d/nginx start`

#### 2-2 源代码安装的启动过程
命令如下：

	$cd /usr/local/nginx
	$sbin/nginx

当然，也可以使用 `service nginx start` 来启动。

启动后，在浏览器中输入 `http://192.168.1.112`,（ip地址根据个人情况而定，我的nginx搭建在ip：192.168.1.112的ubuntu上，然后在ip:192.168.1.106的window上访问。） 如果浏览器显示 **Welcome to nginx!** 则表示nginx启动成功。

### 3、nginx 配置

#### 3-1 基本配置
Nginx的配置文件是/etc/nginx/nginx.conf

- 修改listen端口： listen 8080
- 修改其他，待后面来搞

#### 3-2 反向代理配置
	
http反向代理：

	server{                 
         listen 80;          
         server_name 192.168.1.112:8080;
         charset utf-8;      
         location / {        
             proxy_redirect off;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_pass http://192.168.1.112:8080;
         }                   
     }

https反向代理：

	server{                 
         listen 443;         
         server_name 192.168.1.106:8087;
         ssl on;             
         ssl_certificate  /root/tools/cert.pem;
         ssl_certificate_key  /root/tools/key.pem;
         location / {        
             proxy_redirect off;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
             proxy_pass https://192.168.1.106:8087;
         }                   
     }

#### 3-3 负载均衡配置
nginx的负载均衡配置放在 upsteam 字段，例如：

	upstream a.com { 
      server  192.168.5.126:80; 
      server  192.168.5.27:80; 
	} 
	这里的 a.com 表示要负载均衡的 web server

注意：upstream字段要定义在 server{}外面，不能定义在server内。定义好upstream之后，需要在server内的proxy_pass引用下，注意要在前面加上 `http://`。

	server {
	  location / {
	    proxy_pass  http://test.net;
	  }
	}


修改配置后，使用命令重启：  

	root@VM-169-246-ubuntu:~# service nginx reload
 	* Reloading nginx configuration nginx 				[ OK ] 
或

	root@VM-169-246-ubuntu:~# service nginx restart

### 4、出现的问题

#### 4-1 配置好server后，总是显示 welcome to nginx
解决办法：  
vim打开 /etc/nginx/nginx.conf，这里的配置属于nginx的高层配置，，在http{}中找到一行：
`include /etc/nginx/sites-enabled/*`,把它注释掉，因为这里包含了一份default默认配置，打开default可以看到，这里也配置了一份server{}，监听了80端口，根据server的查询顺序，找到一个匹配后，就不再向后匹配，所以，如果不注释掉这一行的话，后面的所有的http反向代理都会被拦截。

#### 4-2 server nginx reload fail
解决办法：  
没办法，看日志。 nginx 的日志路径:`/var/log/nginx/*.log`，里面有详细的错误日志和access日志。最后发现 https 部分配置错误，

	server{
         listen 443;
         server_name 192.168.1.106:8087;
         ssl on;
         ssl_certificate  /root/tools/cert.pem;
         ssl_certificate_key  /root/tools/key.pem; #这里不要忘记key和cert
         location / {
             proxy_redirect off;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         }
     }

#### 4-3 server nginx restart fail
解决上面的问题，restart的时候，发现fail，查日志，提示 `bind() to 0.0.0.0:443 failed (98: Address already in use)`，很明显，这里应该是地址或者端口被占用，查找 443端口的占用情况：

	root@st-B85M-DS3H:/etc/nginx# netstat -nltp|grep 443 
	tcp6       0      0 :::443                  :::*                    LISTEN      1354/apache2 

很显然，443被占用，kill 1354, 然后restart，OK

>参考：

[参考1](http://www.cnblogs.com/languoliang/archive/2013/04/01/nginx.html "这里")  
[参考2](http://freeloda.blog.51cto.com/2033581/1288553 "这里")  
[参考3](http://www.cnblogs.com/xiaogangqq123/archive/2011/03/02/1969006.html "这里")  