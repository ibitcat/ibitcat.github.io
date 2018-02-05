---
layout: post
title: linux 源码升级git
date: 2016-4-22 22:05:00
tag: [Git]
comments: true

---


centos6.0 yum安装的git版本是1.7.1，而git目前的版本已经到2.8.1了，为了跟上节奏，决定更新下git。

另外一个原因是在centos 使用git push的时候，出现错误：

~~~
error: The requested URL returned error: 401 Unauthorized while accessing https://github.com/shuimu98/domi-vimrc/info/refs
~~~

而根据网上找的[解决方案](http://houzhiqingjava.blog.163.com/blog/static/167399507201472343324562/)会导致提交到github上的commit记录有问题（提交者信息为`invalid-email-address`），如图：
![图1](/images/posts/gitpush.png) 

<!-- more -->


虽然可以正常提交，但是总是感觉别扭，网上说需要升级git版本，所以顺手就源码升级下git。


这里参照了这篇[教程](http://www.centoscn.com/image-text/install/2015/0225/4735.html)，另外记录了在实践中出现的问题以及解决方案。

具体步骤：

### (1) 卸载之前的git
	
	git --version
	git version 1.7.1
	yum remove git

### (2) 安装依赖的包

	sudo yum update
	sudo yum install curl-devel expat-devel gettext-devel openssl-devel zlib-devel 

如果Git在make的时候报错：`Can't locate ExtUtils/MakeMaker.pm in @INC`

解决方法如下：

```shell
yum -y install perl-devel
yum -y install perl-CPAN
```

或者安装**ExtUtils-MakeMaker**

```shell
wget http://files.directadmin.com/services/9.0/ExtUtils-MakeMaker-6.31.tar.gz
tar xvzf ExtUtils-MakeMaker-6.31.tar.gz
cd ExtUtils-MakeMaker-6.31
perl Makefile.PL
make
make install
```

### (3) 下载git源码并解压缩

	wget https://github.com/git/git/archive/v2.8.1.tar.gz
	tar -zxvf git-2.3.0.tar.gz
	cd git-2.8.1
	 
### (4) 编译安装

	make prefix=/usr/local/git all
	sudo make prefix=/usr/local/git install
 
### (5) 将git安装路径添加到PATH变量

	sudo vim /etc/bashrc
在最后一行添加 `export PATH=/usr/local/git/bin:$PATH` 保存退出
 
### (6) 验证是否安装成功

	source /etc/bashrc
	git --version
	git clone https://github.com/shuimu98/domi-vimrc.git

如果在clone过程中出现错误：`Failed connect to github.com:443; Operation now in progress`，不用担心，ctrl+c后再试一次，一般是网络的问题。
 
### (7) 配置git

	git config --global user.name "username"
	git config --global user.email "user@mail.com"