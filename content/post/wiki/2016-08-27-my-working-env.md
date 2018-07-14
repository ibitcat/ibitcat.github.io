---
layout: post
title: 我的工作环境分享
date: 2016-08-27 15:08:00 +0800
tags: [环境搭建]
comments: true

---

古语有云：工欲善其事必先利其器。一个程序员必须要有一套属于自己的、熟悉的工作环境。这里做起事来也会提高很多效率。
本文将分享我自己这么多年用得比较顺手的工作环境。

### 1、编辑器&IDE

#### sublime text 3
编辑器首推 **sublime text 3**，而且我也差不多用了3年的时间，期间也有收集了很多很好用的插件、主题等。

- 插件
	
| 插件        	        | 备注           															|
| --------------------- |:--------------------------------------------------------------------------|
| SideBarEnhancements   | 侧边栏增强插件 																|
| BracketHighlighter    | 匹配高亮插件（我使用默认的下划线显示，不刺眼）  								|
| ConvertToUTF8    		| 中文必备插件																|
| IMESupport	     	| 中文输入法鼠标跟随，在st3中如果使用中文输入法（搜狗、微软中文）等，输入法的框没办法跟随鼠标光标，特别是双屏的时候，特别不方便。|
| TortoiseSVN    		| 小乌龟svn，设置快捷键后，update、commit、log、diff简直不能太舒心				|
| HexViewer		      	| 16进制显示，有时候会用到														|
| SublimeLinter-lua		| lua语法检查（其他语言也有对应的SublimeLinter）								|
| Terminal     			| 右键打开cmd，默认是打开powershell，太难看，更改配置可以打开git bash  			|
| SublimeTextTrans      | sublime text 3透明，仅限windows，可能更适合前端同学[^footer1]					|
| Theme - Nil	  		| 这个主题简单时尚，也找过一些其他的，但是还是这个用着最舒服						|
| GoSublime      		| golang 插件，有少许不足(第三方包不能转到定义)			      					|
{: rules="all"}

- 设置

```json
{
	"color_scheme": "Packages/User/SublimeLinter/Triplet (SL).tmTheme",
	"colored_folder_glyphs": true,
	"font_face": "Microsoft YaHei Mono",
	"font_options":
	[
		"directwrite"
	],
	"font_size": 11,
	"highlight_line": true,
	"highlight_modified_tabs": true,
	"ignored_packages":
	[
		"Vintage"
	],
	"mid_line_tabs": true,
	"sidebar_folders": true,
	"theme": "Nil.sublime-theme",
	"update_check": false,
	"word_wrap": "auto"
}
```

- 修改sublime text插件路径  
  sublime text插件安装的路径一般在 `%appdata%/sublime text 3` 文件夹下，里面有个Data文件夹（大写），里面是安装的插件，但是这有个问题，就是我们如果重装系统或者换了新的电脑，每次都要重新安装sublime text以及那些插件，而且很多设置也要重新来过。

  我们可以修改这个插件路径，先关闭st，在我的电脑输入路径 `%appdata%`。删除sublime text文件夹，然后在
  sublime text的安装路径下建立一个名为Data的文件夹。重新打开st就OK了。

- 修改sublime project设置 (有两种方式修改project设置)
  1. 在*.sublime-project文件中，你可以定义工程配置。例如你可以定义多个目录路径，或者哪些目录或文件需要排除在外。
  2. 打开菜单栏：Project --> Edit Project

`folder_exclude_patterns` 表示从项目中排除哪些文件夹  
`file_exclude_patterns`   表示从项目中排除哪些文件  

```json
  {
    "folders":
    [
        {
            "path": "wwwroot",
            "folder_exclude_patterns": ["images"]
        },
        {
            "path": "c:\wwwroot\project1\assets",
            "name": "Project 1",
            "file_exclude_patterns": ["*.php"]
        }
    ],
    "settings":
    {
        "tab_size": 8
    }
 }
```

#### Visual studio 2015

目前比较少用vs，除了必装的小番茄助手（Visual Assist X ）之外，Indent Guides这个插件也还不错。

另外，从vs2015开始，也有跟sublime text一样的minimap，对于很长代码的预览还是非常不错的。


### 2、windows 

windows下面有很多非常好用的小软件，下面是我收集的一些方便实用的小众软件，对工作非常有帮助。

- Launchy：
 非常好用的快速启动工具，有了它你的桌面再也不用放快捷方式了，同类的软件有 ALTRun，但是在win10上好像有点问题。
 Launchy 有一款非常好看的皮肤，可以去Launchy的皮肤网站上搜索，[Discovery](http://www.deviantart.com/browse/all/customization/skins/applaunchers/launchy/?q=Discovery)。

- Everything：
  简直不要太好用，查找文件非常方便，类似的软件**Listary**（查找文件夹比较方便，功能更多），但是我更喜欢Everything，它已经满足了我的需求。

- git截图工具：
  有时候，你需要截一些gif动态图，有两个非常好用的gif截图工具，几百K大小，GifCam 和 LICEcap。

- cmder & git bash：
  windows自带的cmd丑得不要不要的，也不太方便，cmder算是一个很好的替代品，但是我更推荐git bash，安装git for windows后，
  会连带安装git bash，很多命令和linux兼容，也非常好用。推荐 git bash。

- notepad++：
  这个就更不用说了，非常好用的编辑器，但是已经有了sublime text了，所以把他作为辅助编辑器还是很不错的，比如用它来做文件查找、
  json 格式化等等。

- clover：
  多标签管理器，也是非常方便，目前已支持win10（居然也学坏了，第一次启动有广告）。

- Shadowsocks：
  这个你懂得，程序员需要自带梯子。

### 3、linux

  对于linux，经常用的当时是linux命令了 - -
  除了要熟悉一些常用的linux命令，还有有几个不错的linux 软件可以折腾下。  
  linux下这些配置，以后整理之后放到github上，方便以后使用。

- vim：
  vim的折腾主要是vim的配置文件和vim插件了，关于vim，我之前有篇文章已经做了比较详细的介绍，[传送门](http://domicat.me/vim-config-and-plugin/)。 

- zsh：
  zsh 兼容 bash，但是比bash更好用，zsh有个非常有名的配置：oh-my-zsh，安装简单，傻瓜式。

- tmux：
  非常非常推荐，屏幕切分简直方便，终于不用再多个SucureCRT标签页下切来切去，看log不废眼。

- asciiflow2：
 算不上一个linux工具，但是可以非常快速架设到自己的linux服务器上，可以方便自己画一些比较简单极客的流程图之类的。
 [github地址](https://github.com/lewish/asciiflow2)



>脚注

[^footer1]: 该插件需要自己去github拉取，[github 地址](https://github.com/vhanla/SublimeTextTrans.git)。