---
layout: post
title: golang：interface 和 nil 以及 error nil
date: 2015-3-14 15:16:00
updated: 2015-11-05 17:19:00
description: "详解golang的interface接口，以及介绍nil与 error类型的nil的区别."
categories: [golang]
comments: true

---

ps:主要参考：  
>[http://my.oschina.net/chai2010/blog/117923](http://my.oschina.net/chai2010/blog/117923 "Go中error类型的nil值和nil")  
>[http://my.oschina.net/goal/blog/194233](http://my.oschina.net/goal/blog/194233 "详解interface和nil")  
>[http://my.oschina.net/goal/blog/194308](http://my.oschina.net/goal/blog/194308 "golang类型转换")


### interface（接口）
在golang中，万物皆interface{}，所以golang中可以将任意类型赋值给interface{}，包括nil也可以赋值给interface{}，interface{}有点像c艹中的**纯虚基类**，只包含了方法的集合。

interface在底层的实现包括两个成员：类型（`_type`）和值(`data`)，我对lua比较熟，这点上类似lua的值在底层的实现，所以比较容易理解（我估计大部分动态语言都是这么干的吧）。_type表示存储变量的动态类型，也就是这个值真正是什么类型的。int？bool？……  data存储变量的真实值。

例如： var value interface{} = int32(100)  
那么value在底层的结构就是：{_type:int32,data=100}

关于普通类型与interface{}的转换：  
1、普通类型转换到interface{}是隐式转换；例如 fmt.Println(),我们可以传入任意类型的值，Println都会把传入的值转换成interface{}类型  
2、interface{}转换成普通类型需要显式转换；

关于接口的实现：  
假如有一个接口 type interface{} T, *T包含了定义在T和*T上的所有方法，而T只包含定义在T上的方法。

### nil值
在golang中，nil只能赋值给指针、channel、func、interface、map或slice类型的变量。如果未遵循这个规则，则会引发panic。

如何判断一个interface{} 是否是 nil？

根据上面对interface{}的介绍，判断interface{}是否为nil的规则：  
>只有在内部值和类型都未设置时(nil, nil)，一个接口的值才为 nil。特别是，一个 nil 接口将总是拥有一个 nil 类型。若我们在一个接口值中存储一个 int 类型的指针，则内部类型将为 int，无论该指针的值是什么：(*int, nil)。 因此，这样的接口值会是非 nil 的，即使在该指针的内部为 nil。

那么思考如下问题：  

```golang
	type T struct{
		Age int
		Name string
	}
	
	func main(){
		t1:= &T{20,"kaka"}
		fmt.Printf("%p\n", t1)
		fmt.Println(t1==nil)
		//fmt.Println(*t1 == nil) //cannot convert nil to type test
	}
```

为什么注释的那行会报错？我的分析是：  
t1 真正指向的是 T类型的一个实例，是一个T类型的值，而nil值无法转换成除了指针、channel、func、interface、map或slice的类型，所以会报错。这也验证了： **nil只能赋值给指针、channel、func、interface、map或slice类型的变量。如果未遵循这个规则，则会引发panic。**

### error类型的nil
TODO