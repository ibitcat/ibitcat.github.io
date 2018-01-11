---
layout: post
title:  "每日笔记 —— lua"
date:   2017-10-16
excerpt: "记录了工作中，每天的笔记，分类整理。lua 部分"
tag:
- 读书笔记
comments: true
---

1. lua 获取本机ip：`os.execute("ifconfig -a|grep inet|grep -v 127.0.0.1|grep -v inet6|awk '{print $2}'|tr -d \"addr:\"")`，其实就是一个shell命令。
2. lua的元表和元方法：**元表**像是一个“操作指南”，里面包含了一系列操作的解决方案，每一个操作的解决方案就是元方法（以`__`开头的key），例如：__index元方法。
3. __index元方法，引用自[这篇文章](http://blog.csdn.net/xocoder/article/details/9028347)：  
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
4. __index元方法的工作流程：
	- 1.在表中查找，如果找到，返回该元素，找不到则继续
	- 2.判断该表是否有元表（操作指南），如果没有元表，返回nil，有元表则继续
	- 3.判断元表（操作指南）中有没有关于索引失败的指南（即`__index`方法），如果没有（即`__index`方法为nil），则返回nil；如果`__index`方法是一个表，则重复1、2、3； 如果`__index`是一个函数，则以 table 和 key 作为参数调用它。  
5. userdata的元表，[参考](http://www.cnblogs.com/zhangdongsheng/p/3653303.html)，**重点：**在lua代码中的普通表，不能作为userdata的metatable。必须使用`luaL_newmetatable`创建的表才能作为userdata的metatable。luaL_newmetatable创建的元表仅在栈中被声明，并没有加入到lua代码中，所以在lua层是无法访问这个元表的。
6. lua调用C函数是，先将参数从左往右压栈，然后调用C函数，最后把返回值也压栈，并告诉lua返回了几个值。**这个过程lua会自己维护栈**。lua调用完C函数后，栈中只有会之前压入的参数，以及返回值，**不应该存在其他的值在栈中**。
7. c调用lua函数，**要注意栈的变化**，lua_pcall 之后，一定要将栈复原。

	~~~c
	int st = lua_gettop(svr->vm); // 调用之前栈大小
    lua_pushcfunction(svr->vm, l_ecb);
    lua_pushvalue(svr->vm, svr->ev_handler[timer_out]);
    lua_pushinteger(svr->vm, id);
    lua_pushboolean(svr->vm, erased);
    lua_pcall(svr->vm, 2, 0, -4);
    lua_settop(svr->vm, st); // 调用后，恢复栈
	~~~

8. lua正则匹配，主要参考：[lua匹配模式](http://www.cnblogs.com/whiteyun/archive/2009/09/02/1541043.html)和[Lua 字符串查找函数](http://blog.csdn.net/zhangxaochen/article/details/8084396)

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
	print( ('"hello" "hello"'):find('"(.*)"') ) --输出hello
	~~~

9. 关于lua的取模运算，有两种方式`%运算符`和`math.mod`，推荐使用**`math.mod`**：

	对于正数而言，两种方式效果是一样的，`a%b == math.mod(a,b) == a-math.floor(a/b)*b`  
	对于负数来说，这两种取模方式却不同：
	
	`%`         等价于 `a - math.floor(a/b)*b`，是将**商向下取整**  
	`math.mod`  等价于 `a - math.ceil(a/b)*b `，是将**商向上取整**

10. lua对小数取模：根据等式`a%b == a - math.floor(a / b) * b`可以推演出x % 1的结果为x的小数部分，而x - x % 1的结果则为x的整数部分。类似的，x - x % 0.01则是x精确到小数点后两位的结果。例如`3.1415926 - 3.1415926%0.01 = 3.14`

11. lua尾调用：就是指某个函数的最后一步是调用另一个函数。例如：`function f(x) return g(x) end`

	举个例子：领导A向员工C问话，正常的流程是：领导A可能不知道员工C（员工太多），他需要先找来主管B说：你去问问你手底下的员工，公司交给他的任务XX是否已经完成，然后B就去问负责任务的员工C任务完成情况。
	
	C已经完成了任务xx，怎么把这个结果告诉领导A？  

	- 1、非尾调用的方式是：C把结果告诉主管B，然后主管B再告诉领导A。  
	- 2、尾调用的方式是：在B询问C的时候，B就说你直接把任务完成情况直接告诉领导就行了，不用再通过我了，那么C在回话领导的时候就直接告诉领导A，我已经完成了任务。跳过了B那一环。节约回答成本。  


	关于尾调用以及尾递归可参考[尾调用优化](http://www.ruanyifeng.com/blog/2015/04/tail-call.html)和[Lua 函数、闭包、尾调用总结](https://www.tuicool.com/articles/uiUnMn)

12. 