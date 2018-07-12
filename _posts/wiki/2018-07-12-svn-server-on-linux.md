---
layout: post
title: svn服务器搭建、迁移、备份、容灾
date: 2018-07-10 14:21:00 +0800
excerpt: "在linux下（centos 6.9）下搭建svn服务，并将svn仓库做每日备份，同时将仓库备份同步到其他主机，做容灾处理。另外，本文也记录如何将仓库从一台机器迁移到另外一台机器。"
tag: [环境搭建]
comments: true

---


### svn服务搭建

1. 安装subversion：`yum -y install subversion`
2. 创建版本库目录：`mkdir /var/svn/repos`
3. 创建一个仓库：`svnadmin create proj-test`

	此时，在版本库目录下（/var/svn/repos），产生一个仓库目录**proj-test**
4. 创建用户密码

	在生成的仓库目录下，会有一个conf文件夹，里面有三个文件：

	- svnserve.conf，版本仓库的配置文件
	- passwd，用户账号和密码（明文）
	- authz，仓库权限管理

	编辑passwd文件，在`[user]`节点下，添加用户和密码。

5. 版本仓库配置

	编辑svnserve.conf， 在节点`[general]`下，取消一下字段的注释：

	~~~
	anon-access = none  	#进制匿名用户访问
	auth-access = write 	#认证用户具有写权限
	password-db = passwd 	#密码文件
	authz-db = authz 		#权限文件
	realm = proj-test 		#认证域，可以随意填写，但是多个仓库如果认证域相同，使用的密码库也必须相同
	~~~

	**注意**，可能出现一个问题，*svn在show log 时候出现 want to go offline*，
	Subversion 有个小 bug ，当 `anon-access=read` 并且某个目录有被设置上 `* =` 标记，则会出现上述问题。
	
6. 权限管理

	编辑authz文件，权限管理支持分组、单个用户、通配符。权限分为读(r)、写(w)、无访问权限(空)。

	- 分组
	在节点`[groups]`下面添加分组，例如：

	~~~
	# 一个用户可以同时存在于不同的组中
	[groups]
	harry_and_sally = harry,sally
	harry_sally_and_joe = harry,sally,&joe
	~~~

	- 版本权限（举例说明）
	
	~~~
	# repos根目录权限，也就是`/var/svn/repos`
	# * = 表示所有人都没有权限
 	[/]
 	@admin=rw
 	harry=rw
 	* =

 	# proj-test仓库根目录，即`svn://ip/proj-test`
 	[proj-test:/]
 	@admin=rw
 	@client=rw
 	* =

 	# proj-test仓库子目录，即`svn://ip/proj-test/trunk/docs`
 	[proj-test:/trunk/docs]
 	@admin=rw
 	@client=rw
 	* =

 	[proj-test:/trunk/server]
 	@admin=rw
 	@server=rw
 	* =
	~~~

### svn备份

为了增强仓库的安全性，最好每天都将仓库备份一下，svn是支持备份和还原。另外，可以写一个脚本，用crontab每日定时备份一次svn仓库。

- 备份：svnadmin dump

	命令语法：`svnadmin dump REPOS_PATH [-r LOWER[:UPPER]] [--incremental]`， `--incremental`表示支持增量备份，需要配合`-r`参数一起使用。

	例如：
	`svnadmin dump /var/svn/repes/proj-test -r 0:100 --incremental > svn_inc_dump`，表示备份0到100版本直接的所有修订版。
	`svnadmin dump /var/svn/repes/proj-test > svn_full_dump`，表示全量备份


- 还原：svnadmin load

	命令语法：`svnadmin load REPOS_PATH`

	例如：
	`svnadmin create newrepos`
	`svnadmin load newrepos < svn_full_dump`


另外，还有另外两种方式可以实现备份：`svnadmin hotcopy`和`svnsync`，具体参考[源码管理 - SVN的备份和还原](http://www.cnblogs.com/itech/archive/2011/10/11/2206988.html)。

### svn容灾

使用rsync，将svn dump下来的备份文件，同步到另外一台机器上，实现svn的容灾处理。这里涉及到了rsync的安装和启动，下面简单描述下这个过程。

	源服务器A：即svn服务器，假设IP：192.168.2.250
	备份服务器B：用于拉取A的svn备份文件，假设IP：192.168.2.251

	首先，配置A服务器，也就是rsync的服务端：

	- 新建配置文件：`touch /etc/rsyncd.conf`
	- 编辑配置，如下：

	~~~
	uid=root
	gid=root
	max connections=400
	log file=/var/log/rsyncd.log
	pid file=/var/run/rsyncd.pid
	lock file=/var/run/rsyncd.lock
	secrets file=/etc/rsyncd.passwd #服务端密码文件，例如：root:123456

	# svn 备份文件的路径
	[svn_repos]
	comment= svn repos backup
	path=/var/svn/backup
	use chroot=no
	read only=ye
	auth users=root
	hosts allow=192.168.2.251
	hosts deny=*
	~~~

	- 启动rysnc服务：`/usr/bin/rsync --daemon --config=/etc/rsyncd.conf`，可以写入到`/etc/rc.local`实现开机启动。

	然后，配置B服务器，写一个脚本，并配合cron实现每日定时同步。

	- 编写脚本：`touch rsync_svn.sh`

	~~~shell
	#!/bin/bash
	rsync -vzrtopg --progress --password-file=/etc/rsyncd.scrt root@192.168.2.250::svn_repos /data/svn_backup
	~~~

	- 写入定时任务：`crontab -e`

	~~~
	# 每日凌晨3点执行一次同步脚本
	* 3 * * * /usr/sh /root/rsync_svn.sh
	~~~

### svn迁移

因为项目需要，需要将原本在`192.168.2.251`这台服务器上的svn仓库（svn仓库路径：`/var/svn/repos/proj-h5`），迁移到`192.168.2.250`这台机器上。

- 首先，停止svn服务：`killall svnserve`
- 全量备份svn仓库：`cd /var/svn/repos`，`svnadmin dump proj-h5 > svn_dump`
- 在`192.168.2.250`这台机器上，拷贝备份文件：`scp root@192.168.2.251:/var/svn/repos/svn_dump /var/svn/repos`
- 还原仓库：`svnadmin load proj-h5 < svn_dump `
