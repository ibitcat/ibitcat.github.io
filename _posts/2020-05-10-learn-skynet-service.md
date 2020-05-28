---
title:  "深入理解skynet —— 服务"
date: 2020-05-10
tag:
- skynet
---

在深入服务模块时，先思考下面两个问题：
1. 服务实例是怎么创建出来的？
2. 消息怎么插入到队列并消费的呢？

带着这两个问题，我们开始一步步剖析 skynet 的服务模块。在这之前，先放出一张图，这张图描述了 skynet 服务模块的数据结构。

![skynet 服务模块](/assets/image/posts/2020-05-10-01.svg)

接下来，我会分成**服务的创建**和**消息的处理**两个部分来深入服务模块。

## 服务创建流程
这一部分所说的**创建**不仅仅指服务对象的创建，还包括其消息队列的创建、服务模板动态库，同时还会介绍他们初始化的过程，以及在整个创建并初始化的过程中，需要注意的点及其原因。

### 服务上下文
首先，要描述一个叫做 **『服务上下文』** 的东西（我把它称之为 **服务上下文**- -，也就是 context），可以说它是 skynet 底层中非常重要的一个东西，基本上绝大部分的逻辑都是在围绕这个上下文进行。我们知道 skynet 是一个 Actor 模型的框架，所谓的“服务”本质就是一个 Actor，在上一篇文章中，我描述了一个等式：

```markup
一个 Actor 的参与者 = {消息队列, 处理逻辑(服务实例)}
```

那在 skynet 底层中，如何描述一个 Actor 参与者呢？ 通过上面的结构体关系图可知，其实在 skynet 底层使用了结构体 `struct skynet_context` 来描述一个 Actor 参与者，这个结构体的定义如下：

```c
struct skynet_context {
	void * instance;
	struct skynet_module * mod;
	void * cb_ud;
	skynet_cb cb;
	struct message_queue *queue;
	FILE * logfile;
	uint64_t cpu_cost;	// in microsec
	uint64_t cpu_start;	// in microsec
	char result[32];
	uint32_t handle;
	int session_id;
	int ref;
	int message_count;
	bool init;
	bool endless;
	bool profile;

	CHECKCALLING_DECL
};
```
这个结构体有四个重要的字段：
- `instance`，它是一个指针，指向了一个服务对象，它是由服务模板 `struct skynet_module * mod` 创建出来的
- `cb`，服务的回调函数，是消息被服务对象执行的**唯一**通道，这个回调函数可以重新设置
- `queue`，它是一个指针，指向了消息队列对象，这个对象中的 `q->queue` 字段才真正存放了消息数组
- `cb_ud`，它是一个被回调函数真实调用的服务实例对象的指针

就是上面的四个字段，才构成了一个 Actor 核心骨架，消息队列内的消息被服务的回调函数 `cb` 执行，这也是为什么说 skynet 是消息驱动的。一个大致的流程是：一个消息通过服务的回调函数，然后传递给服务实例，最终被消费处理掉。代码描述如下：

```c
// 回调函数类型
typedef int (*skynet_cb)(struct skynet_context * context, void *ud, int type, int session, uint32_t source , const void * msg, size_t sz);

// 回调函数调用
ctx->cb(ctx, ctx->cb_ud, type, msg->session, msg->source, msg->data, sz);
```

这里需要注意下，在服务实例第一次初始化并设置回调后，*cb_ud* 与 *instance* 是同一个东西，即`ctx->instance = ctx->cb_ud`，但是对于 *snlua* 服务启动后，会重新设置一次回调，这里就产生了两个区别的：
1. `cb_ud` 指向由原来的 `ctx->instance` 变成了 *lua vm*（lua 主线程），它们存在这样的一个关系：`ctx->instance->L = ctx->cb_ud = luavm`；
2. `cb` 回调函数变成了一个封装了 lua 调用的函数；

具体的更改流程的代码我贴在了下面：
```c
static int
lcallback(lua_State *L) {
	struct skynet_context * context = lua_touserdata(L, lua_upvalueindex(1));
	int forward = lua_toboolean(L, 2);
	luaL_checktype(L,1,LUA_TFUNCTION);
	lua_settop(L,1);
	lua_rawsetp(L, LUA_REGISTRYINDEX, _cb);

	lua_rawgeti(L, LUA_REGISTRYINDEX, LUA_RIDX_MAINTHREAD);
	lua_State *gL = lua_tothread(L,-1);

	if (forward) {
		// cb_ud=gL 
		// cb = forward_cb，消息派发后不free掉，用于转发消息
		skynet_callback(context, gL, forward_cb);
	} else {
		// cb = _cb，消息派发后free掉
		skynet_callback(context, gL, _cb);
	}

	return 0;
}
```

### 创建上下文
在上一节展示了服务上下文的结构体，接下来看下服务上下文的**创建**和**初始化**流程，下图是一个服务上下文的详细创建过程。
![skynet 服务上下文创建](/assets/image/posts/2020-05-10-02.svg?style=centerme)

整个流程都封装在 `skynet_context_new` 这个函数中，此函数一共有三个地方调用，其中有两处是在 skynet 启动过程中（`skynet_start`）调用，这两个函数调用会创建两个重要的服务：

- **logger** 服务，用来输出 skynet 的日志信息到文件（由配置字段 `logger` 指定）或标准输出（stdout），当然，我们可以重载 skynet 自带的 logger 服务，修改配置字段 `logservice` 即可。
- **bootstrap** 服务，是一个 lua 服务，它负责引导基础服务，例如 launcher 服务等，它的作用类似于电脑开机时的**引导程序**一样。

前面两处调用都是用来初始化 skynet 进程所需的核心服务，而第三处调用是为了支持在已经启动的服务实例中能方便的启动其他服务，skynet 底层进一步对上面的流程进行封装，然后把封装好的接口暴露个上层使用，类似于 linux 内核暴露出的系统调用。

封装的服务启动接口原型如下：
```c
static const char *
cmd_launch(struct skynet_context * context, const char * param);
```
这个接口接收一个 `const char *param` 的参数，它用来控制**skynet 应该启动一个什么服务，以及服务启动时的参数**，服务类型名称和服务参数用空格分隔。例如，传递参数是 `"snlua launcher"`，则表示启动一个 launcher 的 lua 服务（这个服务专门负责 lua 层的服务启动，是一个非常重要的服务）。

下图是 launcher 服务创建一个新服务的调用图：
![skynet 服务模块](/assets/image/posts/2020-05-10-03.svg?style=centerme)
<p align="center"><em>launcher 服务</em></p>

创建好的 context 会被注册到服务仓库 `handle_storage *H` 中，如果注册成功，会给 context 分配一个 handle (即服务上下文的id，类似与文件描述符id)，handle 是一个无符号 32 位整型，高 8 位用来表示 harbor_id，低 24 位则表示 context 的索引号 index，即：`handle=(harbor_id<<24)|index`。需要注意的是，这两部分值都需要大于 0，即：`harbor_id>0 && index>0`[^footer1]；然后创建服务的消息队列 `queue`，至此，服务已经创建完成，接下来便是服务的初始化过程。

服务初始化过程，其实是一个服务差异化的过程，每个创建好的服务实例通过传入参数的不同，会有不同的设置，这一部分会在接下来的汽车工厂的例子有更多详细的讲解。
然后设置服务的回调，最后把服务的消息队列 push 到全局消息队列中，以被工作线程消费、执行。

### 服务模板

所谓的服务模板（我暂且这么命名ƪ(˘⌣˘)ʃ），有点像一个工厂类，一个服务模板可以创建和初始化一个或多个服务实例，同时在创建服务实例时传递一些参数，对其进行一些定制操作。

套用现实生活场景中，一个汽车工厂可以生产很多辆汽车，每一辆生产出来的汽车就相当于一个服务实例，当然，工厂可以在生产汽车时，为了满足客户需求，提供一些可控的定制化服务，例如：车身颜色定制、配件增加等，而其中用来生产汽车的流水线就是一个服务模板。

在 skynet 中，这些模板是以动态库的形式存在，这些服务模板动态库编译后存放在 cservice 目录，目前，skynet 已有四个服务模板，它们分别是：
1. logger，日志服务模板，在上面已经有提到；
2. gate，网关服务模板，最新版的 skynet 已经有另外一套 lua gate 实现方案；
3. harbor，提供 master/slave 模式的集群方案；
4. snlua，所有的 lua 服务都由它负责。

当然，所有的服务模板都需要遵守一些约定，它们需要提供以下 4 个 api:
- create，**必须**，此 api 用来创建对应的服务实例；
- init，**必须**，此 api 用来对服务实例进行初始化，同时还会设置 context 的回调实例和回调函数；
- release，**必须**，用来释放服务实例，做一些清理工作；
- signal，*可选*，用来跳出 lua 服务的死循环[^footer2]。

以上的这些接口定义可以在 ***skynet_module.h*** 头文件中找到。

```c
// api 原型
typedef void * (*skynet_dl_create)(void);
typedef int (*skynet_dl_init)(void * inst, struct skynet_context *, const char * parm);
typedef void (*skynet_dl_release)(void * inst);
typedef void (*skynet_dl_signal)(void * inst, int signal);

// 服务模板结构
struct skynet_module {
	const char * name;
	void * module;
	skynet_dl_create create;
	skynet_dl_init init;
	skynet_dl_release release;
	skynet_dl_signal signal;
};
```
另外，在 `skynet_context_new` 过程中，服务模板的查询是动态加载的，也就是说，在执行 query 时才去模板仓库 `modules *M` 中查找，如果未找到，则尝试加载对应的动态库，具体加载流程在 `skynet_module_query` 中。

### 消息队列
一个服务实例一定有一个服务消息队列（很多人称之为次级消息队列）与之对应，它的实现方式是一个环形队列。

![skynet 服务消息队列](/assets/image/posts/2020-05-10-04.svg?style=centerme)
<p align="center"><em>服务消息队列</em></p>

消息队列的容量默认是 64，若容量不足则以 2 倍的方式进行增长，另外，当消息队列中堆积的消息过载，则每次达到 1024 的整数倍时，由监控线程发出警报。

### 监控相关

关于服务上下文的一些核心已经在上面基本介绍的差不多了，最后介绍一下 context 的一些小细节或辅助功能，它们会关联在结构体 `struct skynet_context` 上的一个或多个字段，利用好这些功能，对我们分析查找问题有很大的帮助。

#### 服务日志
这个功能可以把服务处理过的消息都导出到一个文件中，配合 debug console 的 `logon` 和 `logoff` 两个命令使用，这个功能可以帮助我们对某个指定的服务进行问题查找，下面是用 skynet 的 example 做了一个演示。

![服务实例日志](/assets/image/posts/2020-05-10-05.png?style=centerme)

#### 性能指标
这些性能指标包括服务已经处理的消息总数、服务处理消息的 cpu 总耗时、是否出现死循环等，可以配合 debug console 的 `stat` 命令使用（都是调用了底层的 `cmd_stat`），下面是所有性能指标的名称和作用：
- cpu，表示这个服务处理消息消耗的 cpu 总耗时，毫秒为单位，由 profile 字段控制，默认开启，数值越大表示这个服务越繁忙；
- message，表示已经被这个服务处理过的消息总数；
- time，这个指标可以计算出某个服务当前正在处理的消息已耗时长，可以用来检测一个服务的某个逻辑耗时是不是过长，一般情况为 0，如果值较大就需要注意了，是不是由业务逻辑有问题，可能死循环或者逻辑计算过大；
- endless，若为 1 则表示服务长时间没有进行消息处理，可能出现了死循环，也可能是出现 endless 的前一个逻辑耗时超过 5s，它的值是由监控线程设置；
- mqlen，表示服务当前还未处理的消息数量，如果消息堆积过多，会出现 `May overload， message queue lenght=xxx` 的错误日志，详细机制会在后面的消息处理部分详细讲解；
- task，这一个指标较为特殊，它不是由底层提供，它的值需要在 lua 层获取，表示某个服务当前挂起的 coroutine 数量。

## 消息处理流程
### 工作线程
工作线程的创建，工作流程是怎么样的

### 全局消息队列

### 消息生产
主要讲解消息怎么创建、有哪些消息，怎么插入到次级消息队列，又怎么插入到全局消息队列

### 消息消费
主要讲解消息是怎么被派发的

<hr>
[^footer1]: 关于 harbor id 的设计，请参考[重新设计并实现了 skynet 的 harbor 模块](https://blog.codingnow.com/2014/06/skynet_harbor_redesign.html)。
[^footer2]: 关于为什么需要一个 signal api，请参考云风博客[跳出死循环](https://blog.codingnow.com/2015/03/skynet_signal.html)。