---
layout: post
title: vim配置以及使用vundle管理vim插件
date: 2015-7-28 15:08:00
updated: 2015-11-05 17:22:00
tag: [Linux]
comments: true

---

搬到linux后，需要使用装逼利器**vim**，奈何界面不够萌萌哒，于是上网搜索vim的配置以及插件，然后经过自己的一番折腾，找了一些不错的插件，自己弄了一个vim配置。

**vimrc下载地址**：[传送门](https://github.com/shuimu98/domi-dotfile)
**另外推荐一个**:[k-vim](https://github.com/wklken/k-vim)

先来一张预览图：  
![预览](/images/posts/vim.png) 

<!-- more -->

### 安装步骤

	1、git clone https://github.com/VundleVim/Vundle.vim.git ~/.vim/bundle/Vundle.vim
	2、git clone https://github.com/shuimu98/domi-dotfile.git
	3、cp domi-dotfile/.vimrc ~/
	4、打开vim，输入命令 :PluginInstall

这里需要注意，一开始还没有安装插件，所以打开vim会报很多错误，不用管，一路enter下去，装完插件之后，重新打开vim，如果还有报错，就需要自己仔细检查下了。

### vim基础配置

这部分主要包括vim的一些基础配置，例如显示行号、括号配对等，**大部分的设置在我的配置里面已经有了注释，不详细说明**。
另外，tagbar等插件需要ctags支持，自行安装。

	<CR> 在vimrc配置中表示回车的意思
	<C-w> 表示ctrl + v
	<S-a> 表示shift + a
	<A-w><Left> 表示 alt+w+ <--

一些小技巧：

- 输入 vim --version 可以查看vim支持的特性，如果支持会有 "(+)"
- 目前的vim版本的7.4，7.2升级到7.4尽量不要直接卸载vim，否则会出现很多蛋疼的问题，最好自己拉源码编译


### vim默认的常用快捷键、命令

| 快捷键或命令        	| 备注           															|
| --------------------- |:--------------------------------------------------------------------------|
| :vsplit      			| 分割屏幕（垂直分割） 														|
| :split      			| 分割屏幕（水平分割）      													|
| :!command      		| 运行vim外部环境命令（注意 “!”），如 :!ls -l，表示显示当前目录文件				|
| :tabnew	xxx      	| 新建名为xxx的标签,tab类的其他命令请自行百度。									|
| gt, gT     			| 可以直接在tab之间切换      													|
| gg		      		| 跳到文件开头（小写的g连续按两次）												|
| G		      			| 调到文件尾部（大写G） 														|
| xxx + g     			| 调到xxx行（在一般模式下先按xxx行，再按g）      								|
| ctrl+s 和 ctlr+q      	| 这一组快捷键需要注意，其实是linux锁/解屏的快捷键，但是会导致vim僵死				|
| Ctrl+f和Ctrl+b  		| 上下翻页			 														|
| Ctrl+u和Ctrl+d      	| 上下翻半页			      													|
| /xxx		      		| 在一般模式下，先按"/"，再输入要搜素的xxx，在按enter							|
| #				     	| 反向查找																	|
| *     				| 正向查找			      													|
| dd		      		| 删除整行																	|
| dw	      			| 删除整词																	|
| yy	     			| 复制整行								      								|
| p				      	| 粘贴																		|
| u				      	| 撤销更改			      													|
| ctrl+r		      	| 恢复撤销																	|
| >>				    | 右缩进（英文键盘模式下，按住 shift+>(连续按两次>键)）							|
| <<     				| 左缩进				      													|
| 多行选中缩进      		|  按住shift+v,进入VISUAL LINE模式，选中多行，再 >> 缩进						|
{: rules="all"}


### 自定义的快捷键设置
常用快捷键，参考[这里](http://www.cnblogs.com/wangkangluo1/archive/2012/04/12/2444952.html)
另外我自己定义了一些我自己习惯用的快捷键。

	F2		--资源管理器
	F3		--TagbarToggle 开关
	F4		--关闭窗口快捷键
	F5		--C,C++编译运行
	F7		--生成Tags文件
	F8		--C,C++ GDB调试
	F10		--编辑模式下，切换paste模式，解决vim复制缩进的问题
	F11		--上一个窗口
	F12 	--vim窗口切换
	Shift+l	--svn log
	Shift+d	--svn diff
	Shift+u	--svn update
	Shift+c	--svn commit
	Shift+r	--svn revert 

### 常用插件的快捷键

	有些需要配置leader键，vim默认的leader键为 “\”（enter键上面的那个键）
	
	scrooloose/nerdcommenter 快速 加减注释插件：
	\cc		注释
	\ci		取消注释

	fatih/vim-go 插件：
	\dt		转到定义（新的标签页打开）
	\ds		转到定义（水平分割窗口）
	\dv		转到定义（垂直分割窗口）

	kien/ctrlp.vim 插件：
	ctrl+p 	打开文件搜素。
	ctrl+d 	在全路径搜索和文件名搜索间切换。
	ctrl+r 	在字符串搜索模式和正则表达式模式之间切换

	关于切换搜索路径：
	ctrl+p搜索是你当前路径的，如果要切换，可以在命令模式下输入cd .. or cd /path/to/youwant/ 就可以了。
	参考 https://ruby-china.org/topics/12417  以及 http://blog.codepiano.com/pages/ctrlp-cn.light.html（中文帮助文档）

### 插件管理
使用[vundle](http://github.com/VundleVim/Vundle.Vim)管理插件，具体安装方法不在赘述。

比较实用的插件：  

- Plugin 'scrooloose/nerdtree'  			<u>**以树形结构浏览文件夹中的文件**</u>  
- Plugin 'fatih/vim-go'  					<u>**golang的vim插件**</u>  
- Plugin 'fatih/molokai'  					<u>**molokai主题**</u>  
- Plugin 'Shougo/neocomplete.vim'  		<u>**实时代码补全提示，支持golang**</u>  
- Plugin 'SirVer/ultisnips'  				<u>**代码模板，支持golang**</u>  
- Plugin 'majutsushi/tagbar' 				<u>**Tagbar 比 taglist 更现代的代码结构浏览工具**</u>   
- Plugin 'kien/rainbow_parentheses.vim' 	<u>**括号显示增强**</u>   
- Plugin 'scrooloose/nerdcommenter' 		<u>**快速 加减注释**</u>   
- Plugin 'Raimondi/delimitMate' 			<u>**输入引号,括号时,自动补全**</u>  
- Plugin 'kien/ctrlp.vim' 					<u>**文件查找**</u>  
- Plugin 'altercation/vim-colors-solarized'<u>**主题配色插件**</u>  
- Plugin 'vim-scripts/AutoComplPop' 		<u>**自动补全，与neocomplete有点冲突，推荐使用neocomplete**</u>  
- Plugin 'vim-scripts/OmniCppComplete' 	<u>**OmniCppComplete 自动补全，推荐使用**</u>  
- Plugin 'vim-scripts/taglist.vim' 		<u>**标签导航 要装ctags**</u>  
- Plugin 'Lokaltog/vim-powerline'		<u>**状态栏插件**</u>
- Plugin 'vim-scripts/vcscommand.vim'		<u>**svn插件**</u>

### 出现的问题

**问题一**： `neocomplete requires Vim 7.3.885 or later with Lua support ("+lua").`

出现这个提示是vim没有支持lua，输入命令 
	
	domi@ubuntu:~$ vim --version|grep lua
	+dialog_con      -lua             +rightleft       +writebackup
lua前面有个“-”说明还没支持lua。

解决方法：	
1、重新编译vim，添加lua支持，请参考[这篇文章](http://blog.angluca.com/post/69566488641/%E7%BC%96%E8%AF%91vim%E5%92%8Cmacvim%E5%B8%A6python%E5%92%8Clua%E6%94%AF%E6%8C%81)

>编译vim和macvim带python和lua支持
>首先编译lua安装
>
> cd vim  
> ./configure --with-features=huge --enable-rubyinterp \    
> --enable-pythoninterp --enable-luainterp --enable-perlinterp \    
> --enable-multibyte --enable-sniff  --enable-fontset --enable-cscope \    
> --disable-gui --prefix=/usr  
>
>
> (a) --with-features=huge：支持最大特性  
> (b) --enable-rubyinterp：启用Vim对ruby的支持  
> (c) --enable-pythoninterp：启用Vim对python的支持  
> (d) --enable-luainterp：启用Vim对lua的支持  
> (e) --enable-perlinterp：启用Vim对perl的支持  
> (f) --enable-multibyte：多字节支持 可以在Vim中输入中文  
> (g) --enable-sniff：Vim状态提示 提示Vim当前处于INSERT、NORMAL、VISUAL哪种模式  
> (h) --enable-cscope：Vim对cscope支持  
> (i) --disable-gui：不用编译生成图形界面版gvim  
> (j) --prefix=/usr：编译安装路径  
> (k) 更多参数执行./configure --help查看  
>编译vim
>
>./configure –enable-cscope –enable-multibyte –enable-xim –enable-fontset –with-features=huge –enable-pythoninterp –enable-luainterp –enable-gui=gtk2 –enable-sniff >–with-luajit
>
>编译macvim
>
>./configure –with-features=huge –enable-pythoninterp –enable-luainterp –enable-cscope –with-lua-prefix=/usr/local>

2、参考：[https://github.com/Shougo/neocomplete.vim](https://github.com/Shougo/neocomplete.vim)

	neocomplete requires Vim 7.3.885+ compiled with if_lua. If :echo has("lua") returns 1, then you're done; otherwise, see below.
	
	Make sure you have any of these packages:
	
	vim-nox
	vim-gtk
	vim-gnome
	vim-athena

**问题二**：当tagbar打开时，Easygrep的搜索结果窗口会跑到tagbar的窗口

原因是 easygrep默认打开quickfix 是使用 `:copen`，他会在最后一个窗口打开，所以他会跑到tagbar的下面。
google了一下，参考：

[https://github.com/majutsushi/tagbar/issues/195](https://github.com/majutsushi/tagbar/issues/195)  
[http://stackoverflow.com/questions/6726783/changing-default-position-of-quickfix-window-in-vim](http://stackoverflow.com/questions/6726783/changing-default-position-of-quickfix-window-in-vim)


解决办法：
去改掉（.vim/bundle/vim-easygrep/plugin/EasyGrep.vim）easygrep.vim里面的 copen，搜索`copen` 改为 `bo copen` 或 `botright  copen`

例如： `execute g:EasyGrepWindowPosition." botright copen" `

然而我发现我傻逼了，还是需要仔细读帮助文档：
在.vimrc 里面直接设置 `let g:EasyGrepWindowPosition = "botright"` 就OK了


### 彩蛋

最后，附上两张vim快捷键图，都是从网上扣下来的。

**图一**  
![图1](/images/posts/vim1.png) 

**图二**  
![图1](/images/posts/vim2.png) 