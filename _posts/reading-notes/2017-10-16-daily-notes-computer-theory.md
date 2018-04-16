---
layout: post
title:  "每日笔记 —— 计算机原理和操作系统篇"
date:   2017-10-16
excerpt: "记录了工作中，每天的笔记，分类整理。包括计算机原理、操作系统原理。"
tag:
- 读书笔记
comments: true
---


## 1、计算机原理

1. 10进制转16进制计算方法：

	注意：**所有除法都要取整。**  
	从右数第一位：`1610%16 = 10`(表示16进制的A),结果： `_ _ A`  
	从右数第二位：`1610/16 = 100`；`100%16 = 4`,结果：`_ 4 A`  
	从右数第三位：`100/16  = 6`；`6%16 = 4`,结果：`6 4 A`  
	最后： 6/100 =0 结束运算，最后 转换结果 为: `0x64A`

2. 进制与位元：因为 6个bit就能表示64，所以64进制的**位元=6**，同理 16进制**位元=4**，因为2^4=16。
3. 计算机中原码、反码、补码：

	正数的原码、反码、补码都等于原码。  
	负数的反码=除了最高位的符号位不变，其他位取反。  
	负数的补码=它的反码+1。

	可以看看[这篇文章](http://www.cnblogs.com/zhangziqiu/archive/2011/03/30/ComputerCode.html)，讲解的比较通俗易懂。
4. 负数在计算机中是以**补码**的形式存在，例如有这样一个二进制（`1111 1111`，其实就是-1），它的最高位是1，所以它是一个负数，
所以它应该是某个负数的反码形式，转换反码为 `1111 1110` （补码-1），转换为原码为`1000 0001`（符号位不变，其他位取反），即`1111 1111` 表示-1，`1000 0000` = -128的补码。

	关于补码的计算，在我之前的[C primer笔记中有提到](http://domicat.me/c-primer-plus/#%E7%AC%AC%E5%8D%81%E4%BA%94%E7%AB%A0%E4%BD%8D%E6%93%8D%E4%BD%9C)。

5. **总线和寻址范围以及和内存的关系**： 

	假设是32位的总线，那么cpu可以寻址的范围为2的32次方，这里的一根总线代表一个二进制的bit位，注意，这里的bit不是对应的内存bit。这个总线其实可以看成一个索引生成器，它可以给cpu生成2^32个索引。

	内存的存储单位为byte，即一个字节 。**假如内存是一盒奥利奥，那每一块奥利奥就是一个存储单位，它有8个bit，即一个字节**。

	通过总线产生的索引，去内存寻址。比如 cpu要寻址的地址 = 0x00000010，那么cpu就会去内存找到索引为 0x00000010 那个存储单元存储的值（一个字节）。

6. 算术右移：在汇编中，可以用算术右移来进行有符号数据的除法。把一个数右移n位，相当于该数除以2的n次方。
	
	比如，汇编语言中的：
	ASR R3,1
	其意义相当于R3=R3/2

	关于逻辑右移和算术右移的区别，可以参考[我的C笔记 第15章](http://domicat.me/c-primer-plus/#%E7%AC%AC%E5%8D%81%E4%BA%94%E7%AB%A0%E4%BD%8D%E6%93%8D%E4%BD%9C)。


## 2、操作系统

### 2-1、linux

1. Linux链接分两种，一种被称为**硬链接**（Hard Link），另一种被称为**符号链接（也称软连接）**（Symbolic Link）。默认情况下，ln命令产生硬链接。`ln -s a b`创建一个软连接（就像windows系统的快捷方式），即给a创建了一个快捷方式b。
2. centos 6.0系统升级gcc：因为centos 6.0系统默认的gcc版本是很早的4.4.7，如果需要升级到更高的版本，需要自行下载源码，编译安装。

	可以参考[这个教程](https://www.cnblogs.com/lzpong/p/5755678.html)，里面有详细的步骤。另外，除了教程中出现的动态库问题，还需要注意**gcc版本冲突**的问题，因为自行编译安装的二进制，一般放在`/usr/local/bin`，而系统自带的放在`/usr/bin`，所以可能存在两个版本的gcc。解决的办法：可以yum remove 删除老版本，也可以参考**[这篇教程](https://www.cnblogs.com/cynchanpin/p/6807239.html)**，用软连接的方式解决。

3. linux修改时间和时区：[linux 修改时间 date](http://www.cnblogs.com/hjslovewcl/archive/2011/06/28/2314323.html)。

	- 将日期转换为Unix时间戳，[参考](http://www.opstool.com/article/224)： 
		~~~ 
		date +%s #将当前时间以Unix时间戳
		date -d '2013-2-22 22:14' +%s # 转换指定日期为Unix时间戳
		~~~
	
	- 将Unix时间戳转换为日期时间
		~~~
		date -d @1361542596 #不指定日期时间的格式
		date -d @1361542596 +"%Y-%m-%d %H:%M:%S" #指定日期格式的转换
		~~~

4. 修改linux `date`命令的显示格式：编辑`.bash_profile`文件， 添加下面一行 `alias date='date "+%Y-%m-%d %H:%M:%S"'`。
5. [语义化版本](http://semver.org/lang/zh-CN/)，教你如何定义软件的版本。
6. linux开启tcp bbr：[Linux 升级内核开启 TCP BBR 实现高效单边加速](https://www.mf8.biz/linux-kernel-with-tcp-bbr/)。
7. `alias grep='grep --color=auto'`，grep 高亮。
8. `alias = 'ls -lshF --color|sort'`，linux ls 按类型排列。
9. `alias rm='rm -i'`，rm删除前询问是否真正要删除（对root用户无效）。
10. linux Epoll两种触发模式：LT水平触发（常用模式）、ET边缘触发。参考[这个项目的examples（已star）](https://github.com/yedf/handy)。
12. linux挂载（mount 和 umount），这里主要记录linux挂载网络共享文件系统，例如：在linux挂载windows系统上的共享文件夹。

	举例说明：
	```shell
	mount -t cifs //192.168.1.113/share /dir -o username=administrator,password=111111,rw,uid=500,gid=500,dir_mode=0777,file_mode=0777
	```

	-t cifs指定文件系统类型，-o 指定相关权限等。需要注意：mount挂载cifs需要先安装网络共享服务， `yum install -y cifs-utils`，windows系统需要开启**445**端口。[挂载windows共享文件后的权限问题参考这里](http://www.jianshu.com/p/a631045d410d)。

	**开机自动挂载**，其中一种方式：编辑 `/etc/rc.d/rc.local` 将上面的命令插入，重启即可。  
	umount卸载，如果出现device is busy报错，表示该文件系统正在被使用；使用命令`fuser -mv /dir`查看此文件系统正在被哪些进程访问。

12. [Linux下用户组、文件权限详解](http://www.cnblogs.com/123-/p/4189072.html)，讲解干净利落，**推荐**。
13. ngrok 内网穿透，ngnix 反向代理。
	
	假设：在路由器是先做一个内网穿透，开个隧道，穿透到80端口，再用ngnix做一个反向代理，代理内网某台电脑的8080端口，那这样是否可以做一个私有云呢？

14. 正则表达式，参考这篇文章:[正则表达式](http://wubaoguo.com/2016/03/21/Linux/%E6%AD%A3%E5%88%99%E8%A1%A8%E8%BE%BE%E5%BC%8F/)。
15. `ss`命令显示linux系统socket状态。例如：`ss -s `列出当前socket详细信息。
16. centos开启zsh：[centos开启zsh之旅](https://my.oschina.net/shyann/blog/426004)。
17. centos 添加新用户并授权，[参考](http://www.cnblogs.com/woshimrf/p/5906084.html)。

	~~~
	adduser zhangbiao
	passwd zhangbiao
	vim /etc/sudoers

	## 找到以下内容，并添加新用户
	## Allow root to run any commands anywher  
	root    ALL=(ALL)       ALL  
	zhangbiao  ALL=(ALL)       ALL  #这个是新增的用户
	~~~

18. [**CentOS更改yum源与更新系统**](http://www.cnblogs.com/lightnear/archive/2012/10/03/2710952.html)，改为网易源镜像。
19. 解决mysql报错[`can't create/write to file '/tmp/#sql_23e6_0MYI'`]：

	~~~bash
	$mkdir /var/lib/mysql/tmp
	$chown  mysql:mysql /var/lib/mysql/tmp
	$vim /etc/my.cnf
    $tmpdir = /var/lib/mysql/tmp
    $service mysqd restart
	~~~

20. linuix禁止root用户开机登陆：修改`/etc/ssh/sshd_config`里面有一个配置选项`PermitRootLogin no`，这样就可以不让root直接登录了。另外，设置AllowUsers允许指定用户通过ssh登陆，如`AllowUsers domi`。

21. centos6.x切换图形界面和命令行界面：修改`/etc/inittab`文件中的`id:3:initdefault`，将3改为5则为图形界面 ，反之则为命令行界面，修改完后重新启动系统生效；


### 2-2、windows

1. 链接器中三个最重要的动态链接库`kernel32.dll、user32.dll、gdi32.dll`的作用：

	- `kernel32.dll`是Windows9x/Me中非常重要的32位动态链接库文件，属于内核级文件。它控制着系统的内存管理、数据的输入输出操作和中断处理，当Windows启动时，kernel32.dll就驻留在内存中特定的写保护区域，使别的程序无法占用这个内存区域。
 
	- `user32.dll`是Windows用户界面相关应用程序接口，用于包括Windows处理，基本用户界面等特性，如创建窗口和发送消息。
	- `gdi32.dll`是Windows GDI图形用户界面相关程序，包含的函数用来绘制图像和显示文字。

2. TODO




