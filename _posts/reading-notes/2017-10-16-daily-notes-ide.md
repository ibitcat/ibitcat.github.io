---
layout: post
title:  "每日笔记 —— 编辑器"
date:   2017-10-16
excerpt: "记录了工作中，每天的笔记，分类整理。编辑器部分。"
tag:
- 读书笔记
comments: true
---

## 1、vim

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


## 2、sublime text3

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
