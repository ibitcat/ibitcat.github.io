---
layout: post
title: linux 常用命令
date: 2015-9-18 09:56:00
updated: 2015-11-05 17:26:00
excerpt: "linux下常用的命令以及配置"
tag: [Linux]
comments: true

---

### 第一部分 - 常用简单命令

<font color="#FF090f">小知识：</font> markdown table让列中内容右对齐，则在虚线最后加一个冒号 “:”，左对齐的不加。 
{: .notice}

1. 重命名文件文件夹 ： `mv file1 file2`
2. 移动文件文件夹 ： `mv file1 dir1` 
3. 新建文件夹 ： `mkdir dirname`
4. 删除非空目录 ： `rm -rf dirname`
5. 实时打印文件变化 ： `tail -f file.log`
6. 解压zip文件 ： `unzip file.zip -d/temp`
7. 文件夹压缩成zip ： `zip –q –r test.zip ~/test`
8. tar解压： `tar zxvf zhcon-0.2.5.tar.gz`  
`x` : 从 tar 包中把文件提取出来  
`z` : 表示tar包被gzip压缩过,需要用gunzip解压  
`v` : 显示详细信息  
`f` : xxx.tar.gz :  指定被处理的文件是 xxx.tar.gz  


9. 文件夹压缩成zip ： `zip –q –r xahot.zip /home/xahot`
10. 查看文件夹以及文件大小 ： `du -ah  filename`
11. 建立软连接 ： `ln -s /usr/local/bin/python2.7 /usr/bin/python`  
  将python2.7软连接到系统的默认python,即`/usr/bin/python`是`python2.7`的快捷方式

12. 查看文件夹下文件的总数目 ：  `find ./ -type f |wc -l`
13. 查看文件列出文件下一级目的的大小 ：
	- 1、df -h    
	- 2、du -h --max-depth=1 指定层数

14. 查看磁盘占用情况 ： `df -hl `  
  df是以磁盘分区为单位来查看文件系统，/dev/hdb2 75G 75G 0 100% /, 以此为例。  
  就是HD硬盘借口的第二个硬盘(b)上，里面的第二个分区(2)，容量是75G，用了75G，可用是0。  
  因此利用率是100%, 他被挂载到根分区目录上（/）。  
  示例：  
  文件系统 容量 已用 可用 已用% 挂载点  
  /dev/hdb2 75G 75G 0 100% /  
  /dev/hdb1 99M 9.2M 85M 10% /boot  
  none 251M 0 251M 0% /dev/shm  


15. 只显示文件夹 ： `ls -F|grep /$`
16. 查看端口占用 ： `netstat -nltp|grep 80` t表示tcp协议; l表示仅列出有在 Listen (监听) 的服務状态

17. 查找文件 ：   
	
	- 1.whereis 文件名  
		特点:快速,但是是模糊查找,例如 找 #whereis mysql 它会把mysql,mysql.ini,mysql.* 所在的目录都找出来.我一般的查找都用这条命令.

	- 2.find / -name 文件名  
		特点:准确,但速度慢,消耗资源大,例如我想找到php.ini的准确位置,就需要用
		#find / -name php.ini

	- 3.locate 文件名  
		强力推荐的方法,最快,最好的方法.
		注意:第一次使用该命令,可能需要更新数据库,按照提示的命令执行一下就好了.

18. 查看ubuntu版本号 ： 
	- `cat /etc/issue`
	+ `lsb_release -a` (此方法显示内容更详细)

19. 查看端口占用情况：
	- `netstat -nltp|grep 80`  表示tcp协议;l表示仅列出有在 Listen (监听) 的服務状态
	- `netstat -anp|grep 80`

20. top命令  [^footer1]  

	| 字段			| 备注											|
	| :-------------|:----------------------------------------------|
	| `PID`			|进程的ID										|
	|`USER`			|进程所有者										|
	|`PR`			|进程的优先级别，越小越优先被执行   				|
	|`VIRT`			|进程占用的虚拟内存  								|
	|`RES`			|进程占用的物理内存  								|
	|`SHR`			|进程使用的共享内存  								|
	|`S`			|进程的状态。S表示休眠，R表示正在运行，Z表示僵死状态，N表示该进程优先值为负数 |
	|`%CPU`			|进程占用CPU的使用率  							|
	|`%MEM`			|进程使用的物理内存和总内存的百分比  				|
	|`TIME+`		|该进程启动后占用的总的CPU时间，即占用CPU使用时间的累加值。 |
	|`COMMAND`		|进程启动命令名  									|
	{: rules="all" frame="box"}

	参考：[查看LINUX进程内存占用情况](http://www.cnblogs.com/gaojun/p/3406096.html) 、[Top 命令详解](http://www.cnblogs.com/cherishry/p/5886041.html)、[linux top命令VIRT,RES,SHR,DATA的含义](https://javawind.net/p131)

21. chmod更改文件权限 : `chmod u+r xxx` 或者 `chmod u=rwx,g=r xxx` [^footer2]
22. 查看文件类型： `file xxx` 
23. 修改linux时间： `date -s 11:00` 或者 `date -s "2008-08-08 12:00:00"`
24. 将指定的时间戳按日期格式显示 ： `date -d @1361542596`
25. linux解压缩文件：

	| 压缩包格式			| 解压														| 压缩			|
	| :----------------	|:----------------------------------------------------------|:--------------|
	| **.tar格式**		| tar xvf FileName.tar 										|tar cvf FileName.tar DirName（注：tar是打包，不是压缩！）|
	| .gz格式			| 解压1：gunzip FileName.gz <br>解压2：gzip -d FileName.gz	|gzip FileName|
	| .tar.gz格式		| tar zxvf FileName.tar.gz									|tar zcvf FileName.tar.gz DirName|
	| .bz2格式			| bzip2 -d FileName.bz2  <br>解压2：bunzip2 FileName.bz2		|bzip2 -z FileName|
	| .tar.bz2格式		| tar jxvf FileName.tar.bz2									|tar jcvf FileName.tar.bz2 DirName|
	| .bz格式			| bzip2 -d FileName.bz										|bunzip2 FileName.bz|
	| .tar.bz格式		| 															|tar jxvf FileName.tar.bz|
	| .Z格式				| uncompress FileName.Z										|compress FileName|
	| .tar.Z格式			| tar Zxvf FileName.tar.Z									|tar Zcvf FileName.tar.Z DirName|
	| .tgz格式			| tar Zxvf FileName.tar.Z									|tar zxvf FileName.tgz|
	| .tar.tgz格式		| tar zxvf FileName.tar.tgz									|tar zcvf FileName.tar.tgz FileName|
	| **.zip格式**		| unzip FileName.zip										|zip FileName.zip DirName|
	| .lha格式			| lha -e FileName.lha										|lha -a FileName.lha FileName|
	| .rar格式			| rar a FileName.rar										|rar e FileName.rar|
	{: rules="all" frame="box"}

26. 环境变量设置与删除:

	- `export -l` 查看环境变量
	- `export 变量名=变量值` 设置环境变量
	- `unset xxx` 删除环境变量

27. 查看linux系统的cpu核心的简单方法：`top`命令后按 **`数字键 1`**。
28. inux查看用户所属组：

	- 命令`groups`查看当前用户所属组
	- groups 用户（查看用户所属组），例如：`groups root`
	- id 用户(查看用户所属组），例如：`whoami`，然后`id xxx`(xxx为whoami的返回值)
	- 直接查看组文件，`more /etc/group`
29. `cat /etc/passwd`查看所有的用户信息。
30.  获取本机ip：`ifconfig -a|grep inet|grep -v 127.0.0.1|grep -v inet6|awk '{print $2}'|tr -d \"addr:\"`
31.  `nc`命令，需要安装`netcat`

### 第二部分 - 稍微复杂的命令

#### 1、tree

比较常用的：  

- tree -L n ：  `#n代表数字,表示要显示几层`  
- tree -d ： `仅显示目录`  
- tree -f ： `显示完整路径`

**注意!** 一般需要安装tree，ubuntu下安装： `apt-get install tree`
{: .notice}

#### 2、ls、ps、grep和awk结合使用
首先了解 `/proc`目录，参考[Linux下/proc目录简介](http://blog.csdn.net/zdwzzu2006/article/details/7747977)。
Linux 内核提供了一种通过 /proc 文件系统，在运行时访问内核内部数据结构、改变内核设置的机制。	
proc文件系统是一个伪文件系统，它只存在内存当中，而不占用外存空间。它以文件系统的方式为访问系统内核数据的操作提供接口。

`ps`：用来查看进程的相关信息；  
`grep`：用来查找、过滤（可使用正则表达式）；  
`awak`：类似grep的扫描和处理工具，比grep强大些；  
`ps -aux`                 # 显示所有进程  
`ps -e`                   # 显示所有进程、环境变量  
`ps -e |grep nginx`       # 查看nginx所有进程  
`grep -w ss `             # -w表示全字匹配  
`ls -l /proc/{pid}/exe`   # 链接到进程的执行命令文件  
`ls -l /proc/{pid}/exe |grep -w "xxx" | awk '{print $11}'`  # 查看进程可执行文件的绝对路径  

#### 3、grep详解，可参考[grep 的或与非操作](http://www.cnblogs.com/franjia/p/4384362.html)

- **或操作：**  
`grep -E '123|abc' filename`    #找出文件（filename）中包含123或者包含abc的行  
`grep '123\|abc' filename`		#通过使用 `\|` 来分割多个pattern，以此实现OR的操作  
`grep -e pattern1 -e pattern2 filename ` #`-e` 选项，只能传递一个参数  
`egrep '123|abc' filename`      #用egrep同样可以实现   
`awk '/123|abc/' filename`      #awk 的实现方式  


- **与操作：**  
`grep pattern1 files | grep pattern2`   显示既匹配 pattern1 又匹配 pattern2 的行

- **非操作：**  
`grep -v pattern1 files`   `-v`选项用来实现反选匹配的

- **其他操作:**  
`grep -i pattern files`           # 不区分大小写地搜索。默认情况区分大小写  
`grep -l pattern files`           # 只列出匹配的文件名   
`grep -L pattern files`           # 列出不匹配的文件名  
`grep -w pattern files`           # 只匹配整个单词，而不是字符串的一部分（如匹配‘magic’，而不是‘magical’）  
`grep -C number pattern files`    # 匹配的上下文分别显示[number]行  


### 第三部分 - 常用软件的安装
`sudo apt-get install graphviz graphviz-doc`   安装graphviz绘图工具


> 脚注

[^footer1]: 常用的命令（输入top后）：P：按%CPU使用率排行  T：按MITE+排行  M：按%MEM排行
[^footer2]: linux文件权限可参考[这篇文章](http://www.cnblogs.com/123-/p/4189072.html)