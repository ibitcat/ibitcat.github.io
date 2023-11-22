---
title:  "群晖NAS折腾记"
date: 2023-11-22
tag:
- NAS
---

搭建家庭 NAS 我从很久之前就有这个想法了，期间也会不间断去了解 NAS 相关知识，恰逢双 11 再加上自己的 iphone 存储已经到顶（*也让我获得一个教训，对于长时间使用的电子产品千万不要买丐版*），便在某一天冲动剁手，购入了群晖 NAS `ds224+`，上周到货后，便迫不及待开始折腾起来，期间也踩过了不少坑，本文将记录一个 NAS 新手的折腾之旅。

## 盘位与RAID
在选择 NAS 型号时，纠结了很久 2 盘位和 4 盘位，最终整理了自己的需求如下：
- 家庭照片存储，用于取代 icloud photos（icloud fow windows 同步照片实在时拉跨）
- 构建简单的家庭影音，但是需求不大
- 存储备份资料，包括重要文档，项目代码，书籍pdf等
- 解放电脑的存储压力，家里的台式机和笔记本硬盘都比较小，日积月累都已经变红了
- 可能尝试一些高级玩法，如搭建 git 服务器

结合以上的需求，我觉得 2 盘位已经满足了（其实是荷包不够饱满），配上两张 8T + 12 T 的 NAS 盘，内存加到 6G，应该已经满足。
关于硬盘，其中 8T 是主硬盘，为了保证稳定性，所以在 JD 购入，另外一张 12T 打算作为非重要数据存储以及双盘备份，在小红书上购入，且我并没有 raid，网上关于 raid 众说纷纭，我个人认为用 raid 来做数据备份有点扯淡，关于数据的备份，我还是遵从“多介质多地点”的原则，我的备份策略如下：
- 重要数据但数据未过T（如照片、重要文档等），NAS 内部双盘备份 x 移动硬盘冷备 x 云盘备份，能保证 NAS 内部有备份，家庭其他介质上有备份，以及云端也有备份，有条件可以做多个备份
- 重要数据但数据过大(如购买/下载的视频教程、美术资源等)，视数据大小 NAS 内部双盘备份 x 移动硬盘冷备(多份)
- 普通数据，需要自己根据情况（如可重新获取难度、数据大小）来冷备

总结来说：真正重要的数据其实并不会很大，这些数据就要谨慎之重视之，其他数据视情况而定。
此外，要在硬盘使用到期前用新盘替换，一般周期 5 ~ 6 年，尽量保证硬盘都在“有效期”内。

## DSM 配置
DSM 系统还是较为简单傻瓜，目前我的DSM版本是 7.2，初始化完 NAS，并没有太多东西需要修改，下面列出了我修改的部分：
- 修改了登录门户的 http 端口，默认是 5000 和 5001，按群晖的用户量，应该算是比较周知的端口了，又被人扫描的风险，所以我改掉了
- 网络部分，手动配置了 DNS 服务器，国内首选：`114.114.114.144`或`223.5.5.5`，这里主要是解决 quickconnect 的连接问题；

## 套件

DSM 有一个“套件中心”，其实就是类似手机的 “应用中心”，可以下载安装官方的套件，也可以添加第三方套装源，从而安装第三方的套件，也可以直接手动安装第三方套件，套件的后缀名为 `.spk`。当然，这部分内容应该会持续折腾。

### 官方套件
目前我安装的几个官方套件如下：
- Cloud Sync，这个套件主要是用来同步照片到百度云，如果设置了密码，同步的到云盘的文件将被加密，这样别人下载后看到的内容都是乱码，可以通过群晖提供的软件 Synology Cloud Sync Decryption Tool 来解密文件。

- Synology Drive，配套的 Synology Drive Server 也要一起安装，功能类似微软的 OneDrive，它提供两种模式：同步模式和备份模式。不同的系统都有对于的Drive Client，不过在使用中，app 版本在 4G 网络无法使用quickconnect Id连接 drive，但是在 WIFI 下可以连(公司的wifi下也可以)，不知道是什么原因。目前在4G网络下的解决办法只能是配合内网穿透来连接drive。

- Video Stasion，官方的影音套件，配套的 Advanced Media Extensions 也要一起安装（还需要一个ffmpeg，后面会说），电影海报信息的刮削使用了 TMDB 的api，根据官方的指引注册可以获得 api 的key，不过因为国内墙的关系，api地址`api.themoviedb.org`已经被block，需要使用一些手段才能正常使用，后面会说。

### 社区套件

这里列出了我添加的几个社区套件源：
- 我不是矿神，地址：`https://spk7.imnks.com/`
- synocommunity，地址：`https://packages.synocommunity.com/`

我不是矿神，我主要是用来安装里面的 frp，解决上面提到的 4G 网络访问 drive 的问题，因为我使用的是 [樱花frp](https://www.natfrp.com/)，所以下载安装 `SakuraFrp`，打开后配置也很简单，大概格式如下：
```
token=xxxx      #这里填账号的密钥
idx=123,456     #这里填隧道id，如果有多个隧道用英文逗号隔开
```
![sakuraFrp](/assets/image/posts/2023-11-22-01.png?style=centerme)

synocommunity，这个源里面主要安装 `ffmpeg 6`，安装完后，使用 ssh 登录到nas系统，并使用 `sudo -i` 输入密码后切换到 root 用户，在终端执行下面的命令:
```
bash -c "$(curl "https://raw.githubusercontent.com/darknebular/Wrapper_VideoStation/main/installer.sh")"
```
等待安装完毕。

更高阶的安装参考[Wrapper_VideoStation](https://github.com/darknebular/Wrapper_VideoStation)的文档。

## 科学上网
众所周知的原因，国内上网需要一些科技，我这里使用 clash + privoxy 的组合来实现科学上网。
- clash，原作者已经删库跑路了，不过找到了一个备份仓库[Clash-premium](https://github.com/zhongfly/Clash-premium-backup)
- privoxy，github有套件版本[privoxy-dsm](https://github.com/davidcava/privoxy-dsm)，下载套件手动安装即可

### clash
clash 安装步骤如下：
- 下载并解压 clash 二进制包，根据cpu平台选择正确的压缩包，我选择 clash-linux-amd64-n2023-09-05-gdcc8d87.gz
- 下载自己的机场的 config.yaml 配置文件
- 下载 [yacd dashboard](https://github.com/haishanh/yacd)
- 修改config.yaml配置，指定 dashboard

命令如下：
```bash
mkdir -p /root/.config/clash
cd /root/.config/clash
wget "你的订阅链接" -O config.yaml
wget https://github.com/zhongfly/Clash-premium-backup/releases/download/2023-09-05-gdcc8d87/clash-linux-amd64-n2023-09-05-gdcc8d87.gz
wget https://github.com/haishanh/yacd/releases/download/v0.3.8/yacd.tar.xz
gzip -d clash-linux-amd64-n2023-09-05-gdcc8d87.gz
tar -zxvf yacd.tar.xz
mv clash-linux-amd64 clash
chmod +x clash
mv public dashboard
```

编辑 config.yaml 配置文件，添加 dashboard ui:
```
external-ui: dashboard // 增加这一行
external-controller: 0.0.0.0:9090
```

输入 `./clash -d .` 运行 clash，在浏览器中输入 `http://你nas的ip:9090/ui` 即可进入 clash 网页管理界面。

每次手动运行clash也挺麻烦，我们用服务的方式启动 clash，并加入到开机启动。先移动 clash，
```
mv clash /usr/local/bin
```

然后创建 clash.service 文件：
```
vim /usr/local/lib/systemd/system/clash.service
```

输入以下内容：
```
[Unit]
Description=clash service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/clash
Restart=on-failure # or always, on-abort, etc

[Install]
WantedBy=multi-user.target
```

最后运行 systemctl 命令加载服务并启动 clash 服务：
```
systemctl daemon-reload
systemctl enable clash
systemctl start clash
```

到这里，其实就可以使用 clash 来科学上网了，可以在用户目录的 `.bashrc` 文件中(没有则创建)添加如下内容：
```
# Open proxy
clashOn() {
    export https_proxy=http://127.0.0.1:7890
    export http_proxy=http://127.0.0.1:7890
    export all_proxy=socks5://127.0.0.1:7890
    echo "HTTP/HTTPS Proxy on"
}

# Close proxy
clashOff() {
    unset http_proxy
    unset https_proxy
    unset all_proxy
    echo "HTTP/HTTPS Proxy off"
}
```
保存后，运行`source ~/.bashrc` 使脚本生效，若想要开启 clash 全局代理，则输入 `clashOn`，反之则输入`clashOff`。

### privoxy
手动开关 clash 全局代理还是略显麻烦，若能实现 windows 系统的按规则自动代理就完美了，privoxy 正好能帮助解决这个痛点。

安装步骤如下：
- 下载[privoxy-dsm套件](https://github.com/davidcava/privoxy-dsm/releases/download/3.0.33-1/privoxy-x86_64-3.0.33-1.spk)，并手动安装
- ssh 登录到 nas 系统，运行`sudo /var/packages/privoxy/scripts/addprivileges`
- 回到 nas 系统界面，点击图标打开 Privoxy 管理页面
![privoxy](/assets/image/posts/2023-11-22-02.png?style=centerme)

接下来，我们要修改配置，再次使用 ssh 登录到系统，并切换成 root 用户，进入 Privoxy 套件目录：
```
cd /var/packages/privoxy/
```

暂时只关注下面两个目录：
- etc 为配置目录，包括 `config`配置文件，`*.action` 代理规则文件，`*.filter`过滤规则文件
- var 是运行时目录，里面有pid文件和log文件

修改 `etc/config`:
```
# 注释掉下面三个自带的 action 规则文件
#actionsfile match-all.action # Actions that are applied to all sites and maybe overruled later on.
#actionsfile default.action   # Main actions file
#actionsfile user.action      # User customizations

# 添加自己的 action 文件
actionsfile my.action

# 注释掉过滤规则文件，我们只使用代理功能，过滤功能暂时不用(可拦截广告)
#filterfile default.filter
#filterfile user.filter      # User customizations

# 开启 debug 1 和 65535 (自己决定,我是用来检测自动代理是否成功)
debug 1
debug 65535
```

接下来，添加自己的代理规则文件`vim etc/my.action`，输入以下内容：
```
# 默认不走代理，其他走socks5代理
{{alias}}
direct = +forward-override{forward .}
socks5 = +forward-override{forward-socks5 localhost:7891 .}

#default
{direct}
/

#socks5代理
{socks5}
.themoviedb.org
.youtube.com
.google.
.google.com
.docker.com
.docker.io
.github.com
```
保存后要修改文件的拥有者：
```
chown privoxy:privoxy etc/my.action
```
最后，重启套件生效。测试下是否能够成功代理：
```
curl -x 'http://127.0.0.1:8118' www.google.com
```

> 这里需要注意的，上面的端口 7891，要和 clash 的config.yaml 的socks5 端口一致（如果clash没有开启mixed_port）。

我们可以在 privoxy 管理后台页面查看和编辑自己的代理规则。
![privoxy-action](/assets/image/posts/2023-11-22-03.png?style=centerme)

最后最后，我们要在 DSM 中设置使用代理。
![dsm-proxy](/assets/image/posts/2023-11-22-04.png?style=centerme)

## 其他
dsm 毕竟是linux系统，也可以安装其他的linux常用工具。

### 安装 ncat
DSM 系统默认没有安装 nact 工具(telnet也没有安装)，可以运行 `sudo synogear install`，等待下载后进入 synogear，运行 `synogear list` 列出可用的工具列表，里面就有 ncat。例如，检查 privoxy 是否监听 8118 端口:
```
ncat 127.0.0.1 8118 -vz
```

参考：
- [linux下部署Clash+dashboard](https://parrotsec-cn.org/t/linux-clash-dashboard/5169)
- [linux 配置 privoxy 实现系统全局/自动代理](https://blog.kelu.org/tech/2020/10/24/linux-privoxy.html)
- [理解socks5协议的工作过程和协议细节](https://wiyi.org/socks5-protocol-in-deep.html)