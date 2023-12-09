---
title:  "群晖NAS折腾记"
date: 2023-11-22
tag:
- NAS
---

搭建家庭 NAS 我从很久之前就有这个想法了，期间也会不间断去了解 NAS 相关知识，恰逢双 11 再加上自己的 iphone 存储已经到顶（*也让我获得一个教训，对于长时间使用的电子产品千万不要买丐版*），便在某一天冲动剁手，购入了群晖 NAS `ds224+`，上周到货后，便迫不及待开始折腾起来，期间也踩过了不少坑，本文将记录一个 NAS 新手的折腾之旅。

## 盘位与RAID
在选择 NAS 型号时，纠结了很久 2 盘位和 4 盘位，最终整理了自己的需求如下：
- 家庭照片存储，用于取代 `icloud photos`（icloud fow windows 同步照片实在时拉跨）
- 构建简单的家庭影音，但是需求不大
- 存储备份资料，包括重要文档，项目代码，书籍pdf等
- 解放电脑的存储压力，家里的台式机和笔记本硬盘都比较小，日积月累都已经变红了
- 可能尝试一些高级玩法，如搭建 git 服务器

结合以上的需求，我觉得 2 盘位已经满足了（其实是荷包不够饱满），配上两张 8T + 12 T 的 NAS 盘，内存加到 6G，应该已经满足。
关于硬盘，其中 8T 是主硬盘，为了保证稳定性，所以在 JD 购入，另外一张 12T 打算作为非重要数据存储以及双盘备份，在小红书上购入，且我并没有 raid，网上关于 raid 众说纷纭，我个人认为用 raid 来做数据备份有点扯淡，关于数据的备份，我还是遵从“多介质多地点”的原则，我的备份策略如下：
- 重要数据但数据未过T（如照片、重要文档等），NAS 内部双盘备份 x 移动硬盘冷备 x 云盘备份，能保证 NAS 内部有备份，家庭其他介质上有备份，以及云端也有备份，有条件可以做多个备份
- 重要数据但数据过大(如购买/下载的视频教程、美术资源等)，视数据大小 NAS 内部双盘备份 x 移动硬盘冷备(多份)
- 普通数据，需要自己根据情况（如可重新获取难度、数据大小）来冷备

总结来说：**真正重要的数据其实并不会很大，这些数据就要谨慎之重视之，其他数据视情况而定**。
此外，要在硬盘使用到期前用新盘替换，一般周期 5 ~ 6 年，尽量保证硬盘都在“有效期”内。

## DSM 配置
DSM 系统还是较为简单傻瓜，目前我的DSM版本是 7.2，初始化完 NAS，并没有太多东西需要修改，下面列出了我修改的部分：
- 修改了登录门户的 http 端口，默认是 5000 和 5001，按群晖的用户量，应该算是比较周知的端口了，又被人扫描的风险，所以我改掉了;
- 网络部分，手动配置了 DNS 服务器，国内首选：`114.114.114.144`或`223.5.5.5`，这里主要是解决 quickconnect 的连接问题；
- 设置了代理服务器，地址：`localhost`，端口：`8118`，通过 `clash+privoxy` 方案开启自动代理;

## 套件

DSM 有一个“套件中心”，其实就是类似手机的 “应用中心”，可以下载安装官方的套件，也可以添加第三方套装源，从而安装第三方的套件，也可以直接手动安装第三方套件，套件的后缀名为 `.spk`。当然，这部分内容应该会持续折腾。

### 官方套件
目前我安装的几个官方套件如下：
- `Cloud Sync`，这个套件主要是用来同步照片到百度云，如果设置了密码，同步的到云盘的文件将被加密，这样别人下载后看到的内容都是乱码，可以通过群晖提供的软件 `Synology Cloud Sync Decryption Tool` 来解密文件。

- `Synology Drive`，配套的 `Synology Drive Server` 也要一起安装，功能类似微软的 OneDrive，它提供两种模式：同步模式和备份模式。不同的系统都有对于的Drive Client，~~不过在使用中，app 版本在 4G 网络无法使用quickconnect Id连接 drive，但是在 WIFI 下可以连(公司的wifi下也可以)，不知道是什么原因。目前在4G网络下的解决办法只能是配合内网穿透来连接drive~~。

    **【已解决】**：通过和群晖官方的技术人员咨询，发现 drive app上的登录请求都发生到了全球站，而不是中国站，原来是我的 iphone 地区设置成美国(应该是之前登录美区账号后没有切换回来)，具体操作：进入 `设置 ➡️ 通用 ➡️ 地区与语言`，修改地区成 **【中国】**。

- `Video Stasion`，官方的影音套件，配套的 `Advanced Media Extensions` 也要一起安装（还需要一个ffmpeg，后面会说），电影海报信息的刮削使用了 TMDB 的api，根据官方的指引注册可以获得 api 的key，不过因为国内墙的关系，api地址`api.themoviedb.org`已经被block，需要使用一些手段才能正常使用，后面会说。

### 社区套件

这里列出了我添加的几个社区套件源：
- 我不是矿神，地址：`https://spk7.imnks.com/`
- synocommunity，地址：`https://packages.synocommunity.com/`

我不是矿神，我主要是用来安装里面的 frp，解决上面提到的 4G 网络访问 drive 的问题，因为我使用的是 [樱花frp](https://www.natfrp.com/)，所以下载安装 `SakuraFrp`，打开后配置也很简单，大概格式如下：
```bash
token=xxxx      #这里填账号的密钥
idx=123,456     #这里填隧道id，如果有多个隧道用英文逗号隔开
```
![sakuraFrp](/assets/image/posts/2023-11-22-01.png?style=centerme)

synocommunity，这个源里面主要安装 `ffmpeg 6`，安装完后，使用 ssh 登录到nas系统，并使用 `sudo -i` 输入密码后切换到 root 用户，在终端执行下面的命令:
```bash
bash -c "$(curl "https://raw.githubusercontent.com/darknebular/Wrapper_VideoStation/main/installer.sh")" -- -s install
```
等待安装完毕。更高阶的安装参考[Wrapper_VideoStation](https://github.com/darknebular/Wrapper_VideoStation)的文档。

**注意：** 安装完 AME 套件后要激活一次(即使用Video station播放一次)再安装，否则会报以下错误：
```bash
ERROR: YOU HAVEN'T THE LICENCE LOADED in Advanced Media Extension package. Please, LOAD this licence and try again with the Installer.
```
参考这个[issue](https://github.com/darknebular/Wrapper_VideoStation/issues/36)。

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
tar -xvf yacd.tar.xz
mv clash-linux-amd64 clash
chmod +x clash
mv public dashboard
```

编辑 config.yaml 配置文件，添加 dashboard ui:
```yaml
external-ui: dashboard // 增加这一行
external-controller: 0.0.0.0:9090
```

输入 `./clash -d .` 运行 clash，在浏览器中输入 `http://你nas的ip:9090/ui` 即可进入 clash 网页管理界面。

每次手动运行clash也挺麻烦，我们用服务的方式启动 clash，并加入到开机启动。先移动 clash，
```bash
mv clash /usr/local/bin
```

然后创建 clash.service 文件：
```bash
vim /usr/local/lib/systemd/system/clash.service
```

输入以下内容：
```ini
[Unit]
Description=clash service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/clash
# or always, on-abort, etc
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

最后运行 systemctl 命令加载服务并启动 clash 服务：
```bash
systemctl daemon-reload
systemctl enable clash
systemctl start clash
```

可以使用 `sudo journalctl -fu clash` 来查看日志，前提是 systemd-journald 服务要先运行，用 `sudo systemctl status systemd-journald` 来查看开启状态。

到这里，其实就可以使用 clash 来科学上网了，可以在用户目录的 `.bashrc` 文件中(没有则创建)添加如下内容：
```bash
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
```bash
cd /var/packages/privoxy/
```

暂时只关注下面两个目录：
- etc 为配置目录，包括 `config`配置文件，`*.action` 代理规则文件，`*.filter`过滤规则文件
- var 是运行时目录，里面有pid文件和log文件

修改 `etc/config`:
```bash
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

# 监听地址这里我设置同时监听 ipv4 和 ipv6本地地址
# 8118 端口不要改，否则web管理页面会打不开
listen-address [::]:8118
```

接下来，添加自己的代理规则文件`vim etc/my.action`，输入以下内容：
```bash
# 默认不走代理，其他走socks5代理
{{alias}}
direct = +forward-override{forward .}
socks5 = +forward-override{forward-socks5 localhost:7891 .}

#default
{direct}
/

#socks5代理
{socks5}
.synocommunity.com
.themoviedb.org
.youtube.com
.google.
.google.com
.docker.com
.docker.io
.github.com
```
保存后要修改文件的拥有者：
```bash
chown privoxy:privoxy etc/my.action
```
最后，重启套件生效。测试下是否能够成功代理：
```bash
curl -x 'http://127.0.0.1:8118' www.google.com
```

> 这里需要注意的，上面的端口 7891，要和 clash 的config.yaml 的socks5 端口一致（如果clash没有开启mixed_port）。

我们可以在 privoxy 管理后台页面查看和编辑自己的代理规则。
![privoxy-action](/assets/image/posts/2023-11-22-03.png?style=centerme)

最后最后，我们要在 DSM 中设置使用代理。
![dsm-proxy](/assets/image/posts/2023-11-22-04.png?style=centerme)

## 开启ipv6和DDNS
关于如何开启 ipv6 这里不细说，网上有很多教程，我采用的方案是：**光猫桥接模式 + 路由器拨号上网**，路由器是 TP-LINK 的 `TL-R470GP-AC`，它是一款 `PoE·AC` 一体机，设置 ipv6 的教程参考官方文档 [企业路由器IPv6上网配置指导](https://smb.tp-link.com.cn/service/detail_article_4370.html)，按照步骤操作成功开通，不过需要注意的是，在测试 ipv6 连接时，要退出本机运行的代理软件，或者把代理的 ipv6 打开（*这里我被坑了很久*）。

DDNS 我使用的是群晖官方的服务，傻瓜操作不折腾了，最终也能连接成功，最好开启群晖的防火墙，只放行局域网访问和特定端口。

![ddns](/assets/image/posts/2023-11-22-05.png?style=centerme)

强调一点，因为我上面开启了代理服务器，DDNS 更新也会走代理，但是只代理了 ipv6，所以 clash 那边的配置也要把 ipv6 打开，打开的方式也很简单，在 clash 的配置文件中添加一行 `ipv6: true` ，然后重启 clash 服务即可。

## 其他
dsm 毕竟是linux系统，也可以安装其他的linux常用工具。

### 安装 ncat
DSM 系统默认没有安装 nact 工具(telnet也没有安装)，可以运行 `sudo synogear install`，等待下载后进入 synogear，运行 `synogear list` 列出可用的工具列表，里面就有 ncat。例如，检查 privoxy 是否监听 8118 端口:
```bash
ncat 127.0.0.1 8118 -vz
```

### 安装opkg包管理工具
包管理工具有 `ipkg` 和 `opkg`，不过前者已经停止更新，所以推荐使用后者。安装步骤参考[官方 wiki — Synology NAS](https://github.com/Entware/Entware/wiki/Install-on-Synology-NAS)。

下面列出一些常用命令：
```bash
sudo opkg list              #列出opkg 可用的包
sudo opkg list-installed    #列出已安装的包
sudo opkg install <pkg>     #安装包
sudo opkg remove <pkg>      #卸载包
sudo opkg find <pkg>        #查找包
```

### 使用fdupes来删除重复图片
群晖无法安装 `fdupes`，不过在 github 上找到一个 golang 版本的版本，正好 opkg 能安装 golang，可以自己 git 拉下来源码编译运行。
```bash
# 能找到 golang 包，而且版本还比较新
sudo opkg find go
go - 1.20.7-1 - Go is an open source programming language that makes it
 easy to build simple, reliable, and efficient software.

sudo opkg install go

# 临时把 go 加入 PATH
export PATH="$PATH:/opt/bin/go/bin"

# 设置goproxy
go env -w GOPROXY=https://goproxy.cn,direct

# clone 代码
git clone https://github.com/OSPG/godedupe.git

# 编译
cd godeedupe
go mod init godeedupe
go mod tidy
go build

# 查找重复图片
./godeedupe  -t ~/Photos -m > dup.log

# 只移除 PhotoLibrary 文件夹中重复的图片到 dups 文件夹下
mkdir dups
grep -w "PhotoLibrary" dup.log |grep -v "@eaDir" |xargs -I {} mv {} dups/

# 检查照片无误后删除重复照片
rm -rf dups/
```

### Nginx 反向代理 Gogs
群晖系统本身自带了 nginx 服务，所以我这里没有使用 docker 的方式。配置步骤如下：
```bash
# 1. 创建自定义nginx 配置目录
cd ~
mkdir -p nginx/conf.d
mkdir -p nginx/ssl

# 2. 上传证书和私钥文件到 ssl

# 3. 创建 nginx 配置
cd nginx/conf.d
vim dsm.conf

# 4. 输入以下内容
server {
    #listen 8043 ssl;
    listen [::]:8043 ssl ipv6only=on;

    server_name xxx.synology.me;
    ssl_certificate /var/services/homes/xxx/nginx/ssl/cert.pem;
    ssl_certificate_key /var/services/homes/xxx/nginx/ssl/key.pem;

    location / {
        proxy_connect_timeout 60;
        proxy_read_timeout 60;
        proxy_send_timeout 60;
        proxy_intercept_errors off;
        proxy_http_version 1.1;
        proxy_set_header        Host                            $http_host;
        proxy_set_header        Upgrade                         $http_upgrade;
        proxy_set_header        Connection                      $connection_upgrade;
        proxy_set_header        X-Real-IP           $remote_addr;
        proxy_set_header        X-Forwarded-For         $proxy_add_x_forwarded_for;
        proxy_set_header        X-Forwarded-Proto       $scheme;

        proxy_pass http://127.0.0.1:3000;
    }

    # DS Photo 配置，默认使用的是本地 80 和 443 端口，此处使用 443 端口，即 https
    #location /photo {
    #    proxy_pass https://群晖内网地址;
    #}

    error_page 403 404 500 502 503 504 @error_page;
    # 一个奇技淫巧🤣，让http和https用同一个端口，参考 https://www.zhihu.com/question/34017892
    error_page 497 https://$server_name:8043$request_uri;

    location @error_page {
        root /usr/syno/share/nginx;
        rewrite (.*) /error.html break;
        allow all;
    }
}

#server {
#    listen [::]:8030 ipv6only=on;
#    server_name bitcat.synology.me;
#    rewrite ^(.*) https://$server_name:8043$1 permanent;
#}

# 5. 保存后重新load配置
sudo systemctl reload nginx.service
```

需要注意的是，上面的 cert.pem 证书需要添加上中间证书，在群晖导出 `Let's Encrypt` 证书压缩包，里面含有三个文件:
- 私钥文件：private.pem
- 证书文件: cert.pem
- 中间证书：chain.pem

如果只使用 cert.pem，在 git 下拉代码时会报以下错误：
```bash
SSL certificate problem: unable to get local issuer certificate
或者
SSL certificate problem: unable to verify the first certificate
```

这就是缺少中间文件，可以通过以下命令查看详细的证书信息：
```bash
 openssl s_client -showcerts -connect xxx.synology.me:8043
```

解决办法也很简单，把 chain.pem 的内容复制后追加到 cert.pem，然后 reload nginx 即可。

### 修改docket时区
群晖docker 容器的默认时区是 UTC，可以通过容器的终端机➡️新增➡️bash，输入 `date` 命令查看。

修改时区步骤：
- 使用 ssh 登录 dsm;
- 输入 `sudo docker ps` 查看容器列表;
- 输入 `sudo docker cp /etc/localtime [时区不对的容器id]:/etc/localtime` 修改时区文件;

此时，再查看容器时间就正常了。


## 参考：
- [linux下部署Clash+dashboard](https://parrotsec-cn.org/t/linux-clash-dashboard/5169)
- [linux 配置 privoxy 实现系统全局/自动代理](https://blog.kelu.org/tech/2020/10/24/linux-privoxy.html)
- [理解socks5协议的工作过程和协议细节](https://wiyi.org/socks5-protocol-in-deep.html)
- [群晖使用自有 Nginx自定义配置](https://lox.im/index.php/764.html)
- [nginx 配置中间证书](https://www.cnblogs.com/xuehuashanghe/p/14554856.html)