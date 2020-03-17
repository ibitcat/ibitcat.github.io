---
layout: post
title:  "每日笔记 —— 工具篇"
date:   2017-10-16
excerpt: "记录了工作中，每天的笔记，分类整理。主要介绍编辑器（vim、sublime text）、相关工具使用介绍以及收集的一些小众软件或者在线工具等"
tag:
- 读书笔记
comments: true
---

### 1、编辑器

#### 1-1、vim

1. vim的4种模式，以及模式的切换

	**Vim常用模式：**
	
	- 命令模式(command-mode)
	- 插入模式(insert-mode)
	- 可视模式(visual-mode)
	- 正常模式(normal-mode) 

	**Vim各个模式的进入：**

	①.正常模式：主要用来浏览和修改文本内容的。一般的，打开Vim都是正常模式。在任何模式下，只要按下 Esc 键就可以返回正常模式。  
	②.插入模式：用来向文本中添加内容的。在正常模式下，按`i`进入插入模式  
	③.可视模式：相当于高亮选取文本后的普通模式。在正常模式下，按`v`进入可视模式，`Shift+v`进入可视行模式，`Ctrl+v`进入可视块模式。  
	④.命令模式：在正常模式下，按`:`(英文冒号)进入命令模式。

	**Vim模式的转换：**

	|原来的模式	| 新的模式	|操作			|
	|:-------:	|:---------:|:-------------	|
	|其它模式	|正常模式	|按 `Esc`键|
	|其它模式	|插入模式	|按 `i` 在光标前插入<br>按 `I` 在行首插入<br>按 `a` 在光标后插入<br>按 `s` 删除光标所在的字符再插入<br>按 `A` 在行末插入<br>按 `o` 在当前行之下新建行<br>按 `O` 在当前行之上新建行<br>按 `S` 删除光标所在行再插入|
	|正常模式	|命令模式	|按 `:` （英文冒号）|
	|正常模式	|可视模式	|按 `v` 可视模式<br> 按 `V` 可视块模式|
	{: rules="all" frame="border"}

2. vim升级到8.0教程：[轻松学会源码编译Vim 8.0](http://www.linuxprobe.com/easymake-vim8.html)。

3. 普通用户用vim打开某文件在按tab键补全时出现报错：`_arguments:448: _vim_files: function definition file not found`，解决办法：删除了`~/.zcompdump`，然后执行`exec zsh`。

#### 1-2、sublime text3

1. lua语法高亮修改，sublime text是可以让lua函数高亮的，但是遇到类似于function AA3AA:BB() end（即函数名带有数字）这样类名中带有数字的函数，便无法高亮。

	解决办法：找到安装目录下的Lua.sublime-package，用解压软件打开，打开文件Lua.sublime-syntax，找到

	```yaml
	<key>match</key>
	<string>\b(function)\s+([a-zA-Z_.:]+[.:])?([a-zA-Z_]\w*)\s*(\()([^)]*)(\))</string>
	<key>name</key>
	<string>meta.function.lua</string>
	```
	将<string>节点的内容修改为:
	```yaml
	<string>\b(function)\s+([a-zA-Z_]+[0-9a-zA-Z_]*[.:])?([a-zA-Z_]\w*)\s*(\()([^)]*)(\))</string>
	```

2. 修改sublime text工程：

	- project_name.sumlime-project：包含工程定义，该文件会被记录到版本控制里。
	- project_name.sublim-workspace：包含了用户的工程数据，例如打开的文件和修改等，该文件不会被记录到版本控制里。

	自定义工程配置请参考我的笔记：[我的工作环境分享](http://domicat.me/my-working-env/)。

3. Sublime Text 查找时排除指定的文件夹或文件，在`where`处设置。例如：`D:\server\l-src\,D:\server\c-src,*.c,*.h,*.lua,*.txt,-*.xlsx`。

	- `D:\server\l-src\`和`D:\server\c-src` 表示要寻找的目录，可以多个
	- `*.c,*.h,*.lua,*.txt,` 表示查找指定后缀的文件
	- `-*.xlsx`，`-/Debug/*` 表示排除查找指定的后缀文件和指定的目录


### 2、工具

#### 2-1、SVN

1. svn 回滚本地代码，[参考](http://blog.sina.com.cn/s/blog_6ad5907b0102uyqy.html)：

    ~~~
	1. svn update -r 200   (回退到200版本)  
    2. svn up -r 18278 QOfficial/tpl/part/paidV1.tpl 
	~~~

2. svn查看某人某段时间所有修改的文件: `svn log -v -r '{2012-10-01}:{2012-11-10}'|sed -n '1p; 2,/^-/d; /username/,/^-/p' > 1.txt`

	-v显示文件详情, -r控制某段时间, sed做筛选

#### 2-2、Tmux

1. tmux复制：`bind-key+[`（组合键）进入在tmux的copy-mode下，按空格键进入选中模式，按Enter复制并退出，按q不复制并退出。**这种复制不会在windows剪贴板上**。可以通过`tmux show-buffer`（简写命令`tmux showb`）显示。
2. 解决tmux启动「tmux can't create socket: No such file or directory」的问题：`rm /tmp/tmux-* -R`。

### 2-3、Shadowsockets

1. 自定义用户规则:[shadowsocks自定义代理规则user-rule设置方法](https://www.duoluodeyu.com/1337.html)。

#### 2-4、sysbench

一款开源的多线程性能测试工具，可以执行CPU/内存/线程/IO/数据库等方面的性能测试。

1. 目前我还没有熟练使用这个工具，只是收集了网上的一些教程：[sysbench的一点整理](http://int64.me/2017/sysbench%E7%9A%84%E4%B8%80%E7%82%B9%E6%95%B4%E7%90%86.html)、[howto sysbench](https://www.centoshowtos.org/commands/sysbench/)、[sysbench1.0.5安装以及使用其对mysql5.5.32压力测试](https://www.601849.com/post/90.html)。

#### 2-5、静态博客（jekyll等）

1. jekyll 中文帮助在线文档：[http://jekyllcn.com/docs/templates/ ](http://jekyllcn.com/docs/templates/ )。

2. github pages 升级jekylls 3，参考[这里](https://oncemore2020.github.io/blog/upgrade-jekyll/)，以及[rouge代码高亮](http://rouge.jneen.net/)。

3. 一个比较简洁实用的[jekyll 主题](https://github.com/Gaohaoyang/gaohaoyang.github.io)，已star。

4. CSS的优先级顺序: tag中的style > id > class > tag > 继承的属性。

5. [前端构建工具gulpjs的使用介绍及技巧](http://www.cnblogs.com/2050/p/4198792.html)。


### 3、小众软件

- LICEcap，GIF 屏幕录制工具，[下载地址](https://www.appinn.com/licecap/)。
- Chrome商店Crx离线安装包下载，[下载地址](https://yurl.sinaapp.com/crx.php)。
- Sublime Text插件，[下载地址](https://packagecontrol.io/)。
- everything，[下载地址](http://www.voidtools.com/downloads/)。
- 一个不错的ICO图标资源网站，[地址](https://www.easyicon.net/)。
- Processon，在线作图网站，[地址](https://www.processon.com/)。
- Mockplus，APP UI原型设计，[下载地址](https://www.mockplus.cn/)。
- 去广告类软件分享站：[地址](http://www.zdfans.com/)
- 去广告下载站点：[地址](https://www.nocmd.com/)