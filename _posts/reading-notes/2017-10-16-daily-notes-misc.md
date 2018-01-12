---
layout: post
title:  "每日笔记 —— 计算机原理、操作系统、编程语言等"
date:   2017-10-16
excerpt: "记录了工作中，每天的笔记，分类整理。包括计算机原理、操作系统原理、版本控制（git、svn）以及各种语言需要注意的细节等等。"
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


### 2-2、windows

1. 链接器中三个最重要的动态链接库kernel32.dll、user32.dll、gdi32.dll的作用：

	- kernel32.dll是Windows9x/Me中非常重要的32位动态链接库文件，属于内核级文件。它控制着系统的内存管理、数据的输入输出操作和中断处理，当Windows启动时，kernel32.dll就驻留在内存中特定的写保护区域，使别的程序无法占用这个内存区域。 
	- user32.dll是Windows用户界面相关应用程序接口，用于包括Windows处理，基本用户界面等特性，如创建窗口和发送消息。
   	- gdi32.dll是Windows GDI图形用户界面相关程序，包含的函数用来绘制图像和显示文字。

## 3、版本控制（git、svn）

### 3-1、svn
1. svn 回滚本地代码，[参考](http://blog.sina.com.cn/s/blog_6ad5907b0102uyqy.html)：

    ~~~
	1. svn update -r 200   (回退到200版本)  
    2. svn up -r 18278 QOfficial/tpl/part/paidV1.tpl 
	~~~

2. svn查看某人某段时间所有修改的文件: `svn log -v -r '{2012-10-01}:{2012-11-10}'|sed -n '1p; 2,/^-/d; /username/,/^-/p' > 1.txt`

	-v显示文件详情, -r控制某段时间, sed做筛选

### 3-2、git

1. github秘笈点[这里](http://blog.csdn.net/x805433354/article/details/41214895)。

## 4、编程语言

### 4-1、 C语言

1. 关于打印long long类型的变量：主要的区分在于操作系统，如果在win系统下，那么无论什么编译器，一律用`%I64d`；如果在linux系统，一律用`%lld`。
2. 指针长度问题：如果64位处理器上运行的是64位操作系统，那么几乎可以肯定应该是**8字节**。如果运行的是32位操作系统，那么应该是**4字节**。
3. C语言中：`char s[];`与`char* s`效果等级，但是有一点需要注意：`char *s = "hello";`在声明的同时进行赋值，它其实等价于`const char *s = "hello";`，因为字符串`hello`是常量，不能被改变。这就决定了 char数组（char a[]）的数组名可以赋值给s，但是反过来s不能赋值给数组a。可以参考我的[C Primer plus笔记](http://domicat.me/c-primer-plus/#1%E5%AD%97%E7%AC%A6%E6%95%B0%E7%BB%84%E5%92%8C%E5%AD%97%E7%AC%A6%E4%B8%B2%E6%8C%87%E9%92%88%E7%9A%84%E5%8C%BA%E5%88%AB)。
4. 多维数组不存在到多级指针的转化规则，强转只会导致问题，所以`int a[2][3];`不等价于`int **p;`，**务必注意**。所有有以下结论：**假设T为任意类型，不管是T类型的几维数组，数组名就是一个该类型的指针**。因此`int a[2][3];`等价于`int *p;`。

	但是为什么`char [][]`又等价于`char**`呢？这是因为C语言中操作字符串是通过它在内存中的存储单元的首地址进行的，这是字符串的终极本质。所以`char [][] == char *a[] == char**`。


5. 关于`char []、char*、char *[]、char**`，可参考[这篇文章](http://blog.csdn.net/daiyutage/article/details/8604720)。

6. 关于结构体的typedef:
	~~~c
	typedef struct a{
	    int id;
	    int idx;
	} Sa,*pSa; 
	~~~
	上面这个typedef的意义：
	- 1、给结构体a取一个别名 Sa;
	- 2、给结构体a的指针类型取一个别名pSa（它是个指针类型），即 pSa 就是 a* 的一个替代(**不推荐**)；

7. typedef 定义函数类型：

	- tpyedef自定义函数指针类型
	- typedef自定义函数类型

	例如：  

	~~~c
	#include <stdio.h>

	typedef int (*fp_t)(char c);
	typedef int f_t(char c);

	int func(char c) { printf("f0, c = %c\n", c); return 0;}
	int main() {
		fp_t fp;
		fp = func;
		f_t *fp1;
		fp1 = func;
	    return 0;
	} 
	~~~

8. [c语言一维数组做参数传递给函数](http://blog.csdn.net/tianjizheng/article/details/46314567)：

	- 1、C语言中，当一维数组做函数参数时，编译器总是把它解析成一个指向其首元素的指针。
	- 2、实际传递的数组大小与函数形参指定的数组大小没有关系。

### 4-2、golang

1. 使用`go build`编译go文件时，go文件必须**放在最后**，不然会有`named files must be .go files`的报错。

	例如：`go build -ldflags "-w" -o ./xlsx2lua.exe ./xlsx2lua.go`

2. 所有的goroutine执行完毕的方式主要有两种：

	- 使用 `sync.WaitGroup`
	- 使用 `channel`

3. golang map的key：只有function、map和slice三个kind不能作为map的key，struct能不能作为key，要看结构体中的字段是否存在前面所提到的三个类型，如果没有则可以作为key。
4. [Go语言中的Array、Slice、Map和Set使用详解](http://www.jb51.net/article/56828.htm)。
	
	append函数返回值必须有变量接收，因为append操作可能会导致原来的slice底层内存发生改变。

5. **推荐**使用`fmt.Printf("%+v\n", p)`，打印变量。
6. **golang 中只要有一个goroutine发生panic整个进程都挂了**。所以，golang中goroutine里面的panic应该在goroutine自己内部recover，别的goroutine是不能捕获到这个panic的。
7. [golang map数据结构不能并发读写问题](http://blog.yiyun.pro/golang-map%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E4%B8%8D%E8%83%BD%E5%B9%B6%E5%8F%91%E8%AF%BB%E5%86%99%E9%97%AE%E9%A2%98/)，最新版本的golang 1.9已经支持了并发安全的map(`sync.map`)。
8. golang发布闭源的.a文件（静态库），参考[官方文档 Binary-Only Packages](https://golang.org/pkg/go/build/#hdr-Binary_Only_Packages)。
9. golang的字符串，主要注意`rune`类型和`byte`类型的区别。参考：[学习Golang语言(4):类型--字符串](https://www.zybuluo.com/codemanship/note/21183)。
10. [**Go by Example（有中文版）**](https://github.com/mmcgrana/gobyexample)和[GO 命令教程(**主要是go tool部分**)](https://github.com/hyper0x/go_command_tutorial)以及[astaxie 的 **Go 命令**](https://github.com/astaxie/build-web-application-with-golang/blob/master/zh/01.3.md)。
11. 减小golang编译的二进制文件大小：`go build -ldflags "-s -w"`，如果想进一步减小，可以使用**upx**对编译的二进制加壳压缩。

	- `s`去掉符号表（然后panic时候的stack trace就没有任何文件名/行号信息了，这个等价于普通C/C++程序被strip的效果）
	- `w`去掉DWARF调试信息，得到的程序就不能用gdb调试了。


## 5、静态博客（jekyll等）

1. jekyll 中文帮助在线文档：[http://jekyllcn.com/docs/templates/ ](http://jekyllcn.com/docs/templates/ )。
2. github pages 升级jekylls 3，参考[这里](https://oncemore2020.github.io/blog/upgrade-jekyll/)，以及[rouge代码高亮](http://rouge.jneen.net/)。
3. 一个比较简洁实用的[jekyll 主题](https://github.com/Gaohaoyang/gaohaoyang.github.io)，已star。
4. CSS的优先级顺序: tag中的style > id > class > tag > 继承的属性。
5. [前端构建工具gulpjs的使用介绍及技巧](http://www.cnblogs.com/2050/p/4198792.html)。


## 6、小众软件

- LICEcap，GIF 屏幕录制工具，[下载地址](https://www.appinn.com/licecap/)。
- Chrome商店Crx离线安装包下载，[下载地址](https://yurl.sinaapp.com/crx.php)。
- Sublime Text插件，[下载地址](https://packagecontrol.io/)。
- everything，[下载地址](http://www.voidtools.com/downloads/)。

## 7、游戏开发

1. 游戏常用的编程设计模式：[游戏编程模式](http://gpp.tkchu.me/)。
2. 行为树：

	- [行为树的理解和学习](http://www.cnblogs.com/hammerc/p/5044815.html)
	- [行为树及其实现](http://godorz.info/2015/10/behaviourtree/)
	- [使用行为树(Behavior Tree)实现游戏AI](http://blog.csdn.net/kenkao/article/details/6099966)
3. 棋牌游戏开发：

	- [棋牌游戏感悟](https://zhuanlan.zhihu.com/cronlygames)

4. [基于Lua的游戏服务端框架简介](http://blog.csdn.net/lalate/article/details/51498869)，是以C/C++为底层，lua为上次的游戏框架为基础，做了比较全面的介绍。
5. 游戏的同步方式：**帧同步**和**状态同步**。前者适用于FPS/RTS游戏，后者适用于mmorpg游戏。

	参考： [状态同步与帧同步](http://www.cnblogs.com/sevenyuan/p/5283265.html)和[动作手游实时PVP帧同步方案（客户端）](https://www.cnblogs.com/shown/p/6108617.html)


