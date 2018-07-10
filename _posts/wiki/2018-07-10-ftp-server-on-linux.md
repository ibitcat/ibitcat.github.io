---
layout: post
title: 在linux下搭建ftp服务
date: 2018-07-10 14:21:00 +0800
excerpt: "在linux下搭建ftp服务，同时支持匿名、虚拟用户"
tag: [环境搭建]
comments: true

---

### 1、需求

公司要一个ftp服务器，用来存储一些常用软件以及公司内部的一些资料，因此至少需要两个用户，一个是需要密码登陆的私有账户，其他的匿名用户。
因为，匿名用户静止上传，所以为了上传文件，又额外加了一个public的虚拟用户，用来上传文件，但是这个public是不能访问私有用户的用户目录的。

> 一般情况下，ftp最好不要提供匿名用户上传的权限，当然非要匿名上传也是可以的，网上有教程，这里我还是倾向于建立一个公用的虚拟用户来实现上传。

例如：
- 私有账户kgogame，密码：123，这是个虚拟用户，它的主目录为：/var/ftp/guest
- 公共账户public，密码：123，也是一个虚拟用户，它的主目录：/var/ftp/pub，可以匿名访问



### 2、搭建FTP服务器

#### 2-1、vsftpd支持三类用户

1. 匿名用户，也就是不需要输入密码就可登录ftp服务器的用户，这个用户名通常是ftp或anonymous; 与匿名用户有关的设置多以 anon_选项开头。
2. 本地用户，也就是你Linux系统上可登录到系统的用户，这些用户是在系统上实实在在存在的用户。通常会有自己的home，shell等。与本地用户有关的设置多以local_开头或包含local_的选项。
3. 虚拟用户，只对ftp有效的用户。这些用户不可以登录Linux系统，只可以登录ftp服务器。其实就是一个本地用户映射成多个只对ftp服务器有效的虚拟用户。虚拟用户可以有自己的ftp配置文件，因此通常利用虚拟用户来对ftp系统的不同用户制定不同的权限，以达到安全控制的目的。与虚拟用户有关的设置以guest_开头。

如果你只是想用ftp实现对自己的共享，你可以开启本地用户；
如果你想对很多人共享，那你可以用匿名用户；
如果你需要针对不同的用户群给予不同的权限，那你就要设置更复杂的虚拟用户了。


#### 2-2、安装vsftpd

我的linux版本：centos 6.9 64位

运行命令：`yum install vsftpd`
然后，测试是否正常：`sudo service vsftpd start`，
如果服务能启动，尝试登陆ftp，此时应该是可以匿名登陆的。

#### 2-3、创建vsftpd服务的宿主用户

在安装完vsftpd后，会创建一个名为ftp的系统用户，可以通过`cat /etc/passwd`查看。例如:

`ftp:x:14:50:FTP User:/var/ftp/pub:/sbin/nologin`

`/sbin/nologin`表示这个用户是不能用来登陆的，该用户仅用来支持Vsftpd服务用，因此没有许可他登陆系统的必要，并设定他为不能登陆系统的用户。

**注意**：默认的主目录是`/var/ftp`，因为我的需求，所以，我把这个账户的主目录改成了`/var/ftp/pub`，使用命令`usermod -d /var/ftp/pub ftp`。


#### 2-3、创建虚拟用户的宿主用户

为了和默认ftp系统用户区分开，我这里额外创建了一个系统用户，用来支持私有ftp账户。

~~~
mkdir /var/ftp/guest
mkdir /var/ftp/guest/kgogame
sudo useradd guest -d /var/ftp/guest -s /bin/nologin
sudo chown guest:guest -R /var/ftp/guest/
~~~

#### 2-4、核心配置

vsftpd的配置：`/etc/vsftpd/vsftpd.conf`。

1. 备份默认配置：`cp vsftpd.conf vsftpd.conf.backup`
2. 修改核心配置：这里我已经把我自己的配置在的了[github](https://github.com/shuimu98/domi-dotfile/tree/master/vsftpd)上。

#### 2-5、虚拟用户配置

1. 先建立虚拟用户名单文件：`touch /etc/vsftpd/virtusers`
2. 添加虚拟用户：	`vim /etc/vsftpd/virtusers`

	然后一行账号，一行密码，例如：
	~~~
	ftpuser1
	user1passwd
	ftpuser2
	user2passwd
	~~~

3. 生成虚拟用户数据文件：`db_load -T -t hash -f /etc/vsftpd/virtusers /etc/vsftpd/virtusers.db`

	~~~
	#可能需要安装
	yum -y install pam*
	yum -y install db4*
	~~~

4. 设定PAM验证文件，并指定虚拟用户数据库文件进行读取

	在/etc/pam.d/vsftpd的文件头部加入以下信息（**其他注释**）
	~~~
	#%PAM-1.0
	auth       required /lib64/security/pam_userdb.so db=/etc/vsftpd/virtusers
	account    required /lib64/security/pam_userdb.so db=/etc/vsftpd/virtusers
	#session    optional pam_keyinit.so    force revoke
	#auth       required    pam_listfile.so item=user sense=deny file=/etc/vsftpd/ftpusers onerr=succeed
	#auth       required    pam_shells.so
	#auth       include     password-auth
	#account    include     password-auth
	#session    required pam_loginuid.so
	#session    include     password-auth
	~~~

	注意：  
	64位系统：`/lib64/security/pam_userdb.so`  
	32位系统：`/lib/security/pam_userdb.so`

5. 配置虚拟用户

	1、私有账户kgogame的配置如下：

	~~~
	#指定虚拟用户的具体主路径
	local_root=/var/ftp/guest

	#设定不允许匿名用户访问
	anonymous_enable=NO

	#虚拟用户具有写权限（上传、下载、删除、重命名）
	virtual_use_local_privs=YES
	~~~

	2、公共账户配置如下：

	~~~
	local_root=/var/ftp/pub
	virtual_use_local_privs=YES
	~~~

6. 用户登陆限制进其它的目录，只能进它的主目录

	~~~
	#设置所有的本地用户都执行chroot
	chroot_local_user=yes （本地所有帐户都只能在自家目录）

	#设置指定用户执行chroot
	#新建文件 chroot_list
	#在这个配置文件中添加用户，每个用户一行，则在这个文件里的用户登录ftp后，可以访问上级目录。
	#而不在这个配置文件中的用户只能访问自己的home目录。
	chroot_list_enable=yes
	chroot_list_file=/etc/vsftpd/chroot_list
	~~~

#### 2-6、注意点

- ftp匿名登陆的文件夹的权限为：755，也就是说group和other的权限不能有**w**，否则，ftp是不能访问的。

参考：
- [Linux ftp服务搭建](https://www.zybuluo.com/huynh/note/312909)
- [vsftpd的设置（全面，包括目录权限的设置）](http://blog.51cto.com/ktaeef/1266628)
- [搭建同时支持匿名、本地、虚拟用户的ftp服务器](http://forum.ubuntu.org.cn/viewtopic.php?t=368282)