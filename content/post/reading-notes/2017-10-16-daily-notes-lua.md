---
layout: post
title:  "每日笔记 —— lua篇"
date:   2017-10-16
description: "记录了工作中，每天的笔记，分类整理。lua的笔记相对较多，本篇文章将单独记录lua部分"
tags:
- 读书笔记
comments: true
---

记录从工作至今，工作期间遇到的一些关于lua方面理解不太清晰的部分、相关的新知识等。


1. lua的元表和元方法：**元表**像是一个“操作指南”，里面包含了一系列操作的解决方案，每一个操作的解决方案就是元方法（以`__`开头的key），例如：__index元方法。
2. __index元方法，引用自[这篇文章](http://blog.csdn.net/xocoder/article/details/9028347)：  
	很多人对此都有误解，这个误解是：*如果A的元表是B，那么如果访问了一个A中不存在的成员，就会访问查找B中有没有这个成员。*而这个理解是完全错误的，实际上，即使将A的元表设置为B，而且B中也确实有这个成员，返回结果仍然会是nil，原因就是B的__index元方法没有赋值。别忘了我们之前说过的：“元表是一个操作指南”，定义了元表，只是有了操作指南，但不应该在操作指南里面去查找元素，而__index方法则是“操作指南”的“索引失败时该怎么办”。  
	~~~lua
	father = {  
	    house=1  
	}  
	father.__index = father --注意这一步：把father的__index方法指向自己  
	son = {  
	    car=1  
	}  
	setmetatable(son, father)  
	print(son.house) 
	~~~ 
3. __index元方法的工作流程：
	- 1.在表中查找，如果找到，返回该元素，找不到则继续
	- 2.判断该表是否有元表（操作指南），如果没有元表，返回nil，有元表则继续
	- 3.判断元表（操作指南）中有没有关于索引失败的指南（即`__index`方法），如果没有（即`__index`方法为nil），则返回nil；如果`__index`方法是一个表，则重复1、2、3； 如果`__index`是一个函数，则以 table 和 key 作为参数调用它。  
4. userdata的元表，[参考](http://www.cnblogs.com/zhangdongsheng/p/3653303.html)，**重点：**在lua代码中的普通表，不能作为userdata的metatable。必须使用`luaL_newmetatable`创建的表才能作为userdata的metatable。luaL_newmetatable创建的元表仅在栈中被声明，并没有加入到lua代码中，所以在lua层是无法访问这个元表的。
5. lua调用C函数是，先将参数从左往右压栈，然后调用C函数，最后把返回值也压栈，并告诉lua返回了几个值。**这个过程lua会自己维护栈**。lua调用完C函数后，栈中只会有之前压入的参数，以及返回值，**不应该存在其他的值在栈中**。
6. c调用lua函数，**要注意栈的变化**，lua_pcall 之后，一定要将栈复原。

	~~~c
	int st = lua_gettop(svr->vm); // 调用之前栈大小
    lua_pushcfunction(svr->vm, l_ecb);
    lua_pushvalue(svr->vm, svr->ev_handler[timer_out]);
    lua_pushinteger(svr->vm, id);
    lua_pushboolean(svr->vm, erased);
    lua_pcall(svr->vm, 2, 0, -4);
    lua_settop(svr->vm, st); // 调用后，恢复栈
	~~~

7. lua正则匹配，主要参考：[lua匹配模式](http://www.cnblogs.com/whiteyun/archive/2009/09/02/1541043.html)和[Lua 字符串查找函数](http://blog.csdn.net/zhangxaochen/article/details/8084396)以及[Step By Step(Lua字符串库)](http://www.cnblogs.com/stephen-liu74/archive/2012/07/11/2425233.html)。

	|字符		| 备注		|
	|:-------:	|:---------	|
	|`.`		|任意字符	|
	|`%a`   	|字母 		|
	|`%c`   	|控制字符 	|
	|`%d`  		|数字 		|
	|`%l`  		|小写字母	|
	|`%p`  		|标点字符 	|
	|`%s`  		|空白符 		|
	|`%u`  		|大写字母 	|
	|`%w`  		|字母和数字	|
	|`%x`  		|十六进制数字	|
	|`%z`  		|代表0的字符 |
	|`%b`  		|用来匹配对称的字符，例如`%b()`、`%b[]`和`%b<>`，用来匹配各种括号 |
	|[数个字符类]|与任何[]中包含的字符类配对. 例如`[%w_]`与任何字母/数字, 或下划线符号(_)配对，[0-9]则匹配0到9的数字范围 |
	|[^数个字符类]|与任何不包含在[]中的字符类配对. 例如`[^%s]`与任何非空白字符配对 |
	|`(、)、.、[、%`|特殊字符	|
	|`+ - * ?`  	|特殊字符，模式修饰符	|
	|`^`  		|'^'开头的模式只匹配目标串的开始部分，例如：`string.find(s, "^%d")`，检查字符串s是否以数字开头|
	|`$`  		|'$'结尾的模式只匹配目标串的结尾部分，例如：`string.find(s, "^[+-]?%d+$")`，检查字符串s是否是一个整数|
	{: rules="all" frame="border"}

	需要注意的是，贪婪和懒惰这两种匹配方式。

	`*`： 匹配前面指定的 0 或多个同类字符， 尽可能匹配更**长**的符合条件的字串  
	`+`： 匹配前面指定的 1 或多个同类字符， 尽可能匹配更**长**的符合条件的字串  
	`-`： 匹配前面指定的 0 或多个同类字符， 尽可能匹配更**短**的符合条件的字串   
	`?`： 匹配前面指定的 0 或 1个同类字符

	~~~lua
	print( ('"hello" "hello"'):find('"(.+)"') ) --输出hello" "hello
	print( ('"hello" "hello"'):find('"(.-)"') ) --输出hello
	~~~

8. 关于lua的取模运算，有两种方式`%运算符`和`math.mod`，推荐使用**`math.mod`**：

	对于正数而言，两种方式效果是一样的，`a%b == math.mod(a,b) == a-math.floor(a/b)*b`  
	对于负数来说，这两种取模方式却不同：
	
	`%`         等价于 `a - math.floor(a/b)*b`，是将**商向下取整**  
	`math.mod`  等价于 `a - math.ceil(a/b)*b `，是将**商向上取整**

9. lua对小数取模：根据等式`a%b == a - math.floor(a / b) * b`可以推演出x % 1的结果为x的小数部分，而x - x % 1的结果则为x的整数部分。类似的，x - x % 0.01则是x精确到小数点后两位的结果。例如`3.1415926 - 3.1415926%0.01 = 3.14`

10. lua尾调用：就是指某个函数的最后一步是调用另一个函数。例如：`function f(x) return g(x) end`

	举个例子：领导A向员工C问话，正常的流程是：领导A可能不知道员工C（员工太多），他需要先找来主管B说：你去问问你手底下的员工，公司交给他的任务XX是否已经完成，然后B就去问负责任务的员工C任务完成情况。
	
	C已经完成了任务xx，怎么把这个结果告诉领导A？  

	- 1、非尾调用的方式是：C把结果告诉主管B，然后主管B再告诉领导A。  
	- 2、尾调用的方式是：在B询问C的时候，B就说你直接把任务完成情况直接告诉领导就行了，不用再通过我了，那么C在回话领导的时候就直接告诉领导A，我已经完成了任务。跳过了B那一环。节约回答成本。  


	关于尾调用以及尾递归可参考[尾调用优化](http://www.ruanyifeng.com/blog/2015/04/tail-call.html)和[Lua 函数、闭包、尾调用总结](https://www.tuicool.com/articles/uiUnMn)

11. lua协程，类似于线程的概念，但是又有所区别，lua协程的核心是`resume`和`yeild`，它们的工作方式类似于CPU的**保护现场和恢复现场**。yeild的参数是调用者resume的返回值，而下一次resume的参数又是被还原的那个yeild的返回值。具体参考[这篇文章](https://www.tuicool.com/articles/AnAVJbu)。

	![resume和yeild关系](/images/posts/lua-coroutine.png)

12. 一个[lua版本的屏蔽字处理](http://www.cnblogs.com/zhangfeitao/p/6378458.html)，采用字典树算法，以及一个lua版的[DFA屏蔽字算法](http://blog.csdn.net/u010223072/article/details/50542531)。
13. lua[官方FAQ](http://www.luafaq.org/)以及云风的[lua5.3帮助文档](https://github.com/cloudwu/lua53doc)翻译。
14. lua弱表，即**表中的元素为弱引用的表**。它是相对于普通的强引用的表，对于普通的强引用表，**当你把对象放进表中的时候，就产生了一个引用，那么即使其他地方没有对表中元素的任何引用，gc也不会被回收这些对象**。 引用自[Lua中的weak表——weak table](http://www.cnblogs.com/sifenkesi/p/3850760.html)。

	`__mode`字段可以取以下三个值：k、v、kv。

	- k表示table.key是weak的，也就是table的keys能够被自动gc；
	- v表示table.value是weak的，也就是table的values能被自动gc；
	- kv就是二者的组合。任何情况下，只要key和value中的一个被gc，那么这个key-value pair就被从表中移除了
	
	关于弱表和普通表的个人理解：普通的强引用表可以想象成一根**网线**，而弱表就相当于**无线WiFi**。
15. lua和c相互调用，关于lua和C之间的相互调用，有两种方式：

	- 1、程序主体在C中运行，C函数注册到Lua中。C调用Lua，Lua调用C注册的函数，C得到函数的执行结果。 
	- 2、程序主体在Lua中运行，C函数作为库函数供Lua使用。 

	相比于第一种方式（通常是用lua做配置），第二种方式使用的更加普遍。有一个**比较重要的点**：第一种方式的调用，用的是lua的全局栈，当C调用完lua的函数后，C需要维护好lua栈索引；而第二种方式的调用，**用来交互的栈不是全局栈**，每一个C函数都有他自己的私有栈。当Lua调用C函数的时候，第一个参数总是在这个私有栈的index=1的位置。

	参考：[Lua5.3 与C交互学习(lua调用c函数)](http://blog.csdn.net/bbhe_work/article/details/48950175)、[lua 与 C 交互](http://wudaijun.com/2014/12/lua-C/)、[从Lua中调用C函数](http://blog.csdn.net/vermilliontear/article/details/50947379)

16. lua语法静态检查工具——`luacheck`，参考[这里](http://blog.csdn.net/mycwq/article/details/52589415)，顺便一提，关于skynet和lua的相关知识，可以参考这个博主的[skynet技术与应用](http://blog.csdn.net/column/details/13019.html)系列文章。

	**lua check的安装:**

	~~~shell
	wget https://github.com/mpeterv/luacheck/archive/0.21.1.zip
	unzip 0.21.1.zip
	cd luacheck-0.21.1
	mkdir /usr/local/luacheck
	lua install.lua /usr/local/luacheck
	vim .bash_profile
	export LUACHECK=/usr/local/luacheck/bin
	export PATH="$LUACHECK:$PATH"
	source .bash_profile
	luacheck --version
	
	#显示如下：
	Luacheck: 0.21.1
	Lua: Lua 5.1
	LuaFileSystem: Not found
	LuaLanes: Not found
	~~~

17. [lua——在C函数中保存状态](http://blog.csdn.net/shimazhuge/article/details/44309251)，包括:注册表（类似全局变量）、环境表（适用于lua5.1，类似static变量）、upvalue（类似局部静态变量）。

18. lua 5.1可变参数`...`和`arg`的区别，[参考](http://www.cnblogs.com/cbscan/articles/2022164.html)，在代码块中两者只能用其一。

	~~~lua
	function test(a,b,...)
		-- 要么用for，要么直接print(...)，不能同时存在
		for i = 1, arg.n do
			print(arg[i])
		end
		-- print(...)
	end
	~~~

19. 如何编写高性能lua代码，[原版](http://www.lua.org/gems/sample.pdf)和中文译文版[高性能 Lua 技巧（译）](https://segmentfault.com/a/1190000004372649)。
20. Lua和C/C++语言通信的主要方法是一个无处不在的虚拟栈。栈的特点是**先进后出**。  
在Lua中，Lua堆栈就是一个struct，堆栈索引的方式可是是正数也可以是负数，区别是：**<font color="red">正数索引1永远表示栈底，负数索引-1永远表示栈顶</font>**。