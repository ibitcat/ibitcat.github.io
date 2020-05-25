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
<p align="center"><em>skynet 服务模块数据结构</em></p>


## 服务创建

### 服务上下文
我们知道 skynet 是一个 Actor 模型的框架，所谓的“服务”本质就是一个 Actor，在上一篇文章中，我描述了一个等式：
`一个 Actor 的参与者 = {消息队列, 处理逻辑(服务)}`。

那在 skynet 底层中，如何描述一个 Actor 参与者呢？ 通过上面的结构体关系图可知，其实在 skynet 底层使用了结构体 `struct skynet_context` 来描述一个 Actor
参与者（我把它称之为 **服务上下文**），这个结构体的定义如下：

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
这个结构体有三个重要的字段：
- instance，它是一个指针，指向了一个服务对象，它是由服务模板 `struct skynet_module * mod` 创建出来的
- cb，服务的回调函数，是消息被服务对象执行的**唯一**通道，这个回调函数可以重新设置
- queue，它是一个指针，指向了消息队列对象，这个对象中的的 `q->queue` 字段才真正存放了消息数组

就是上面的三个字段，才构成了一个 Actor 核心骨架，消息队列内的消息被服务的回调函数 `cb` 执行，这也是为什么说 skynet 是消息驱动的。
这里需要注意下 `void * cb_ud` 这个字段，它是

```
typedef int (*skynet_cb)(struct skynet_context * context, void *ud, int type, int session, uint32_t source , const void * msg, size_t sz);

ctx->cb(ctx, ctx->cb_ud, type, msg->session, msg->source, msg->data, sz);
```

### 服务模板
这里主要讲解服务动态库，它们的接口规范、作用，以及是怎么创建服务实例和初始化服务的。

### 消息队列
这里主要奖金服务的消息队列是怎么创建，以及全局消息队列是怎么回事。

## 消息处理
### 工作线程
工作线程的创建，工作流程是怎么样的

### 全局消息队列

### 消息生产
主要讲解消息怎么创建、有哪些消息，怎么插入到次级消息队列，又怎么插入到全局消息队列

### 消息消费
主要讲解消息是怎么被派发的
