---
layout: post
title: 在win10 linux子系统下搭建开发环境
date: 2018-06-06 19:16:00 +0800
excerpt: "在win10系统下，安装ubuntu linux子系统，并搭建linux开发环境。"
tag: [环境搭建]
comments: true

---

### 故事的起因

在很久很久之前（也就三五年前- - ），我所有的跨平台开发的套路都是：在windows系统系统搞一个虚拟机，然后装个linux系统，再接着就是各种yum、make...，永无止境。最后就是windows和linux之间文件共享的搞法了，最初我用的是linux mount windows系统下的共享文件夹，在很长一段时间内都用得挺满意，但是渐渐的问题就出现了，在linux下面make的时候，经常会出现`cannot allocate memory`，我猜想是linux在快速创建文件时，无法及时在windows共享文件夹下生成文件。

为了解决上面的问题，我尝试才有samba服务，把linux下面的文件映射到windows系统下，但是这种方式也有缺点：

- 一是samba服务的安装比较繁琐，不管是linux还是windows
- 二是windows下访问文件有时候速度会比较卡顿，经常导致sublime无法及时打开文件而卡顿


### win10 linux子系统

在我尝试使用NFS来共享linux文件夹时，我搜到了一些关于windows 的linux系统相关的教程，所以，我也打算尝试使用一下这个win10的新特性。

#### 1、开启开发者模式

我的win10版本：win 10 家庭中文版，版本1803，系统版本：17134.81，算是最新的版本了。

开启步骤：设置 --> 更新和安全 --> 开发者选项 --> 选择开发者模式，然后重启系统。

#### 2、安装linux 子系统

~~**提醒：**在这之前，先改变一下应用的安装路径，因为在应用商城安装的应用，默认是放在c盘下的`C:\Users\YourName\AppData\Local\Packages`，这样会占用很多C盘空间，所以，要先更改下应用的安装位置。~~
~~设置 --> 搜索【存储】 --> 点击【更改新内容的保存位置】 --> 修改【新的应用将保存到：】，然后选择一个盘后应用。~
~~会弹出一个提示框，点击确定就可以了。~~
~~linux子系统必须安装到系统盘，所以上面的方法只能对普通应用有效。~~

下面就要开始安装linux子系统了：

首先，打开powershell，输入`bash`，或者按`win+q`快捷键后搜索bash

![打开powershell](/images/posts/sublinux/powershell.png)
![打开powershell](/images/posts/sublinux/winq.png)


然后，按照提示，在浏览器输入网址`https://aka.ms/wslstore`，会打开应用商城，然后选择一个linux系统安装，这里我选择我比较熟悉的ubuntu。

![打开powershell](/images/posts/sublinux/mricosoftstore.png)


下载安装成功后，启动ubuntu，第一次启动时，需要等待几分钟，ubuntu系统初始化需要一些时间。接着会提示你输入一个账号名，并给你的用户名一个密码（注意：这里不是输入windows系统的账号和密码，是要给你的ubuntu子系统创建一个账号，另外需要注意的是，这个子系统的root密码在每次启动时随机生成的，所以一般我们用sudo就可以了，尽量不用root账号。）

![打开powershell](/images/posts/sublinux/installing.png)

安装好的子系统路径如图所示：
![打开powershell](/images/posts/sublinux/ubuntu.png)


好了，到这里为止，linux子系统就已经安装完成了。安装的ubuntu版本如下：

~~~
# 内核版本
domi@Domicat:~$ uname -a
Linux Domicat 4.4.0-17134-Microsoft #81-Microsoft Sun May 20 01:14:00 PST 2018 x86_64 x86_64 x86_64 GNU/Linux

# ubuntu版本
domi@Domicat:~$ cat /etc/issue
Ubuntu 16.04.4 LTS \n \l

domi@Domicat:~$
domi@Domicat:~$ cat /etc/lsb-release
DISTRIB_ID=Ubuntu
DISTRIB_RELEASE=16.04
DISTRIB_CODENAME=xenial
DISTRIB_DESCRIPTION="Ubuntu 16.04.4 LTS"
~~~

我们可以在powershell输入命令`wslconfig /list`，查看已安装的linux子系统。
![打开powershell](/images/posts/sublinux/wslconfig.png)


### 配置开发环境

目前我的开发需要的组件：

- svn
- git
- ssh
- mysql
- make
- gcc、g++
- vim
- sqlite3
- tmux
- sysv-rc-conf（ubuntu下的chkconfig）
- readline

#### 1、修改源
在安装这些组件之前，首要修改下载源为阿里云(**一定义要注意ubuntu版本代号与源的代号一致，不然apt的时候各种奇葩错误**)：

首先，备份。
~~~
cd /etc/apt/
sudo cp sources.list sources.list.backup
sudo vim sources.list
~~~

然后，清空之前的源，然后添加阿里云源。
~~~
#deb
deb http://mirrors.aliyun.com/ubuntu/ xenial main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-backports main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ xenial main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-proposed main restricted universe multiverse
deb http://archive.canonical.com/ubuntu/ xenial partner
~~~

最后update。
~~~
sudo apt update
~~~


#### 2、Ubuntu系统安装中文支持

可以参考[英文Ubuntu系统安装中文支持，中文UTF-8](http://www.4wei.cn/archives/1001458)。

第一步：安装中文包

`sudo apt install -y language-pack-zh-hans language-pack-zh-hans-base`

第二步：修改环境变量

编辑.bashrc文件（`vim .bashrc`），在文件最后添加：

~~~
export LANG="zh_CN.UTF-8"
export LANGUAGE="zh_CN:zh:en_US:en"
~~~

然后，输入命令`source .bashrc`，让环境变量生效。

第三步：重新设置本地配置

`sudo dpkg-reconfigure locales`


#### 2、安装各种组件

- svn

	~~~
	sudo apt install subversion
	svn --version

	svn，版本 1.9.3 (r1718519)
	   编译于 Aug 10 2017，16:59:15 在 x86_64-pc-linux-gnu
	~~~

- ssh，安装好的子系统默认已经安装了ssh组件

- git

	~~~
	sudo apt install git
	gi --version #git version 2.7.4
	~~~

- msyql & sqlite3

	~~~
	sudo apt autorem
	sudo apt install mysql-server #注意：安装过程中会提示你输入root用户的密码
	sudo apt install sqlite3
	~~~
![mysql 5.7](/images/posts/sublinux/mysql5.7.png)

- gcc & g++ & make

	~~~
	sudo apt install gcc
	sudo apt install g++
	sudo apt install make
	gcc --version #gcc (Ubuntu 5.4.0-6ubuntu1~16.04.9) 5.4.0 20160609
	g++ --version #g++ (Ubuntu 5.4.0-6ubuntu1~16.04.9) 5.4.0 20160609
	make --version #GNU Make 4.1
	~~~

- vim & tmux，默认已经安装了

- dash换成bash

	参考[这篇文章](https://blog.csdn.net/gatieme/article/details/52136411)。
	因为ubuntu默认的shell是`dash`，而我已经习惯了bash，所以换成了bash。

	~~~
	ls -l /bin/sh #查看shell
	sudo dpkg-reconfigure dash #选择否
	ls -l /bin/sh #此时已经切换成bash
	~~~

- sysv-rc-conf

	参考[这篇文章](http://blog.51cto.com/12058118/1858680)，具体不再赘述。
	~~~
	sudo apt install sysv-rc-conf
	sudo ln -s /usr/sbin/sysv-rc-conf /usr/sbin/chkconfig #因为已经习惯了centos的chkconfig
	~~~

- readline

	~~~
	sudo apt install libreadline-dev
	~~~

注意：在安装的过程中，可能某些更改没有立即生效，而子系统又没有重启这种操作，所以，可以重启windows系统，一般我遇到的问题重启后都OK了。

例如： gcc链接stdc++.a的时候，明明已经安装了g++，但是链接的时候依然报错，尝试很多办法都无法解决，重启windows系统后就解决了。


- 软连接(因为默认路径太长了，搜索文件不太好查找，所以将项目的目录软链接到其他目录)

~~~
mklink /J d:\h5-server C:\Users\Domi\AppData\Local\Packages\CanonicalGroupLimited.UbuntuonWindows_79rhkp1fndgsc\LocalState\rootfs\home\domi\server
~~~