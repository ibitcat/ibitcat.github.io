---
title:  "修改 VS Code 插件位置"
date: 2020-06-02
tag:
- 编辑器
---

因为最近更新了 Win 10，在新版本中的 WSL 支持了 VSC `Remote - WSL`，所以决定试用一下 VS Code。但是，发现它的插件存放路径默认是放在 `%userprofile%/.vscode/extensions` 中。这会存在两个问题：

- 插件会占用 C 盘空间（我只给 C 盘划分了 50G）
- 如果格式化 C 盘重装系统，需要重新安装插件，费时费力

然后，我在网上搜索到了更改插件位置的方法，其核心就是启动 VSC 时指定参数 `--extensions-dir` 到自定义的插件路径，例如：

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

**当日更新：**

修改使用了一会，发现上面的修改还是存在很多问题，另辟蹊径，使用软链接的方式[^footer1]，把自定义目录链接到默认目录，打开 CMD (管理员权限)，输入一下命令：
```
mklink /D extensions "D:\Program Files\Microsoft VS Code\extensions"
```

![VSC 软链接](/assets/image/posts/2020-06-02-03.png?style=centerme)

<hr>
[^footer1]: 关于 Windows 软链接，请参考[这篇文章](https://www.cnblogs.com/wjw6692353/p/11106912.html)。