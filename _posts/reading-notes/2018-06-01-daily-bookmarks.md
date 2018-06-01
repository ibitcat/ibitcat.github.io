---
layout: post
title:  "每日书签"
date:   2018-06-01
excerpt: "自己在解决问题的过程中，搜索、整理出来的网络书签"
tag:
- 读书笔记
comments: true
---



[TOC]

## linux 运维
### 2017-1-7
- vim8.0 编译安装：http://www.linuxprobe.com/easymake-vim8.html 
- Tmux 安装：https://gist.github.com/Root-shady/d48d5282651634f464af 
- svn cleanup失败：https://blog.csdn.net/keenweiwei/article/details/34090553
- centos 6.9 修改/etc/inittab文件中的`id:3:initdefault`，将3改为5则为图形界面，反之则为命令行界面,修改完后重新启动系统生效
- SVN提交强制加入注释：https://www.cnblogs.com/luomingui/archive/2012/09/02/2667374.html 

### 2017-11-22
- 设置系统允许生产core文件：
    ~~~
    在 ~/.bash_profile 中增加
    ulimit -c unlimited
    使用ulimit -a可以查看系统core文件的大小限制;
    使用ulimit -c [kbytes]可以设置系统允许生成的core文件大小;
    ulimit -c 0 不产生core文件
    ulimit -c 100 设置core文件最大为100k
    ulimit -c unlimited 不限制core文件大小
    ~~~

### 2018-4-9
- svn服务器安装：
    - https://www.cnblogs.com/mymelon/p/5483215.html centos
    - https://blog.csdn.net/u013927110/article/details/45972873
    - https://blog.csdn.net/yu9696/article/details/76046313
- svn权限管理：https://blog.csdn.net/huangning1995/article/details/58239934
- subversion 升级：
    - 可以参考：https://tecadmin.net/install-subversion-1-8-on-centos-rhel/
    - 自测可用（yum方式）：https://serverfault.com/questions/332166/upgrade-subversion-1-6-to-1-7-on-centos-cant-find-yum-repository
- CentOS6.5升级autoconf版本：https://www.cnblogs.com/fnlingnzb-learner/p/5831443.html

### 2018-5-9
- svn 备份：http://www.cnblogs.com/itech/archive/2011/10/11/2206988.html
- rsync 同步：https://jingyan.baidu.com/article/60ccbceb595b0564cab197d3.html
- rsync文件同步详解：https://www.cnblogs.com/regit/p/8074221.html
- rsync 常见问题：https://blog.csdn.net/csj50/article/details/6742561
- crontab例子：https://www.jianshu.com/p/d93e2b177814
- 不在同一个网段的话，mount 需要搞一搞windows的防火墙

### 2018-5-28
- centos升级python到2.7 https://www.cnblogs.com/zihanxing/p/7088804.html
- 升级python2.7 导致yum无法使用的问题：http://www.cnblogs.com/lihanx/p/5947178.html

### 2018-5-31
- denyhosts 重置被限制的ip（亲测可用），https://my.oschina.net/itlzm/blog/1611539
- ssh登陆失败次数限制（貌似不行，但是可以作为参考）https://www.cnblogs.com/jackrebel/p/3935592.html 

### 2018-6-1
- 了解linux文件系统的层次结构，对于熟练使用linux有很大的帮助：
    - Linux目录配置标准FHS：http://www.linuxidc.com/Linux/2012-06/62532.htm
    - Linux：FHS标准：http://www.cnblogs.com/happyframework/p/4480228.html
    - 简述linux文件系统的层次结构：http://www.178linux.com/10034?utm_source=tuicool&utm_medium=referral
- VMware中让CentOS利用桥接上网的方法教程：http://www.jb51.net/article/105110.htm 
- linux ping unknown host解决办法：https://jingyan.baidu.com/article/4d58d54137d2a19dd5e9c050.html
- 查看文件是哪个版本的gcc编译的：https://stackoverflow.com/questions/2387040/how-to-retrieve-the-gcc-version-used-to-compile-a-given-elf-executable
    ~~~
    strings -a <binary/library> |grep "GCC: ("
    ~~~






## 工具网站
- Linux命令大全 http://man.linuxde.net/
- 数学计算工具 http://www.99cankao.com/
- man手册中心 http://man.chinaunix.net/
- C语言标准头文件
    - 英文版：http://en.cppreference.com/w/c
    - 中文版：http://zh.cppreference.com/w/%E9%A6%96%E9%A1%B5
- C指南：https://www-s.acm.illinois.edu/webmonkeys/book/c_guide/ 
- golang 中文文档：https://slowbirdgogogo.com/
- 值得推荐的C项目：https://www.cnblogs.com/coky/p/6844445.html
- UNIX TOOLBOX - 中文版：http://www.92csz.com/study/UnixToolbox-zh_CN.html





## 算法
- 时间轮定时器：http://www.cnblogs.com/zhongwencool/p/timing_wheel.html 
- 七大查找算法：http://www.cnblogs.com/maybe2030/p/4715035.html#_label4
- 各种算法详解（该博客有很多算法详解）：http://www.cnblogs.com/skywang12345/category/508186.html
- 双数组字典树：
    - https://www.zybuluo.com/evilking/note/850112
    - https://segmentfault.com/a/1190000008877595
- bitmap算法：https://w.wujunze.com/2017/08/08/%E6%BC%AB%E7%94%BB%EF%BC%9A%E4%BB%80%E4%B9%88%E6%98%AF-bitmap-%E7%AE%97%E6%B3%95%EF%BC%9F/
- 桶排序算法：http://www.dailichun.com/2016/12/03/baseKnowlenge_algorithm_sort_bucketSort.html
- 坐在马桶上看算法：http://blog.51cto.com/ahalei






## 游戏服务器
- 游戏服务器框架发展史：http://blog.jobbole.com/88586/ 
- 游戏技能系统设计：
    - MMO游戏技能区域算法效率分析：http://bbs.gameres.com/thread_497722.html
    - MMORPG游戏服务器技能系统设计：http://www.cnblogs.com/GameDeveloper/archive/2013/01/21/2869260.html
    - MMO即时战斗:技能实现：http://blog.csdn.net/cyblueboy83/article/details/41628743
    - 游戏技能系统设计：https://blog.csdn.net/caoshulin1989/article/details/53081035
    - 游戏服务器之技能：https://blog.csdn.net/chenjiayi_yun/article/details/19429133
- 游戏状态同步：http://www.skywind.me/blog/archives/1343
- 网络游戏的位置同步：https://www.cnblogs.com/sevenyuan/p/6678317.html 
- MMO技能系统的同步机制分析：https://www.cnblogs.com/sevenyuan/p/6678317.html
- 游戏技能和同步机制：https://zhuanlan.zhihu.com/p/26108028 
- 再谈网游同步技术（DR算法）：http://www.gameres.com/478430.html
- 云风—位置同步策略：https://blog.codingnow.com/2012/03/dev_note_12.html
- 游戏网络同步——MMO位置同步：https://blog.csdn.net/cubesky/article/details/38754915
- 从网络游戏中学习如何处理延迟：http://gad.qq.com/article/detail/19884
- 心跳包实现：https://www.cnblogs.com/scy251147/p/3333957.html
- 十字链表 AOI：https://www.cnblogs.com/rond/p/6114919.html







## lua
- lua分割字符串：
    - http://blog.sina.com.cn/s/blog_68ef18a901015lor.html
    - http://blog.163.com/chatter@126/blog/static/127665661201451983036767/
- centos 编译lua：http://tieba.baidu.com/p/2188398593
- lua 5.1升级到5.3小结：http://www.cnblogs.com/zsb517/p/6822870.html
- lua5.3注册C库(lua5.3 移除了`luaL_register`)： https://blog.csdn.net/bbhe_work/article/details/48950175
- lua动态库加载(`luaopen_` 前缀)： http://www.cppblog.com/sleepwom/archive/2014/11/04/208778.aspx 
- lua 5.1隐藏特性(nexproxy)：
    - Lua: 好的, 坏的,和坑爹的：https://blog.csdn.net/xoyojank/article/details/12762909 
    - Lua 中使用面向对象(里面介绍了nexproxy的用法)：https://www.cnblogs.com/yaukey/p/4568202.html
- Lua字符串库：http://www.cnblogs.com/stephen-liu74/archive/2012/07/11/2425233.html





## golang
### 2018-6-1
- golang 遍历目录：http://blog.csdn.net/rufidmx/article/details/8644854
- go语言遍历文件夹示例：http://www.jb51.net/article/62253.htm
- golang 读取文件的几种方式
    - （不太严谨）http://david-je.iteye.com/blog/1988940
    - Golang读写文件的几种方式：https://www.jianshu.com/p/7790ca1bc8f6
    - golang bufio、ioutil读文件的速度比较：https://segmentfault.com/a/1190000011680507
- golang编程之逐行处理文件：http://blog.chinaunix.net/uid-24774106-id-3995411.html
- golang写入文件：
    - http://studygolang.com/articles/2877
    - http://studygolang.com/articles/2073 （四种写入方法）
- golang 文件读写：http://wiki.jikexueyuan.com/project/the-way-to-go/12.2.html
- golang 字符串处理小结：http://www.tuicool.com/articles/6rYfmq6
- golang json处理：http://zuozuohao.github.io/2016/06/17/Working-JSON-in-Go/
- golang 类型断言：http://blog.csdn.net/lxy15329/article/details/8757158
- golang 工具链：https://golang.org/cmd/go/ 
- Go,Makefile与自动程序版本号的实现：https://xiaozhou.net/go-makefile-and-auto-version-2016-06-13.html
- 深入理解go的slice和到底什么时候该用slice：https://segmentfault.com/a/1190000005812839?utm_source=tuicool&utm_medium=referral
- golang 常见正则处理：http://c2pblog.sinaapp.com/archives/504
- golang perl正则语法：http://www.cnblogs.com/golove/p/3269099.html

### 2017-5-25
- golang defer 使用小结与注意要点：https://segmentfault.com/a/1190000006823652

### 2017-5-26
- 《The Way to Go》中文译本：https://github.com/Unknwon/the-way-to-go_ZH_CN
- Golang Profile：
    - Golang服务的性能调优与问题定位：http://www.yourmoonlight.com/golang/2017/07/15/How-To-Profile-Golang-Programs
    - 使用pprof优化golang性能：http://cjting.me/golang/2016-11-14-%E4%BD%BF%E7%94%A8pprof%E4%BC%98%E5%8C%96golang%E6%80%A7%E8%83%BD.html
    - golang profile用法：https://www.jianshu.com/p/162f44022eb7
    - Go 程序的性能调（官方文档）：https://github.com/golang/go/wiki/Performance
    - Go 程序的性能调（翻译文档）：https://www.oschina.net/translate/debugging-performance-issues-in-go-programs
    - golang 内存分析/动态追踪：https://lrita.github.io/2017/05/26/golang-memory-pprof/
- 关于golang中函数调用flat和cum的理解：

    ~~~golang
    // 假设有这样的函数调用关系
    // a() --> b() --> (c()、d())
    func a(){
        b()
    }
    
    func b(){
        c() // c函数花费1s
        // do something // 没有函数调用，但是执行发生了5s
        // ...
        d() // d函数花费2s
    }
    b() //函数的cum（累计调用时间）= 1+5+2 = 8s
    b() //函数的flat=5s ，也就是b()函数自身执行自己代码的时间，没有发生函数调用

    ~~~
    详见：https://www.reddit.com/r/golang/comments/7ony5f/what_is_the_meaning_of_flat_and_cum_in_golang/
    
    flat: 函数自身执行所用的时间, the time in a function.  
    cum: 执行函数自身和它调用的函数所用的时间和, cumulative time a function and everything below it. 

### 2018-2-2 
- 深入分析golang多值返回以及闭包的实现：http://luodw.cc/2016/09/04/golang03/ 
- Goroutine + Channel 实践：https://studygolang.com/articles/2423
- golang字符串原理：http://www.jianshu.com/p/01a842787637

### 2018-1-17
- Golang struct、interface 组合嵌入类型详解：https://www.jianshu.com/p/d87c69ac6ce7
- golang interface 详解：https://zhuanlan.zhihu.com/p/27652856
- golang的interface剖析：https://www.cnblogs.com/qqmomery/p/6298771.html
- 官方faq：https://golang.org/doc/faq#nil_error golang
- golang 非入侵式接口：https://studygolang.com/articles/3782






## C/C++
### 2017-9-28
- C++头文件循环包含依赖：https://blog.csdn.net/qq_25327609/article/details/53195557

### 2017-5-25
- C语言 子函数return局部变量和栈地址的机制：http://blog.csdn.net/misskissc/article/details/10757975 
- 野指针、悬空指针、内存泄露：
    - 内存泄露和野指针：http://blog.csdn.net/dangercheng/article/details/12618161
    - 野(wild)指针与悬空(dangling)指针：http://www.cnblogs.com/idorax/p/6475941.html

### 2017-8-20
- c语言实现utf8编码unicode：http://blog.csdn.net/tge7618291/article/details/7599902
- Ansi,UTF8,Unicode,ASCII编码的区别：http://blog.csdn.net/xiongxiao/article/details/3741731
- unicode揭秘：http://www.freebuf.com/articles/others-articles/25623.html
- c语言字典树：http://www.jb51.net/article/70754.htm
- 浮点数：
    - float的有效数字 http://www.cnblogs.com/heben/p/5988422.html
    - 浮点数的存储方式：http://www.cnblogs.com/xugang/archive/2010/05/04/1727431.html

### 2018-1-30
- 从汇编角度分析C语言的过程调用：https://www.cnblogs.com/TingyunAPM/p/5888788.html  
- 函数调用，栈的变化：https://www.cnblogs.com/zlcxbb/p/5759776.html

### 2018-4-20
- extern c的原因：https://www.cnblogs.com/yuemw/p/7908413.html
- C 读取整个文件：https://blog.csdn.net/cashey1991/article/details/6769038
- C语言 inline总结：http://www.cnblogs.com/xkfz007/articles/2370640.html
- 关于头文件中的 static inline函数（一般不要用static inline）：https://blog.csdn.net/huanghui167/article/details/41346663




## linux
- 浅析线程间通信一：互斥量和条件变量（里面有github连接）：http://blog.csdn.net/maximuszhou/article/details/42318169
- Linux之TCPIP内核参数优化：https://www.cnblogs.com/wuchanming/p/4028341.html





## MYSQL
- 查询一个表中类别字段中Max()最大值对应的记录：http://blog.csdn.net/hx_lei/article/details/50898482
- 获取分组后取某字段最大一条记录：http://www.2cto.com/database/201502/376690.html
- mysql 5.7安装：
    - 编译安装：http://www.cnblogs.com/zfxJava/p/6004188.html
    - 二进制文件安装：https://dev.mysql.com/doc/refman/5.7/en/binary-installation.html
    - yum安装：https://dev.mysql.com/doc/mysql-yum-repo-quick-guide/en/
    - mysql 5.7 yum安装：https://dev.mysql.com/doc/refman/5.7/en/linux-installation-yum-repo.html
- mysql 5.7修改初始密码：http://blog.51cto.com/professor/1783769
- 允许远程用户登录访问mysql的方法（**推荐第二种**）：https://www.cnblogs.com/hyzhou/archive/2011/12/06/2278236.html
- Centos 7环境下编译mysql 5.7：https://www.cnblogs.com/ccccwork/p/6164514.html
- 手工编译mysql5.7图文详解：https://blog.csdn.net/u013806814/article/details/51957569
- CentOS 7上源码编译安装MySQL 5.7：https://www.jianshu.com/p/819aa840e2e4




## AI、行为树
- 饥荒AI教程：https://tieba.baidu.com/p/5443449361?red_tag=2268024904





## GDB调试
- 安装gdb https://blog.csdn.net/u010624618/article/details/46523055
- gdb 调试命令: https://blog.csdn.net/tzshlyt/article/details/53668885
- gdb 附加到进程调试：http://www.cnblogs.com/siyuan-wang/p/4581751.html
- 调试带参数的程序：
    - 第一种方法： `gdb --args  program  arg1 arg2 ...`   例： gdb --args map -N1
    - 第二种方法： `gdb program    run arg1 arg2 ...`    例：gdb map    run -N1  [两步]
    - 第三种方法： `gdb program    set args arg1 arg2 ...   run`   例：gdb map   set args -N1  run [三步]



## web
- get 和post区别：https://zhuanlan.zhihu.com/p/22536382




## 编译原理
- `.a .so .o`文件的区别和联系：https://segmentfault.com/q/1010000005269977 
- 编译、连接、.h文件和.lib文件、.dll文件还有.o文件是什么关系：https://www.zhihu.com/question/20783462 
- gcc 链接时：`-lz -lrt -lm -lc`都是什么库:
    - libz：压缩库（Z）
    - librt：实时库（real time）
    - libm：数学库（math）
    - libc：标准C库（C lib）
- cmake 入门：http://www.hahack.com/codes/cmake/
- 编译过程中 的符号表：https://www.cnblogs.com/malc/p/5629610.html
- 可执行文件（ELF）格式的理解：http://www.cnblogs.com/xmphoenix/archive/2011/10/23/2221879.html (可重定向文件 ELF格式，用readelf工具读取，yum install) readelf
- gcc/g++ 链接库的编译与链接库：http://blog.csdn.net/q_l_s/article/details/51313842
- gcc 参数：https://www.cnblogs.com/fnlingnzb-learner/p/8059251.html
- GCC中-fpic解惑：https://my.oschina.net/moooofly/blog/500707 使用 fpic 编译会生出地址无关代码，改代码执行效率会稍微低一些， 不过可以便与多个进程共享； 
静态库不需要进程之间共享， 使用fpic 编译不仅得不到好处， 还会降低程序执行效率 
- configure静态和动态编译：https://blog.csdn.net/daixiaoxiong/article/details/6657470
- 理清gcc、libc、libstdc++的关系：https://blog.csdn.net/haibosdu/article/details/77094833
- 使用c99编译出警告信息：implicit declaration of function ‘usleep’：https://blog.csdn.net/persistvonyao/article/details/41944813 (将-std=c99改为-std=gnu99)