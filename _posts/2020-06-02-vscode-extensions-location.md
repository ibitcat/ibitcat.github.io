---
title:  "修改 VS Code 插件位置"
date: 2020-06-02
tag:
- 编辑器
---

因为最近更新了 Win 10，在新版本中的 WSL 支持了 VSC `Remote - WSL`，所以决定试用一下 VS Code。但是，发现它的插件存放路径默认是放在 `%userprofile%/.vscode/extensions` 中。这会存在两个问题：

- 插件会占用 C 盘空间（我只给 C 盘划分了 50G）
- 如果格式化 C 盘重装系统，需要重新安装插件，费时费力

然后，我在网上搜索了一番，大致找到了两种更改插件位置的方法。

## 使用参数

其核心点就是启动 VSC 时指定参数 `--extensions-dir` 到自定义的插件路径，例如：

```
Code.exe --extensions-dir "D:\Program Files\Microsoft VS Code\extensions"
```

最好的方式还是修改快捷方式，把上面的参数内容附加到快捷方式的**目标**处，如下图所示：
![VSC 快捷方式](/assets/image/posts/2020-06-02-01.png?style=centerme)

修改后，把之前下载的插件复制到自定义目录即可。这样，以后从快捷方式启动的 VS Code 就会去自定义的插件路径来加载插件。

**但是**，仅仅只修改快捷方式会存在一个问题，从右键菜单方式启动的 VS Code 依然会去默认的路径去加载插件，为了解决这个问题，需要去修改注册表。这里列举了右键菜单启动的四种类型：

- 对选中文件右键点击弹出的菜单
- 对选择目录右键点击弹出的菜单
- 在目录空白处右键点击弹出的菜单
- 对磁盘分区右键点击弹出的菜单

它们对应了不同的注册表项，下面是它们所对应的注册表项，一一对应即可：

```
计算机\HKEY_CLASSES_ROOT\*\shell\VSCode\command
计算机\HKEY_CLASSES_ROOT\Directory\shell\VSCode\command
计算机\HKEY_CLASSES_ROOT\Directory\Background\shell\VSCode\command
计算机\HKEY_CLASSES_ROOT\Drive\shell\VSCode\command
```

找到这些注册表项，在 Code.exe 后添加如下内容：
```
--extensions-dir "D:\Program Files\Microsoft VS Code\extensions"
```

![VSC 注册表修改](/assets/image/posts/2020-06-02-02.png?style=centerme)

不过，这样修改后只能针对本地启动 VS Code，对于在 WSL 使用 `code .` 启动的远程 VS Code，还是会去默认路径加载插件，也可能是我使用姿势不对，暂时先凑合用吧。

## 创建软链接

使用参数启动，还是存在很多问题，所以另辟蹊径，使用软链接的方式[^footer1]，把自定义目录链接到默认目录，打开 CMD (管理员权限)，输入一下命令：
```
mklink /D extensions "D:\Program Files\Microsoft VS Code\extensions"
```

![VSC 软链接](/assets/image/posts/2020-06-02-03.png?style=centerme)

这种方式虽然还是需要在用户目录生成一个 `.vscode` 目录，但是里面的插件最终是存储在其他地方，至少不会占用系统盘空间。

**2020-06-11 更新**
今天 VS Code 更新重启后，发现无法启动，最后找到原因是因为更新后 VS Code 会重置它安装路径的文件，而我之前又把插件的文件夹 `extensions` 放在了它的安装路径内，导致更新后 VS Code 找不到它的插件路径，把插件文件夹从安装路径移出到其他路径即可。例如：
```
mklink /D extensions "D:\Data\extensions"
```

## git 问题
在实际使用 Remote WSL 时，遇到了一个 git 的问题，虽然不是 VS Code 的问题，但是也顺便记录一下，方便日后查阅。问题表现如下：

在 WSL 中使用命令 `code .` 打开一个 windows 上的 git 项目时，项目内的所有文件都显示未 *modify* 状态，但是这些文件并没有修改过。如下图所示：
![VSC Git](/assets/image/posts/2020-06-02-04.png?style=centerme)

出现这个现象的原因其实是由 git 提供的 **“换行符自动转换”** 功能引起的，我在[早前的一篇博文](/_posts/2015-12-16-git-doc/#%E7%AC%AC%E5%9B%9B%E9%83%A8%E5%88%86---%E5%87%BA%E7%8E%B0%E7%9A%84%E9%94%99%E8%AF%AF%E4%BB%A5%E5%8F%8A%E8%A7%A3%E5%86%B3%E6%96%B9%E6%B3%95)有记录过，因为在 Remote WSL 打开的文件使用的是 Linux 环境，而检出到 windows 文件系统内的文件会在检出时把换行符由 `\n` 转换成 `\r\n`，所以就出现了上述现象。一种解决方式是，在 windows 系统下检出时，关闭 “换行符自动转换” 功能，但是之前已经拉取的项目就要重新 pull 一次。 
```
#提交时转换为LF，检出时转换为CRLF
git config --global core.autocrlf true   

#提交时转换为LF，检出时不转换
git config --global core.autocrlf input   

#提交检出均不转换
git config --global core.autocrlf false
```

如果不想关闭这个功能，也可以在 WSL 环境内，把项目拉取到 windows 文件系统内。

<hr>
[^footer1]: 关于 Windows 软链接，请参考[这篇文章](https://www.cnblogs.com/wjw6692353/p/11106912.html)。