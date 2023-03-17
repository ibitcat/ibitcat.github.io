---
layout: post
title: 在win10的linux子系统下搭建开发环境
date: 2018-06-06 19:16:00 +0800
tag: [环境搭建]

---

## 故事的起因

在很久很久之前（也就三五年前- -），我所有的跨平台开发的套路都是：在 windows 系统系统搞一个虚拟机，然后装个 linux 系统，再接着就是各种 yum、make...，永无止境。
最后就是 windows 和 linux 之间文件共享的搞法了，最初我用的是 linux mount windows 系统下的共享文件夹，在很长一段时间内都用得挺满意，
但是渐渐的问题就出现了，在 linux 下面 make 的时候，经常会出现 `cannot allocate memory`，我猜想是 linux 在快速创建文件时，无法及时在 windows 共享文件夹下生成文件。

为了解决上面的问题，我尝试采用 samba 服务，把 linux 下面的文件映射到 windows 系统下，但是这种方式也有缺点：

- 一是 samba 服务的安装比较繁琐，不管是 linux 还是 windows
- 二是 windows 下访问文件有时候速度会比较卡顿，经常导致 sublime 无法及时打开文件而卡顿


## linux子系统

在我尝试使用 NFS 来共享 linux 文件夹时，我搜到了一些关于 windows 的 linux 系统相关的教程，所以，我也打算尝试使用一下这个 win10 的新特性。

### 1、开启开发者模式

我的win10版本：win 10 家庭中文版，版本1803，系统版本：17134.81，算是最新的版本了。
开启步骤：设置 --> 更新和安全 --> 开发者选项 --> 选择开发者模式，然后重启系统。

### 2、安装linux 子系统

~~**提醒：**在这之前，先改变一下应用的安装路径，因为在应用商城安装的应用，默认是放在c盘下的`C:\Users\YourName\AppData\Local\Packages`，这样会占用很多C盘空间，所以，要先更改下应用的安装位置。~~
~~设置 --> 搜索【存储】 --> 点击【更改新内容的保存位置】 --> 修改【新的应用将保存到：】，然后选择一个盘后应用。~~
~~会弹出一个提示框，点击确定就可以了。~~
~~linux子系统必须安装到系统盘，所以上面的方法只能对普通应用有效。~~

下面就要开始安装linux子系统了：

首先，打开powershell，输入`bash`，或者按`win+q`快捷键后搜索bash
![打开powershell](/assets/image/posts/2018-06-06-01.png?style=centerme)

然后，按照提示，在浏览器输入网址 `https://aka.ms/wslstore`，会打开应用商城，然后选择一个 linux 系统安装，这里我选择我比较熟悉的ubuntu。
![打开powershell](/assets/image/posts/2018-06-06-02.png?style=centerme)

下载安装成功后，启动ubuntu，第一次启动时，需要等待几分钟，ubuntu系统初始化需要一些时间。
接着会提示你输入一个账号名，并给你的用户名一个密码。

> 注意：这里不是输入windows系统的账号和密码，是要给你的ubuntu子系统创建一个账号，另外需要注意的是，这个子系统的root密码在每次启动时随机生成的，所以一般我们用sudo就可以了，尽量不用root账号。

![ubuntu 安装](/assets/image/posts/2018-06-06-03.png?style=centerme)

安装好的子系统路径如图所示：
![ubuntu 安装路径](/assets/image/posts/2018-06-06-04.png?style=centerme)

好了，到这里为止，linux子系统就已经安装完成了。安装的ubuntu版本如下：

~~~shell
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
![wlsconfig](/assets/image/posts/2018-06-06-05.png?style=centerme)


## 配置开发环境

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

### 1、修改源
在安装这些组件之前，首要修改下载源为阿里云(**一定义要注意ubuntu版本代号与源的代号一致，不然apt的时候各种奇葩错误**)：

首先，备份。
~~~shell
cd /etc/apt/
sudo cp sources.list sources.list.backup
~~~

然后，清空之前的源，然后添加阿里云源。
~~~shell
sudo vim sources.list

# 输入阿里云源
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
~~~shell
sudo apt update
~~~


### 2、Ubuntu系统安装中文支持

可以参考[英文Ubuntu系统安装中文支持，中文UTF-8](http://www.4wei.cn/archives/1001458)。

第一步：安装中文包

`sudo apt install -y language-pack-zh-hans language-pack-zh-hans-base`

第二步：修改环境变量

编辑.bashrc文件（`vim .bashrc`），在文件最后添加：

~~~shell
export LANG="zh_CN.UTF-8"
export LANGUAGE="zh_CN:zh:en_US:en"
~~~

然后，输入命令`source .bashrc`，让环境变量生效。

第三步：重新设置本地配置

`sudo dpkg-reconfigure locales`


### 3、安装各种组件

- svn
~~~shell
sudo apt install subversion
svn --version
svn，版本 1.9.3 (r1718519)
   编译于 Aug 10 2017，16:59:15 在 x86_64-pc-linux-gnu
~~~

- ssh，安装好的子系统默认已经安装了ssh组件

- git
~~~shell
sudo apt install git
gi --version #git version 2.7.4
~~~

- msyql & sqlite3 （**注意：** mysqld服务需要手动启动，无法开机自启）
~~~shell
sudo apt autorem
sudo apt install mysql-server #注意：安装过程中会提示你输入root用户的密码
sudo apt install sqlite3
~~~
![mysql 5.7](/assets/image/posts/2018-06-06-06.png?style=centerme)

- gcc & g++ & make
~~~shell
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
~~~shell
ls -l /bin/sh #查看shell
sudo dpkg-reconfigure dash #选择否
ls -l /bin/sh #此时已经切换成bash
~~~

- sysv-rc-conf
参考[这篇文章](http://blog.51cto.com/12058118/1858680)，具体不再赘述。
~~~shell
sudo apt install sysv-rc-conf
sudo ln -s /usr/sbin/sysv-rc-conf /usr/sbin/chkconfig #因为已经习惯了centos的chkconfig
~~~

- readline
~~~shell
sudo apt install libreadline-dev
~~~


- 软连接(因为默认路径太长了，搜索文件不太好查找，所以将项目的目录软链接到其他目录)
~~~shell
mklink /J d:\h5-server C:\Users\Domi\AppData\Local\Packages\CanonicalGroupLimited.UbuntuonWindows_79rhkp1fndgsc\LocalState\rootfs\home\domi\server
~~~

**最后**，在安装的过程中，可能某些更改没有立即生效，而子系统又没有重启这种操作，所以，可以重启windows系统，一般我遇到的问题重启后都OK了。
例如： gcc链接stdc++.a的时候，明明已经安装了g++，但是链接的时候依然报错，尝试很多办法都无法解决，重启windows系统后就解决了。


## windows与linux子系统之间的文件共享

最开始，我修改linux子系统的项目源代码文件时，直接就是在windows下修改、新建文件。
但是，这里就出现了问题，仅仅是修改已经存在的文件，确实能够操作成功，但是如果是在windows下新建文件，在linux系统下却无法看到文件。
经过google后，原来上面这种操作是不允许的。


**正确的文件共享方式是**：

通过linux子系统下的`mnt目录`（挂载目录）来实现两个系统之间的文件共享，[微软官方的博客](https://blogs.msdn.microsoft.com/commandline/2016/11/17/do-not-change-linux-files-using-windows-apps-and-tools/)有明确的说明，并且给出了正确的方式。
主要原则就是：**不要在windows下直接修改或者新建linux子系统内的文件**。

举个栗子：

我的项目文件夹在`D:\proj-h5\trunk\server`，我在windows下新建一个文本`哈哈.txt`，此时在linux系统下，进入路径`/mnt/d/proj-h5/trunk/server`，此时就能看见新建的文件。
同样的，我在linux下修改这个文件，在windows下查看，修改也是成功的。
另外，为了在linux子系统下快速访问共享文件夹，可以将`/mnt`下的目录软链接到linux下的用户目录，例如:  

`domi@Domicat:~$ ln -s /mnt/d/proj-h5/trunk/server ~/h5-server`


## ConEmu作为linux子系统终端

ConEmu支持分屏，也支持多标签，这对开发来说是很方便的。我现在使用的版本是：`180528 preview`。这个版本已经支持了中文，下面就是ConEmu的设置了。

![ConEmu](/assets/image/posts/2018-06-06-07.png?style=centerme)

这里有一个小问题，方向键会失效，在某些情况下无法使用方向键移动光标，比如在上面的`sysv-rc-conf`工作界面中，无法使用方向键。但是旧的版本可以，
不过旧的版本有一个更蛋疼的问题，粘贴时无法粘贴全部的内容，而且粘贴后内容顺序会被打断，所以，建议使用新的版本。

为了解决方向键失效的问题，官方给了一些解决方案，具体请参考[这里](https://conemu.github.io/en/BashOnWindows.html#connector)，这里贴一下我的配置。

![ConEmu](/assets/image/posts/2018-06-06-08.png?style=centerme)

不过，还是有一些小瑕疵，比如tmux分屏后，分屏的分割线会莫名其妙消失或者重叠。所以，我还是采用了第一种方式，在需要使用方向键的时候直接用默认的wsl终端。


## WSL更改root密码

**2018-09-27更新**
具体可以参考这个[Unable to change the root password in Windows 10 WSL](https://askubuntu.com/questions/931940/unable-to-change-the-root-password-in-windows-10-wsl)。

~~~markup
1. in wsl, sudo passwd will change the password of the WSL root user.
2. in wsl, passwd will change the password of the current WSL user
3. in wsl, passwd [user] will change the password of any WSL user
4. in wsl, sudo generally asks for the password of the current WSL user.
5. in windows cmd.exe, youn can change what user you will login into when opening WSL - if that user is root, you will be able to use option 3.

	creators update and earlier: lxrun /setdefaultuser [user]
	fall creators update and later: ubuntu.exe config --default-user [user]
You probably want to change the password of the sudo-capable, non-root user.
~~~

我这里用的是从应用商店下载的ubuntu1604版本，因此，需要做一些小修改：

打开power shell，
~~~shell
PS C:\WINDOWS\system32> ubuntu1604 /?
Launches or configures a Linux distribution.

Usage:
    <no args>
        Launches the user's default shell in the user's home directory.

    install [--root]
        Install the distribuiton and do not launch the shell when complete.
          --root
              Do not create a user account and leave the default user set to root.

    run <command line>
        Run the provided command line in the current working directory. If no
        command line is provided, the default shell is launched.

    config [setting [value]]
        Configure settings for this distribution.
        Settings:
          --default-user <username>
              Sets the default user to <username>. This must be an existing user.

    help
        Print usage information.
PS C:\WINDOWS\system32> ubuntu1604 config --default-user root
~~~

然后，重启电脑，再打开wsl就是使用root用户登录了。

## WSL下安装LEMP stack
**2019-06-03更新**

安装流程参考：[如何在Ubuntu18.04上安装Linux、Nginx、MySQL和PHP](https://blog.csdn.net/wudics/article/details/84073350)

最后来一张截图，项目成功运行在linux子系统下：

![项目运行中](/assets/image/posts/2018-06-06-09.png)