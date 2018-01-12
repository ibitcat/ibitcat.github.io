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


## 2、linux

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


## 3、版本控制（git、svn）

1. svn 回滚本地代码，[参考](http://blog.sina.com.cn/s/blog_6ad5907b0102uyqy.html)：
    ~~~
	1. svn update -r 200   (回退到200版本)  
    2. svn up -r 18278 QOfficial/tpl/part/paidV1.tpl 
	~~~

## 4、编程语言

### 4-1、 C语言

1. 关于打印long long类型的变量：主要的区分在于操作系统，如果在win系统下，那么无论什么编译器，一律用`%I64d`；如果在linux系统，一律用`%lld`。
2. 指针长度问题：如果64位处理器上运行的是64位操作系统，那么几乎可以肯定应该是**8字节**。如果运行的是32位操作系统，那么应该是**4字节**。

### 4-2、golang

1. 使用`go build`编译go文件时，go文件必须**放在最后**，不然会有`named files must be .go files`的报错。

	例如：`go build -ldflags "-w" -o ./xlsx2lua.exe ./xlsx2lua.go`

## 5、静态博客（jekyll等）

1. jekyll 中文帮助在线文档：[http://jekyllcn.com/docs/templates/ ](http://jekyllcn.com/docs/templates/ )。
2. github pages 升级jekylls 3，参考[这里](https://oncemore2020.github.io/blog/upgrade-jekyll/)，以及[rouge代码高亮](http://rouge.jneen.net/)。
3. 一个比较简洁实用的[jekyll 主题](https://github.com/Gaohaoyang/gaohaoyang.github.io)，已star。

## 6、小众软件

- LICEcap，GIF 屏幕录制工具，[下载地址](https://www.appinn.com/licecap/)。
- Chrome商店Crx离线安装包下载，[下载地址](https://yurl.sinaapp.com/crx.php)。
- Sublime Text插件，[下载地址](https://packagecontrol.io/)。
- everything，[下载地址](http://www.voidtools.com/downloads/)。

