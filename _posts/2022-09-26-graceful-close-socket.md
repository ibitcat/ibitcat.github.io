---
title:  "如何优雅的关闭socket"
date: 2022-09-26
tag:
- socket
---

在网络编程中，一定会涉及到 socket 的关闭操作，那如何安全、优雅的关闭 socket 呢？是仅仅调用 close 就可以了吗？
带着这样的疑问，我们开始发车了。

### close 与 shutdown 的区别
关于 socket 的关闭，内核会提供两个相关的 api：`close(fd)` 和 `shutdown(fd, how)`。在捋清这两个的接口之前，先简单说明下进程是如何持有套接字的。

当在一个进程 A 中创建了一个套接字，这个套接字的引用次数为 1，当另一个进程 B 也持有该套接字，此时套接字的引用次数为 2，以此类推，你可以认为套接字对象是属于内核的资源，进程只持有该套接字对象的一个引用。进程在调用 close() 后引用次数 -1，当引用次数为 0 后，内核才会真正关闭连接，即发送 FIN 包，走四次挥手流程。

#### close 系统调用
在深入 `close(fd)` 的执行流程之前，我们最好要对套接字的有一个大概的了解，一个套接字在内核是如何创建出来的呢？我们可能经常听说**“linux 一切皆文件”**，那么理所当然的套接字 socket 本质也是文件。当我们在上层使用 `socket()` 创建了一个套接字对象，该对象内部会持有一个文件的指针，这点我们可以从内核代码中看出：
```c
// net/socket.c
// 创建一个套接字对象
int sock_create(int family, int type, int protocol, struct socket **res)
{
    // 真正创建socket的函数
    // 一个socket会与一个inode关联，而 inode 则是通过 sock_alloc_inode() 分配
    // 内部使用了一个 sock_inode_cachep 分配器，内核会缓存一些inode，不够则调用 ctor 构造inode，可以参见：init_inodecache
	return __sock_create(current->nsproxy->net_ns, family, type, protocol, res, 0);
}

// 给套接字创建文件对象
struct file *sock_alloc_file(struct socket *sock, int flags, const char *dname)
{
	struct file *file;

	if (!dname)
		dname = sock->sk ? sock->sk->sk_prot_creator->name : "";

    // 创建一个文件
	file = alloc_file_pseudo(SOCK_INODE(sock), sock_mnt, dname,
				O_RDWR | (flags & O_NONBLOCK),
				&socket_file_ops);
	if (IS_ERR(file)) {
		sock_release(sock);
		return file;
	}

    // 将文件指针赋值给 sock->file
	sock->file = file; // 注意：在 sock_close 执行完毕后，sock 将不再持有file，即 sock->file = NULL
	file->private_data = sock; // sock指针赋值给 file->private_data，这样 sock 和 file 就相互引用了
	stream_open(SOCK_INODE(sock), file);
	return file;
}

// socket() 系统调用
int __sys_socket(int family, int type, int protocol)
{
	int retval;
	struct socket *sock;
	int flags;

	// balabala...
	retval = sock_create(family, type, protocol, &sock);
	if (retval < 0)
		return retval;

	return sock_map_fd(sock, flags & (O_CLOEXEC | O_NONBLOCK));
}

```

接下来，我们再来通过内核源码来深入分析 close 的流程：
1. 内核将套接字所持有的文件从进程的文件列表中删除，然后将文件引用计数 -1；
2. 若套接字的文件引用计数为0，则将文件释放流程加入到任务队列，待到进程从内核态返回用户态的时调用；
3. 调用设置在文件上的文件操作回调函数 release，开始进入到套接字的 close 流程；
4. 内核判断接收缓冲区是否还有数据，若有则直接关闭套接字，并向对端发送 RST；
5. 若接收缓冲区为空，则走正常的关闭流程，即设置套接字 FIN_WAIT1，并发送 FIN 包；
6. 套接字与进程上下文分离，并与inode解绑，但是套接字不会在此释放，因为内核可能还需要使用到它；

以下是 linux 内核 `close(fd)` 调用流程:
```markup
close_fd(fd) @fs/file.c
    ├─>pick_file(files, fd) @fs/open.c
    └─>filp_close(file, files) @fs/open.c
        └─>fput(file) @fs/file_table.c
            └─>__fput(file) @fs/file_table.c
                └─>sock_close(inode, file) @net/socket.c #本质是调用 file->f_op->release，即 socket_file_ops 结构体对象的 release 方法
                    └─>inet_release(sock) @net/ipv4/af_inet.c #本质是调用 sock->ops->release，即 inet_stream_ops 结构体对象的 release 方法
                        └─>tcp_close(sk, timeout) @net/ipv4/tcp.c #本质是调用 sock->sk->sk_prot->close，即 tcp_prot 结构体对象的 close 方法
```

上面一堆源码的调用分析也许让人很懵，我直接放出以下几点结论：
1. 调用 close 并不直接操控套接字，而是通过修改它的引用计数来触发真正的关闭动作；
2. 当接收缓冲区没有数据时，调用 close 会走正常的四次挥手流程，对端收到FIN后，会给套接字设置 RCV_SHUTDOWN，epoll 则会抛出 EPOLLIN 和 EPOLLRDHUP ；

	在这种情况下有几点说明：
    - 内核会先设置套接字的状态为 `FIN_WAIT_1`，然后才尽力将发送缓冲区的数据发送出去，并在最后发出 FIN 包；
	- 接上，`close(fd)` 调用返回成功只能表明 FIN 包已经被放入发送缓冲区，至于对方是否收到是不知道的，需要等待对方的 ACK 包；
	- 当套接字进入 `FIN_WAIT1` 或者 `FIN_WAIT2` 后，在 FIN 包收到确认后，再收到其他数据包，则会给对端 RST；
	- 对端收到的 FIN，只能表明对方关闭了发送通道，至于是使用 `close(fd)` 还是 `shutdown(fd, SHUT_WR)` 对端是不知道的，且 epoll 在水平模式下会不断抛出 EPOLLIN 和 EPOLLRDHUP；
	- 接上，对端再继续调用 `write(fd)`，依然能返回写入的数据长度，但是接着 epoll 会抛出 EPOLLERR（Broken pipe）、EPOLLHUP，因为已经对对方的 FIN 进行了确认回复，对方已经处于 `FIN_WAIT2` 状态，当对方再次收到数据包时，会返回 RST。
	- 对端再次调用 `write(fd)`，内核将触发 SIGPIPE 信号，默认处理该信号的方式是退出进程，因此网络编程中一般都会手动处理该信号；
3. 当接收缓冲区还有数据时，调用 close 会导致给对端发送 RST，直接重置了链接，没有走正常的四次挥手流程，对端会抛出 （Connection reset by peer）、EPOLLHUP、EPOLLRDHUP、EPOLLIN（一次性抛出）；

以上三个结论我准备了三个小实验，代码放在[github仓库](https://github.com/domixcat/socket-example)，可自行编译，并结合抓包来验证。

- 实验1(close1)，演示 close() 的引用计数，当 epollclient 进程 close 退出后，shardclient 进程依然能够收发数据。
- 实验2(close2)，演示接收缓冲区为空时调用 close()，服务端收到的 FIN ，但是让服务端再发送数据时，就会产生异常。
- 实验3(close3)，演示接收缓冲区不为空时调用 close()，客户端直接发送了 RST，重置了链接。


***注意：以上的结论是没有考虑 so_linger 。***

顺便我们再思考一个问题，如果对一个已经成功调用 `close()` 的 fd 再次调用诸如 `close`、`read`、`write` 会发生什么情况呢？可以写一个简单例子验证，这里我就不再贴代码，直接把结果放出来：这几个系统调用的返回值都会返回 -1，且错误均为 “Bad file descriptor”。我们可以从内核代码中看出，以 read 为例：

```c
// fs/read_write.c
ssize_t ksys_read(unsigned int fd, char __user *buf, size_t count)
{
	struct fd f = fdget_pos(fd);
	ssize_t ret = -EBADF;

	if (f.file) {
		// close() 后的 f.file == NULL，因此这个 if 是进不来的
		// 原因是 close 调用链中的 pick_file 函数将 fd 从进程的文件列表中删除了
		loff_t pos, *ppos = file_ppos(f.file);
		if (ppos) {
			pos = *ppos;
			ppos = &pos;
		}
		ret = vfs_read(f.file, buf, count, ppos);
		if (ret >= 0 && ppos)
			f.file->f_pos = pos;
		fdput_pos(f);
	}
	return ret;
}

// fs/file.c
static struct file *pick_file(struct files_struct *files, unsigned fd)
{
	struct file *file;
	struct fdtable *fdt;

	spin_lock(&files->file_lock);
	fdt = files_fdtable(files);
	if (fd >= fdt->max_fds) {
		file = ERR_PTR(-EINVAL);
		goto out_unlock;
	}
	file = fdt->fd[fd];
	if (!file) {
		file = ERR_PTR(-EBADF);
		goto out_unlock;
	}
	rcu_assign_pointer(fdt->fd[fd], NULL); // 将fd从fdt->fd中移除
	__put_unused_fd(files, fd); // 放入 unused_fd ，以便复用

out_unlock:
	spin_unlock(&files->file_lock);
	return file;
}

```

#### shutdown 系统调用
与 `close(fd)` 不同的是，`shutdown(fd,how)` 会直接修改套接字，通过 how 参数可以控制 socket 的发送和接收通道，可以只关闭接收通道，也可以只关闭发送通道，也可以同时关闭接收和发送通道。how 参数可以传的值如下所示：
- `SHUT_RD(0)`，关闭接收通道;
- `SHUT_WR(1)`，关闭发送通道；
- `SHUT_RDWR(2)`，先关闭接收通道，然后再关闭发送通道；

我们先说下 SHUT_WR，它与 `close(fd)` 的处理流程类似，内核会将 socket 设置为 `FIN_WAIT1`，然后将发送缓冲区的数据发送出去，并在最后发送 FIN，对方收到 FIN 后，epoll 会抛出 EPOLLRDHUP（该事件需要注册，表示读通道挂断），且对方调用 read 会返回 0，**但是**若接收缓冲区不为空时，SHUT_WR 不会像 close 那样引起 RST。

对于 SHUT_RD，当我们只 SHUT_RD 时，对套接字是没有影响的（可以查看内核代码 tcp_shutdown 函数），依然可以 read 到数据，不过当缓冲区没有数据时，
read 会立即返回0，即使套接字设置为阻塞，具体可以查看内核的 `tcp_recvmsg_locked` 函数；当 SHUT_WR 后再 SHUT_RD，套接字将完全关闭，对方再发送数据会返回 RST，这与 SHUT_RDWR 的效果是一样的。

以下是 linux 内核 `shutdown(fd, how)` 调用流程:
```markup
# shutdown 系统调用流程
__sys_shutdown(fd,how) @net/socket.c # 系统调用 shutdown(fd, how)
	└─>__sys_shutdown_sock(sock,how) @net/socket.c
		└─>inet_shutdown(sock,how) @net/ipv4/af_inet.c #通过调用 sock->ops->shutdown 这个回调函数
			└─>tcp_shutdown(sk, how) @net/ipv4/tcp_ipv4.c # 通过调用 sock->sk->sk_prot->shutdown 这个回调函数

# tcp 收到数据的处理流程
tcp_v4_rcv(skb) @net/ipv4/tcp_ipv4.c
	└─>tcp_v4_do_rcv(sk, skb) @net/ipv4/tcp_ipv4.c
		└─>tcp_rcv_state_process(sk, skb) @net/ipv4/tcp_input.c
```

为了验证不同 how 参数的效果，我同样准备了三个小实验，实验代码链接见上。

- 实验1(shutdown1)，演示了只关闭读通道后的效果。服务端收到链接后每隔 500ms 发送一次数据，客户端则关闭读通道，结果表明客户端依然能收到数据，但read 会立即返回。
- 实验2(shutdown2)，演示了先关闭写通道再关闭读通道的效果。服务器依然间隔 500ms 发送一次数据，客户端延迟 2s 后关闭写通道，然后再等待一段时间关闭写通道，最后服务端因为收到 RST 重置链接，且再次写入数据时触发 SIGPIPE 信号。
- 实验3(shutdown3)，演示了同时关闭读写通道的效果，最后结果与实验2类似。

### so_linger 选项的作用

### 优雅的关闭socket

### 参考
- [TCP: When is EPOLLHUP generated?](https://stackoverflow.com/questions/52976152/tcp-when-is-epollhup-generated)
- [SO_LINGER on Non-Blocking Sockets](http://www.nybek.com/blog/2015/04/29/so_linger-on-non-blocking-sockets/)
- [Closing a non-blocking socket with linger enabled may cause leak](https://learn.microsoft.com/en-us/troubleshoot/windows/win32/close-non-blocked-socket-memory-leak)