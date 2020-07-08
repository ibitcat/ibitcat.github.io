---
title:  "启动多个 mysql 实例"
date: 2020-06-01
tag:
- 环境搭建
---

最近项目需要切出一个周版本的分支，供测试在上面验收已经完成的功能，且之前的测试服务器还有剩余的资源没有利用起来，遂决定再启动一组服务器，这就需要两组服务器的数据要分割开，最稳妥、合理的方式是一组服务器搭配一个 Mysql 实例（也就是一个 mysqld 进程），这样两组服务器的数据库就不会混在一起，且安全性更有保障，不会因为 mysql 服务器进程的崩溃导致所有服都无法运行。这种方式也是我这些年接触过的游戏服务器最常用的方式，经历过多个项目的考验。

虽然在之前也搭建过多 mysql 实例的环境，但是当时没有记录下来，且之前的服务器环境使用的是 centos，所以，一些细节有些遗忘，正好借这次机会，在 Ubuntu 18.04 的环境下，尝试搭建一次多实例的 mysql 环境，使用的 mysql 版本为 `5.7.28`。同时把搭建过程中遇到的问题记录下来，以便查阅。

## 多实例的实现方式

Mysql 多实例有3种实现方式（*从网上拷贝的*）：
1. 基于多配置文件，通过使用多个配置文件来启动不同的进程，以此来实现多实例。  
    优点：逻辑简单，配置简单  
    缺点：管理起来不方便

2. 基于 mysqld_multi，通过官方自带的 mysqld_multi 工具，使用单独配置文件来实现多实例  
    优点： 便于集中管理管理  
    缺点： 不方便针对每个实例配置进行定制

3. 基于IM，使用 MySQL 实例管理器（MYSQLMANAGER），这个方法好像比较好不过也有点复杂  
    优点：便于集中管理  
    缺点：耦合度高。IM一挂，实例全挂，不方便针对每个实例配置进行定制

我使用了是第一个方式进行多实例，这种方式启动的多实例，每个实例进程有自己独立的端口、datadir 等。

## 配置实例
最简单的办法是复制一份默认的 mysql 配置，然后修改其中的一些字段即可。例如：创建一个 mysql1 的实例，使用端口 3307，整个实例的数据存放在 `/data/mysql1` 目录下，该目录又包括三个重要的子目录：`run`，`log`，`data`，目录结构如下：

```
data
└── mysql1
    ├── data -- 注意：此目录不要预先创建
    ├── log
    └── run
```

data 目录用来存放数据库数据，由配置 `datadir` 指定；log 目录存放 mysql 实例的运行日志，由配置 `log_error` 指定；run 存放进程运行产生的一些 fd 文件，例如 unix socket、pid 等。

拷贝一份 mysql 的默认配置到新实例目录：
```
cp /etc/mysql/mysql.conf.d/mysqld.cnf /data/mysql1/my.cnf
```
这里顺带提一下如何查看 mysql 的默认参数，可以使用命令 `mysqld --print-defaults` 打印出使用 apt 安装的 mysql 实例的默认参数，例如：

```
domi@domi-notebook:~$ mysqld --print-defaults
mysqld would have been started with the following arguments:
--user=mysql --pid-file=/var/run/mysqld/mysqld.pid --socket=/var/run/mysqld/mysqld.sock --port=3306 --basedir=/usr --datadir=/var/lib/mysql --tmpdir=/tmp --lc-messages-dir=/usr/share/mysql --skip-external-locking --bind-address=127.0.0.1 --key_buffer_size=16M --max_allowed_packet=16M --thread_stack=192K --thread_cache_size=8 --myisam-recover-options=BACKUP --query_cache_limit=1M --query_cache_size=16M --log_error=/var/log/mysql/error.log --expire_logs_days=10 --max_binlog_size=100M
```

接下来修改修改配置字段：
```ini
[mysqld_safe]
socket          = /data/mysql1/run/mysqld.sock
nice            = 0

[mysqld]
user            = mysql
pid-file        = /data/mysql1/run/mysqld.pid
socket          = /data/mysql1/run/mysqld.sock
port            = 3307
basedir         = /usr
datadir         = /data/mysql1/data
tmpdir          = /tmp

#bind-address            = 127.0.0.1

key_buffer_size         = 16M
max_allowed_packet      = 16M
thread_stack            = 192K
thread_cache_size       = 8

myisam-recover-options  = BACKUP
#max_connections        = 100
#table_open_cache       = 64
#thread_concurrency     = 10

query_cache_limit       = 1M
query_cache_size        = 16M

log_error = /data/mysql1/log/error.log
```

需要注意几点：
1. 复制过来的配置，不需要修改 `lc-messages-dir` 配置字段，或者删除此配置，如果这个配置错误，mysql 将无法显示错误信息，只会显示错误码，例如：

    ```
    mysql> show databases;
    ERROR 1820 (HY000): Unknown error 1820

    # 下面才是正常显示
    ERROR 1820 (HY000): You must reset your password using ALTER USER statement before executing this statement.
    ```
2. mysql1 下的子目录中，*data* **不要**预先创建，它会在初始化过程中自动创建；*log* 目录和 *run* 目录**需要**预先创建，并修改所有者为 `mysql:mysql`。

    ```
    chown -R mysql:mysql /data/mysql1/run
    chown -R mysql:mysql /data/mysql1/log
    ```

## 关闭 apparmor

如果是在 Ubuntu 系统上，会在 mysql 初始化过程中遇到目录权限错误的问题，即使使用的是 root 用户也不行，因为**Ubuntu有个AppArmor**，是一个Linux系统安全应用程序，类似于Selinux，AppArmor默认安全策略定义个别应用程序可以访问系统资源和各自的特权，如果不设置服务的执行程序，即使你改了属主属组并0777权限，也是对服务起不到作用[^footer1]。

一种方法是修改 apparmor 的配置 `/etc/apparmor.d/usr.sbin.mysqld`，把 mysql 实例用到的目录和文件都赋予相应的权限，具体修改这里不再赘述，参考默认配置即可。

另外一种方法一劳永逸，直接把 mysqld 从 `enforce` 模式修改为 `complain` 模式，需要安装 apparmor-utils，然后重启 apparmor 服务。

```
sudo apt install apparmor-utils
aa-complain mysqld
/etc/init.d/apparmor restart
aa-status #查看修改是否成功
```

## 初始化实例

Mysql 5.7 之后的版本已经不再推荐使用 `mysql_install_db` 来进行数据库初始化了，推荐使用 `mysqld --initialize` 或 `mysqld --initialize-insecure` 命令来初始化数据库，前者会在 Mysql 的日志文件生成一个随机密码，后者不生成随机密码。

**注意！！**，这里有一个坑，初始化一般会带有一些参数，这些参数一定要放在 `--initialize` 之前，下面是一个成功运行的命令：
```
mysqld --defaults-file=/data/mysql1/my.cnf --user=mysql --initialize
```

一般推荐使用 `--initialize` 来初始化，初始生成的随机密码可以在 error.log 中找到，搜索到这一行日志：
```
[Note] A temporary password is generated for root@localhost: :UCMi%T(R8dx
```
最后面的字符串就是随机密码。

## 启动实例

初始完成后，接下来就可以启动新的 mysql 实例了，运行下面的命令：
```
mysqld_safe --defaults-file=/data/mysql1/my.cnf 2>&1 >/dev/null &
```

启动后，最好查看下日志，看是否成功启动。如果启动失败，在日志的最后有一行错误日志：
```
[ERROR] Aborting
```

如果启动成功，会有如下日志信息：
```
2020-06-03T01:59:10.031179Z 0 [Note] InnoDB: Waiting for purge to start
2020-06-03T01:59:10.081889Z 0 [Note] InnoDB: 5.7.30 started; log sequence number 2629907
2020-06-03T01:59:10.082403Z 0 [Note] InnoDB: Loading buffer pool(s) from /data/mysql1/data/ib_buffer_pool
2020-06-03T01:59:10.082820Z 0 [Note] Plugin 'FEDERATED' is disabled.
2020-06-03T01:59:10.086656Z 0 [Note] InnoDB: Buffer pool(s) load completed at 200603  9:59:10
2020-06-03T01:59:10.095822Z 0 [Note] Found ca.pem, server-cert.pem and server-key.pem in data directory. Trying to enable SSL support using them.
2020-06-03T01:59:10.095852Z 0 [Note] Skipping generation of SSL certificates as certificate files are present in data directory.
2020-06-03T01:59:10.097016Z 0 [Warning] CA certificate ca.pem is self signed.
2020-06-03T01:59:10.097156Z 0 [Note] Skipping generation of RSA key pair as key files are present in data directory.
2020-06-03T01:59:10.097548Z 0 [Note] Server hostname (bind-address): '127.0.0.1'; port: 3307
2020-06-03T01:59:10.097652Z 0 [Note]   - '127.0.0.1' resolves to '127.0.0.1';
2020-06-03T01:59:10.097774Z 0 [Note] Server socket created on IP: '127.0.0.1'.
2020-06-03T01:59:10.137292Z 0 [Note] Event Scheduler: Loaded 0 events
2020-06-03T01:59:10.137753Z 0 [Note] /usr/sbin/mysqld: ready for connections.
Version: '5.7.30-0ubuntu0.18.04.1'  socket: '/data/mysql1/run/mysqld.sock'  port: 3307  (Ubuntu)
```

## 修改密码

使用上面的随机密码进行第一次登陆：
```
mysql -uroot -p":UCMi%T(R8dx" -P3307 -S '/data/mysql1/run/mysqld.sock'
```

`-S` 选项表示使用 unix socket 进行登陆，登陆成功后必须进行密码修改，否则其他的 mysql 操作都会报 1820 错误。
修改密码：
```
mysql> SET PASSWORD = PASSWORD('123456');
Query OK, 0 rows affected, 1 warning (0.00 sec)
```

至此，一个新的 mysql 实例已经创建成功。

<hr>
[^footer1]: 引用自[这篇博文](https://www.cnblogs.com/linxiyue/p/8229048.html)。