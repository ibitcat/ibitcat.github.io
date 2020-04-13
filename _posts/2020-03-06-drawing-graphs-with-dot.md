---
layout: post
title: 【翻译】使用dot绘图
date: 2020-03-06 19:50:00 +0800
tag: [翻译]

---

## 0、摘要

**dot**可以以层次结构的方式画有向图。它可以运行在命令行程序、web可视服务、兼容的图形界面。
它的功能包括：

用于放置节点和边样条线的布局优化算法、边标签、带有用于绘制数据结构的“端口”的“记录”(`record`或者`Mrecord`)形状、群集布局以及用于面向流的图形工具的底层文件语言。

下面是SML-NJ的简化模块依赖关系图。在1.4 Ghz AMD Athlon 编译耗时0.98秒。


![SML-NJ简化模块依赖关系图](/assets/image/posts/2020-03-06-01.png)
*<center>SML-NJ简化模块依赖关系图</center>*


## 1、基本图形绘制

&emsp;&emsp;**dot** 可以绘制有向图。它读取属性图文本文件，写入图形，并作为图形文件或以图形格式（如GIF、PNG、SVG或PostScript）显示（可转换为PDF格式）。
dot分为四个阶段来绘制图形。了解这一点，有助于你理解 dot 的布局类型，以及如何控制它们。

dot使用的布局过程依赖于非循环的图形：

1. 第一步是通过反转某些循环边的内部方向来打断输入图中出现的任何循环;
2. 第二步将节点分配给离散的列组（ranks）或层次（levels）。在自上而下的图形中，列组（rank）确定Y坐标，跨越多个列组的边被分解为“虚拟”节点链和单位长度边;
3. 第三步要求列组内的节点避免交叉;
4. 第四步设置节点的X坐标以保持边较短，最后一步路由这些边样条线。

这与基于 **Warfield[War77]**、**Carpano[Car80]** 和 **Sugiyama[STT81]** 的大多数层次图绘制程序的一般方法相同。读者可参考 **[GKNV93]** 来彻底理解 dot 的算法。

&emsp;&emsp;`dot`接受DOT语言的输入（参见附录A），这种语言描述三种对象：**图**、**节点**和**边**。
主图（main graph）(最外层)可以是有向图或者无向图，因为 dot 可以进行有向图的布局，所以，以下的所有例子都是使用有向图`digraph`。在 main graph 中，`subgraph` 定义了节点和边的子集。

&emsp;&emsp;示例1是 `DOT` 语言的一个示例图。第1行指定了图的名字和类型，后面的几行则创建节点、边或子图，并设置属性。
所有这些对象的名称可以是C标识符、数字或带引号的C字符串。引号则用来保护标点符号和空格。

```markup
digraph G {
	main -> parse -> execute;
	main -> init;
	main -> cleanup;
	execute -> make_string;
	execute -> printf
	init -> make_string;
	main -> printf;
	execute -> compare;
}
```
<p align="center"><em>示例 1：简单的有向图</em></p>

&emsp;&emsp;当节点的名称首次出现在文件中时，将创建该节点。当节点由边运算符 `->` 连接时，将创建边。
在本例中，第2行使边从 `main` 到 `parse`，从 `parse` 到 `execute`。运行下面的命令（文件名为 graph1.dot）将会生成出图1的图形。

&emsp;&emsp;`$ dot -Tps graph1.dot -o graph1.ps`

命令行选项 `-Tps` 选择 PostScript（EPSF）输出。*graph1.ps* 可以打印、可以由 PostScript 查看器显示，或者也可以嵌入到另一个文档中。
![Drawing of small graph](/assets/image/posts/2020-03-06-02.png?style=centerme)
*<center>图 1：简单有向图</center>*

&emsp;&emsp;通常可以通过设置输入文件中节点、边或子图的属性来调整图形布局中节点和边的表现方式或位置。
属性是字符串的键值对（name-value）。示例2和图2展示了一些布局属性。

```markup
digraph G {
	size ="7,4";
	main [shape=box]; /* 这里是注释 */
	main -> parse [weight=8];
	parse -> execute;
	main -> init [style=dotted];
	main -> cleanup;
	execute -> { make_string; printf}
	init -> make_string;
	edge [color=red]; // so is this
	main -> printf [style=bold,label="100 times"];
	make_string [label="make a\nstring"];
	node [shape=box,style=filled,color=".7 .3 1.0"];
	execute -> compare;
}
```
*<center>示例 2：稍复杂的有向图</center>*

在示例2中：
- 第2行将图形的大小设置为4,4（英寸），此属性 *size* 控制图形的大小；如果图形太大，则根据需要对其进行适当的缩放。节点或边属性在方括号中设置。
- 第3行中，节点 *main* 的形状设置为 *box*。
- 第4行中，通过增加边的 *weight* 值（默认值为1）来对其进行拉直。
- 第6行的边被画成虚线。
- 第8行从 *execute* 分别生成一条连接到 *string* 和 *printf* 的边。
- 第10行中，默认边颜色设置为红色 *red*。它会影响文件中此后创建的任何边。
- 第11行生成一个标记为 *100 times* 的粗体边。
- 第12行中，节点 *make_string* 被赋予一个多行标签。
- 第13行将默认节点更改为一个填充蓝色阴影的方框。节点 *compare* 继承这些属性值（此后的节点都继承该节点属性）。

![Drawing of fancy graphh](/assets/image/posts/2020-03-06-03.png?style=centerme)
*<center>图 2：稍复杂的有向图</center>*


## 2、绘图属性

表1、2和3总结了影响图形绘制的完整属性列表。

### 2.1 节点形状

&emsp;&emsp;默认情况下，使用 `shape=ellipse, width=.75, height=.5` （椭圆）绘制节点，并使用节点名来标记节点。
其他通用的形状包括： *box*(方框)、 *circle*(圆形)、*record*(记录) 和 *plaintext*（纯文本）。附录E中给出了节点形状的完整列表。
纯文本的节点是没有任何轮廓的，是某些图表中的一个重要约定。在主要关注图形结构的情况下，尤其是在图形适度大的情况下， *point*（点）形状会缩小节点以显示最少的内容。
绘制时，节点的实际大小是请求的大小和文本标签所需区域的较大值（也就是说***节点大小=max(size属性, 文本标签所需大小)***），
除非设置属性 `fixedsize=true`，在这种情况下，将强制执行宽度和高度值。

节点形状分为两大类: **基于多边形** 和 **基于记录**[^footer1]。

&emsp;&emsp;除 *record* 和 *Mrecord* 之外的所有节点形状都被视为多边形，并根据边数（椭圆和圆是特殊情况）和其他一些几何特性进行建模。
其中一些属性可以在图中指定。如果`regular=true`，则节点被强制为 *regular*（*即把多边形节点强制设置为规则的多边形，例如：`sides=5,regular=true`,那么节点的形状会是一个正五边形*）。
- *peripheries* 属性设置节点绘制时的边界曲线数。例如，`peripheries=2` 表示双圆形。
- *orientation* 属性使多边形顺时针旋转（以度为单位）。

&emsp;&emsp;形状 *polygon* 包含了所有多边形参数，对于创建许多未预定义的形状非常有用。
除了上面提到的参数 *regular* 、 *peripheries* 和 *orientation* 之外，多边形还通过 *sides*（边数）、 *skew*（斜率）和 *distortion*（畸变）来参数化。
示例3和图3显示了各种这些多边形属性。
- *skew* 是一个浮点数（通常介于-1.0和1.0之间），通过从上到下倾斜形状来扭曲形状，正值将多边形的顶部向右移动。因此，斜线可以用来把一个方框变成一个平行四边形。
- *distortion* 将从上到下收缩多边形，负值将导致底部大于顶部。它可以使方框变成梯形。

```markup
digraph G {
	a -> b -> c;
	b -> d;
	a [shape=polygon,sides=5,peripheries=3,color=lightblue,style=filled];
	c [shape=polygon,sides=4,skew=.4,label="hello world"]
	d [shape=invtriangle];
	e [shape=polygon,sides=4,distortion=.7];
}
```
*<center>示例 3：多边形图形</center>*

![Drawing of polygonal node shapes](/assets/image/posts/2020-03-06-04.png?style=centerme)
*<center>图 3：多边形图形</center>*

&emsp;&emsp;另一类节点形状是基于记录的节点。其中包括形状 *record* 和 *Mrecord* 。两者是相同的，只是后者有圆角。
这些节点表示字段的递归列表，这些字段绘制成水平行和垂直行交替的方框。递归结构由节点的标签（`label`）确定，该标签具有以下描述：

```markup
rlabel → field ( ’|’ field )*
field → boxLabel | ’’ rlabel ’’
boxLabel → [ ’<’ string ’>’ ] [ string ]
```

&emsp;&emsp;大括号、竖杠和尖括号必须转义。空格是 *tokens* 的分隔符，因此，如果要在文本中按字面意思显示空格，必须对它们进行转义（eg.: `"hello\ world |test"`）。
*boxLabel* 中的第一个字符串为字段名，并用作方框的的端口名（参见第3.1节）。第二个字符串用作字段的标签；它可以包含与多行标签相同的转义序列（参见第2.2节）。
示例4和图4的例子说明了 records 的使用和它的一些相关属性。

```markup
digraph structs {
	node [shape=record];
	struct1 [shape=record,label="<f0> left|<f1> mid\ dle|<f2> right"];
	struct2 [shape=record,label="<f0> one|<f1> two"];
	struct3 [shape=record,label="hello\nworld |{ b |{c|<here> d|e}| f}| g | h"];
	struct1 -> struct2;
	struct1 -> struct3;
}
```
*<center>示例 4：带有嵌套字段的记录</center>*

![ Drawing of records](/assets/image/posts/2020-03-06-05.png?style=centerme)
*<center>图 4：带有嵌套字段的记录</center>*


[^footer1]: 有一种方法可以实现自定义节点形状，使用 `shape=epsf` 和 `shapefile` 属性，并依赖 PostScript 输出。详细信息超出了本用户指南的范围。有关详细信息，请与作者联系。


### 2.2 标签

&emsp;&emsp;如上所述，节点的默认标签是其名称。默认情况下，边是没有标签的。节点和边标签可以使用 *label* 属性显式设置，如图2所示。

&emsp;&emsp;尽管按节点名来标记节点也许很方便，但在某些时候，节点标签必须显式设置。
例如，在绘制文件目录树时，一个目录可能有多个名为 *src* 的目录，但每个目录都必须有唯一的节点标识符（inode）。
inode编号或完整路径名称可作为唯一标识符。然后，可以将其目录中的文件名作为对应节点的标签。

&emsp;&emsp;可以使用转义字符`\n`、`\l`、`\r` 换行，并居中对其、左对齐或右对齐，从而创建多行标签[^footer2]。
图和子图集群也可以有标签。默认情况下，图形（graph）标签显示在图形下方的中心位置。
- 设置`labelloc=t`使标签在图形上方居中。集群标签显示在左上角的封闭矩形内。
- 设置`labelloc=b`将标签移动到矩形的底部。
- 设置`labeljust=r`会将标签向右移动。

>PS: 可以结合 *labelloc* 和 *labeljust* 这两个属性，来设置图形（包括子图）的标签位置。

&emsp;&emsp;默认字体为黑色的14点Times Roman。可以使用属性 *fontname* 、*fontsize* 、*fontcolor* 选择其他字体、大小和颜色。
字体名称应与目标解释器兼容。最好只使用标准字体系列，例如：Times、Helvetica、Courier 或 Symbol，因为它们可以保证与任何目标图形语言一起使用。
例如，Times Italic、Times Bold 和 Courier 都是可移植的；而 AvanteGarde-DemiOblique 则不是。
对于位图输出，如GIF或JPG，dot 依赖于在布局期间使用这些字体。*fontpath* 属性可以指定应搜索字体文件的目录列表[^footer3]。
如果未设置，则dot将使用 *DOTFONTPATH* 环境变量，如果 *DOTFONTPATH* 也未设置，则使用 *GDFONTPATH* 环境变量。
如果这些都没有设置，dot 将使用内置列表。

&emsp;&emsp;边的标签位于它的中心附近。通常，注意防范边标签与其他边和节点重叠。
在一个复杂的图中，确定一个标签属于哪个边较为困难的。如果边的 *decorate* 属性设置为 true，则会绘制一条线，连接边与其标签。
因此，有时为了避免边标签和边之间的重叠、冲突，会迫使图形最终的大于设置的大小。
如果`labelfloat=true`，dot 就不会处理这些重叠冲突，从而使绘图更紧凑。
边还可以使用 *headlabel* 和 *taillabel* 指定附加标签，这些标签放置在边的首（箭头的那一端）、尾附近。
可以使用属性 *labelfontname*、*labelfontsize* 和 *labelfontcolor* 对其进行特殊设置。
这些标签会放在边和节点的交点附近，因此可能会干扰它们。若要调整图形，用户可以设置 *labelangle* 和 *labeldistance* 属性。
前者设置标签从边与节点的入射角旋转的角度（以度为单位）。后者设置乘法比例因子以调整标签与节点的距离。

>PS: *labelfontname*、*labelfontsize*和*labelfontcolor* 这三个属性只能对 *headlabel* 和 *headlabel* 生效，对 *label* 是不生效的。

[^footer2]: 转义序列 \N 是节点名称的内部符号.
[^footer3]: 对于基于Unix的系统，这是路径名的串联列表，用冒号分隔。对于基于 Windows 的系统，路径名用分号分隔。

- 表1：节点属性

	| 属性				| 默认值					| 备注										|
	| :-----------------|-----------------------|:------------------------------------------|
	| color 			| black 				| 节点形状的颜色								|
	| comment 			| 						| 注释										|
	| distortion 		| 0.0					| 节点形状为polygon畸变（收缩）系数			|
	| fillcolor 		| lightgrey/black		| 节点填充颜色								|
	| fixedsize 		| false 				| 固定节点的大小，不受节点标签文本长度的影响	|
	| fontcolor 		| black					| 字体颜色									|
	| fontname 			| Times-Roman			| 字体名称									|
	| fontsize 			| 14					| 字体大小									|
	| group 			| 						| 节点所在分组								|
	| height 			| 0.5					| 节点高（英寸）								|
	| width 			| 0.75					| 节点宽（英寸）								|
	| label 			| node name				| 节点标签（默认是节点的名称）					|
	| layer 			| overlay range			| all, id or id:id							|
	| orientation 		| 0.0					| 节点旋转角度								|
	| peripheries 		| shape-dependent		| 节点包围圈的数量							|
	| regular 			| false					| 是否强制是节点形状为规则多边形				|
	| shape 			| ellipse				| 节点形状；参见2.1节和附录E					|
	| shapefile 		| 						| 外部EPSF或SVG自定义形状文件					|
	| sides 			| 4						| polygon形状节点的边数						|
	| skew 				| 0.0					| polygon形状节点的斜率						|
	| style 			| 						| 图形选项，例如：bold, dotted, filled; 参考2.3节|
	| URL 				| 						| 与节点关联的URL								|
	| z 				| 0.0					| VRML输出时的z坐标							|
	{: rules="all" frame="border"}

- 表2：边属性

	| 属性				| 默认值					| 备注										|
	| :-----------------|-----------------------|:------------------------------------------|
	| arrowhead			| normal				| 边头部的箭头样式							|
	| arrowsize			| 1.0					| 箭头大小系数								|
	| arrowtail			| normal				| 边尾部的箭头样式							|
	| color				| black					| 边的颜色，默认黑色							|
	| comment			|  						| 注释 										|
	| constraint		| true					| use edge to affect node ranking			|
	| decorate			| 						| 绘制一条线，将标签与其边连接起来				|
	| dir				| forward				| 箭头方向（forward, back, both, none）		|
	| fontcolor			| black					| 边标签字体的颜色							|
	| fontname			| Times-Roman			| 边标签字体的名字							|
	| fontsize			| 14					| 边标签字体的大小							|
	| headlabel			| 						| 边头部（有箭头）的附加标签					|
	| taillabel			| 						| 边尾部（无箭头）的附加标签					|
	| headport			|						| n,ne,e,se,s,sw,w,nw						|
	| tailport 			|						| n,ne,e,se,s,sw,w,nw						|
	| headURL			| 						| 如果输出格式为ismap，则将URL附加到头部标签上	|
	| tailURL			|						| 如果输出格式为ismap，则将URL附加到尾部标签上	|
	| label 			| 						| 边的标签									|
	| labelangle 		| -25.0 				| 头部或尾部标签偏离边的角度（度为单位）		|
	| labeldistance		| 1.0 					| 头部或尾部标签与节点之间距离的比例系数		|
	| labelfloat		| false					| 减少边标签放置的约束（是图形更紧凑）			|
	| labelfontcolor 	| black					| 首尾附加标签的字体颜色						|
	| labelfontname		| Times-Roman			| 首尾附加标签的字体名称						|
	| labelfontsize		| 14					| 首尾附加标签的字体大小						|
	| layer				| overlay range			| all, id or id:id							|
	| lhead				| 						| 边头部指向到cluster							|
	| ltail				| 						| 边尾部从cluster出发							|
	| minlen			| 1						| 首尾最小距离								|
	| samehead			| 						| 头部节点的标记；具有相同标记的边的头部会指向节点同一端口上|
	| sametail 			| 						| 尾部节点的标记；具有相同标记的边的尾部会从节点同一端口发出|
	| style 			|						| 图形选项,例如. bold, dotted, filled; 参见：2.3节|
	| weight			| 1						| 边的拉伸权重（越大则节点与边越垂直）			|
	{: rules="all" frame="border"}


- 表3：图属性

	| 属性				| 默认值					| 备注										|
	| :-----------------|-----------------------|:------------------------------------------|
	| bgcolor			|						| 图形背景颜色，同时也是初始填充颜色			|
	| center			| false 				| 在 *page* 中心绘图							|
	| clusterrank		| local					| 可以是 *global* 或 *none* 					|
	| color				| black					| 对于clusters,如果 *fillcolor* 没有定义，则表示轮廓颜色和填充颜色|
	| comment			| 						| 注释										|
	| compound			| false					| 把cluster作为整体包起来，可以允许边与cluster相连|
	| concentrate 		| false					| 启动边集中器								|
	| fillcolor			| black					| cluster填充颜色							|
	| fontcolor			| black					| 图形标签的字体颜色							|
	| fontname			| Times-Roman			| 图形标签的字体名称							|
	| fontsize			| 14					| 图形标签的字体大小							|
	| fontpath			| 						| 搜索字体的目录列表							|
	| label 			| 						| 图形的标签									|
	| labeljust			| centered 				| ”l” and ”r” 分别表示左对齐和右对齐标签		|
	| labelloc 			| top 					| ”t” and ”b” 分别表示上对齐和下对齐标签		|
	| layers			| 						| id:id:id... 								|
	| margin			| .5 					| 在 *page* 中的页边距（英寸）				|
	| mclimit 			| 1.0 					| scale factor for mincross iterations
	| nodesep			| .25 					| separation between nodes, in inches.
	| nslimit			| 						| if set to f, bounds network simplex iterations by (f)(number of nodes) when setting x-coordinates
	| nslimit1 			| 						| if set to f, bounds network simplex iterations by (f)(number of nodes) when ranking nodes
	| ordering			| 						| if out out edge order is preserved
	| orientation		| portrait				| if rotate is not used and the value is landscape, use landscape orientation
	| page				| 						| unit of pagination, e.g. "8.5,11"
	| pagedir			| BL					| traversal order of pages
	| quantum			| 						| if quantum ¿ 0.0, node label dimensions will be rounded to integral multiples of quantum
	| rank				| 						| 可以设置为：same, min, max, source 或者 sink|
	| rankdir			| TB					| LR (从左到右) 或者 TB (从上到下)			|
	| ranksep			| .75 					| separation between ranks, in inches.
	| ratio				| 						| approximate aspect ratio desired, fill or auto
	| remincross		|						| if true and there are multiple clusters, re-run crossing minimization
	| rotate			| 						| If 90, set orientation to landscape
	| samplepoints		| 8 					| number of points used to represent ellipses and circles on output cf. Appendix C
	| searchsize		| 30					| maximum edges with negative cut values to check when looking for a minimum one during network simplex
	| size				| 						| 最大绘图尺寸（英寸）						|
	| style 			| 						| 图形选项, 例如： 子图集群的 *filled* 属性	|
	| URL				|						| 与图形关联的URL 							|
	{: rules="all" frame="border"}

### 2.3 图形样式

&emsp;&emsp;节点和边可以指定 *color* 属性, 用于绘制节点或边的颜色，默认为黑色。
颜色值可以是饱和度-亮度三元组（0到1之间的三个浮点数，用逗号分隔），附录G中列出的颜色名称之一（参考某个版本的X窗口系统）；
或者是红-绿-蓝（RGB）三元组[^footer4]（00到FF之间的三个十六进制数，前面加上字符“#”）。
因此， `orchid`, `0.8396,0.4862,0.8549` 和 `#DA70D6` 是同一种颜色的三种不同表示方法。
其中，数字形式的表示法更适用于自动生成颜色的脚本或工具。颜色名称**不区分大小写**，并且会忽略非字母数字字符，因此 *warmgrey* 和 *Warm_Grey* 是等效的。


&emsp;&emsp;我们可以提供一些在图形绘图中使用颜色的提示：
- 首先，避免使用太多鲜艳的颜色。“彩虹效应”会令人困惑。所以最好选择较窄的颜色范围，或者改变饱和度以及色相。
- 其次，当节点用深色或非常饱和的颜色填充时，`fontcolor=white` 和 `fontname=Helvetica` 的标签看起来会更容易阅读（我们还为 dot 提供了 PostScript 函数，可以从普通字体创建轮廓字体）。
- 最后，在某些输出格式中，可以定义自己的颜色空间。例如，如果使用 PostScript 进行输出，则可以在库文件中重新定义 *nodecolor*、*edgecolor* 或 *graphcolor*。因此，要使用 RGB 颜色，请将以下行放在文件 *lib.ps* 中。

&emsp;&emsp;`/nodecolor {setrgbcolor} bind def`

使用 `-l` 命令行选项加载此文件。

&emsp;&emsp;`dot -Tps -l lib.ps file.dot -o file.ps`

&emsp;&emsp;***style*** 属性控制节点和边的其他图形特征。此属性是用逗号分隔的、带有可选参数列表的原语列表。
预定义的原语包括：*solid*, *dashed*, *dotted*, *bold* 和 *invis* 。前四个控制节点框与边的绘制，意思代表实线、虚线、点线、粗线。
而invis会让节点或边留空而不绘制。

节点的 style 包括：*filled*, *diagonals* 和 *rounded*。

- *filled* 会使用 *fillcolor* 指定的颜色对节点内部进行阴影填充。如果 *fillcolor* 未设置，则使用 *color* 属性的值。如果 *color* 属性也未设置，则使用浅灰色作为默认值[^footer5]。
- *diagonals* 样式会在节点顶点的两边之间绘制一条短对角线。
- *rounded* 样式会使多边形的角变为圆角。

&emsp;&emsp;用户定义的样式原语可以实现为自定义 PostScript 过程。在其他标签绘制前，这些原语在图、节点或边的 gsave 上下文中执行。
参数列表将转换为 PostScript 语法。 例如，使用 `style="setlinewidth(8)"` 绘制带有粗轮廓的节点。
在这里，*setlinewidth* 是 PostScript 内置的，用户定义的 PostScript 过程也是这样调用的。
这些过程的定义可以在使用 `-l` 加载的库文件中给出，如上图所示。

&emsp;&emsp;边的 *dir* 属性可以设置箭头。*dir* 可以是 *forward*（默认）、*back*、*both* 或 *none*。
这里仅指绘制箭头的位置，不会更改箭头的基础图形。例如，设置 `dir=back` 会在线的尾部绘制箭头，而在线头部则不绘制箭头，但不会改变边的端点。

&emsp;&emsp;属性 *arrowhead* 和 *arrowtail* 分别指定边的首尾箭头的样式（如果有的话）。
允许的值为 *normal*、*inv*、*dot*、*invdot*、*odot*、*invodot* 和 *none*（参见附录F）。
属性arrowsize指定一个乘法因子，该因子影响绘制在边上的所有箭头的大小。例如，arrowsize=2.0使箭头的长度增加一倍，宽度增加一倍。
(如果 `dir=both`，则边的头尾两个箭头都会放大2倍。)

&emsp;&emsp;在样式和颜色方面，clusters 的行为有点像大型长方体节点，因为它的边界是使用其 *color* 属性绘制的，且通常，它的外观会受 *style*、*color* 和 *fillcolor* 属性的影响。
如果主图形指定了 *bgcolor* 属性，则此颜色将用作整个图形的背景，也将用作默认填充颜色。

[^footer4]: 还支持第四种形式RGB A，它与RGB具有相同的格式，并具有额外的第4个十六进制数，用于指定alpha通道或透明度信息。
[^footer5]: 如果输出格式为MIF或形状为“point”，则默认为黑色。

### 2.4 绘图方向，大小和间距

&emsp;&emsp;在确定 *dot* 图大小时，有两个比较重要的属性：***nodesep*** 和 ***ranksep***。
第一个属性指定在同一层级上两个相邻节点之间的最小距离（以英寸为单位）。
第二个属性指定层级间距，即一个层级中节点的底部与下一层级中节点的顶部之间的最小垂直距离（以英寸为单位）。
或者可以设置为 `ranksep=equally`，那么所有相邻的层级都是等间距的。由于 *ranksep* 的两种用法是相互独立的，因此两者可以同时设置。
例如，`ranksep="1.0 equally"` 表示所有相邻层间距都相等，且间距为1英寸。

&emsp;&emsp;通常，使用默认节点大小和分隔符绘制的图形对于打印机或文档中的图形所允许的空间来说太大。有几种方法试图解决这个问题。
首先，我们回顾下dot如何计算最终布局大小。

&emsp;&emsp;布局最初是在使用默认设置的“自然”大小的内部创建的（除非设置了 `ratio=compress`，如下所述），图形的大小或纵横比没有限制，因此如果图形很大，布局也很大。
如果不指定 *size* 或 *ratio*，则打印自然大小布局。控制图形输出大小的最简单方法是在图形文件中设置 `size="x,y"`（或在命令行中使用 *-G*）。这决定了最终布局的大小。
例如，无论初始布局有多大， `size="7.5,10"` 都适合 8.5x11 页面（假定竖屏为默认排版方向）。

*ratio* 也会影响布局大小。根据 *size* 和 *ratio* 的设置，有许多情况。

- 情况1：未设置 *ratio*。如果图已经符合给定的尺寸，那么不需要做其他操作。否则，图会均匀缩小，以使其适应临界尺寸。

如果设置了 *ratio*，则又会有4种子情况：

- 情况2-1：如果 *ratio=x*，其中 x 是浮点数，则在一个维度中放大图形，以达到所需的比率（图形高度/宽度）。例如，`ratio=2.0` 使图形的高度是宽度的两倍。然后使用 *size* 缩放布局，如情况1所示。
- 情况2-2：如果设置了 `ratio=fill` 和 `size=x,y`，则在一个维度上缩放图形以达到比率 *y/x*。然后按情况1执行缩放，最终的效果是把图形填充在 *size* 给定的大小的边界框内。
- 情况2-3：如果设置了 `ratio=compress` 和 `size=x,y`，则压缩初始布局以尝试将图形适配到给定的边界框中。这样就会在布局质量、平衡性和对称性之间进行权衡，以使布局更加紧凑。然后按情况1执行缩放。
- 情况2-4：如果 `ratio=auto` 并且设置了 *page* 属性，并且图形无法在单个页面上绘制，那么 *size* 将被忽略，*dot* 将计算一个“理想”大小。特别是，给定维度中的大小将是该维度中页面大小的最小整数倍，至少是当前大小的一半。然后，这两个维度将独立缩放到新的大小。


&emsp;&emsp;如果设置了 `rotate=90` 或 `orientation=landscape`，则图形将旋转 **90°** 进入 *landscape* 模式。
此时，图形布局的X轴将沿着画布的Y轴， 但是，这不影响 *dot* 对大小、比率或页面的解释。此时若 *page* 属性未设置，则最终布局将生成为一页。

&emsp;&emsp;如果设置了 `page=x,y`，则布局将打印为一系列可以平铺或组装成马赛克的页面，常用设置为 `page="8.5,11"` 或 `page="11,17"`。
这些值是指物理设备的完整大小；实际使用的区域将会因为设置了边距而减少。（对于打印机输出，边距默认值为0.5英寸；对于位图输出，X 和 Y 页边距分别为10点和2点。）
对于平铺式布局，设置较小的边距可能会更好，可以通过 *margin* 属性来设置边距，可以使用一个数字（x和y的边距相同），或者两个用逗号分隔的数字来分别这是x和y边距，单位都是英寸。
虽然可以讲 *margin* 设置为0，但是许多位图打印机都有一个无法覆盖的内部边距硬件。

&emsp;&emsp;页面的打印属性由 *pagedir* 属性控制，输出始终基于行或基于列的顺序，*pagedir* 设置为两个字母的代码，分别指定主方向和次方向。
例如：默认值是 *BL*，指定了从下到上的主顺序和从左到右的次顺序。因此，页面将从最下面一行开始，从左到右，然后是第二行，从左到右，以此类推，直到最上面的一行。
从上到下的顺序用 *T* 表示，从右到左的顺序用 *R* 表示。

&emsp;&emsp;如果设置 `center=true` 且图形可以在一页上输出，并且 `page` 也未设置，则使用默认大小为 8.5 x 11 英寸的页面，并将图形在该页上居中。

&emsp;&emsp;还有一个常见的问题就是，以小尺寸绘制大图时会产生无法读取的节点标签，一页可容纳的可读文本数量是有限制的。
通常，在运行 *dot*  之前，你可以通过提取原始图形的关键部分来绘制较小的图形，有一些工具可以帮助解决这个问题。

- sccmap，将图形分解为若干强连接的组件
- tred，减少递归计算（删除传递性所隐含的边）
- gvpr，图形处理器，只选择节点或边，并收缩或移除图形的其余部分
- unflatten，通过错开叶子边长度来提高图形树的高宽比

考虑到这一点，可以在图尝试以下操作：

1. 增加节点字体大小。
2. 使用较小的 *ranksep* 和 *nodesep*。
3. 设置 `ratio=auto`。
4. 使用 `ratio = compress` 并设置合理的 *size*。
5. 在缩小后，无衬线字体（如Helvetica）的可读性可能 *Times* 字体强。

### 2.5 节点和边的放置

&emsp;&emsp;*dot* 中的属性提供了许多方法来调整节点和边的大规模布局，以及微调绘图以满足用户的需求和口味。本节讨论这些属性[^footer6]。

&emsp;&emsp;有时，使边的指向从左向右会比从上到下更为自然，如果在图形最顶层设置 `rankdir=LR` 后，则会旋转绘图。***TB*** （自上而下）是默认布局指向。
`rankdir=BT` 用于绘制从下往上的有向图，当然，也可以使用 `rankdir=RL`。

&emsp;&emsp;在带有时间线的图形中，或在强调源节点和宿节点的图形中，可能需要约束秩（***rank***）的分配。子图的 *rank* 可以设置为：*same*, *min*, *source*, *max* 或 *sink*。
值 *same* 会使子图中所有的节点在同一行上；如果设置为 *min*，子图中的所有节点都会保证在同一个秩上，至少与布局中的任何其他节点一样小[^footer7]。
如果设置为 *source*，可以强制子图中的节点在一定程度上，严格小于任何其他节点的秩（其他同样指定为 *min* 或 *source* 的子图节点除外）。
*max* 和 *sink* 对最大秩起类似作于（对应 *min* 和 *source*）。
如果一个子图强制节点A和B处于同一 rank，而另一个子图强制节点C和B共享一个 rank，则两个子图中的所有节点都必须绘制在同一 rank 上。
示例5和图5说明了使用子图来控制 *rank*。

&emsp;&emsp;在有些图中，从左到右的顺便很重要。如果子图没有设置 *ordering=out*， 那么子图中具有相同尾节点的外边则会按照创建顺序从左向右展开。
（还要注意，涉及头部节点的平边 *直边？* 可能会影响其顺序。）

&emsp;&emsp;有许多方法可以微调节点和边的布局。如果边的节点都具有相同的 *group* 属性，则 *dot* 会尝试使边保持笔直，并避免其他边与之交叉。
边的 *weight* 属性是另一种保持边缘笔直的方法，边的 *weight* 表示边缘的重要性，因此，权重越重，其节点之间的距离就越近。
*dot* 使具有较重重量的边被拉短和拉直。

&emsp;&emsp;当节点被约束在相同的秩时，边的权重也会有效果。
这些节点之间权重非零的边尽可能沿同一方向（在旋转的图形中从左到右或从上到下）跨 rank 排列。
可以利用这个特性，通过在需要的地方放置不可见边（`style="invi"`）来调整节点顺序。

&emsp;&emsp;使用 *samehead* 和 *sametail* 属性可以约束与同一节点相邻的边的端点。
具体来说，具有相同头部和相同 *samehead* 值的所有边都被约束为在同一点与头部节点相交（指向同一节点的边，且边的 *samehead* 值都一样，那么这些边都指向节点的同一位置）。
类似的属性适用于尾部节点和 *sametail* （从一个节点所发出的边，如果边的 *sametail* 都一样，则这些边的发出点都在该节点的同一个位置）。

&emsp;&emsp;在秩分配过程中，边的头节点（**箭头所指的节点**）被约束在比尾节点更高的秩上。但是，如果边设置了 `constraint=false`，则不强制执行此要求。
在某些情况下，用户可能希望边的两端点不要太近，可以通过设置边的 *minlen* 属性来解决，它定义了边首尾之间的最小差值。
例如，如果 `minlen=2`，则在头部和尾部之间始终至少有一个中间列。请注意，这与两个节点之间的几何距离无关。
（***类似跨越了一个中间秩，并不是边首尾断点的几何距离被扩大2倍。***）

&emsp;&emsp;微调须谨慎。当 *dot* 可以在不需要太多“帮助”或干扰单个节点和边的位置的情况下进行布局时，它的工作效果最好。
通过增加某些边的权重，或者使用 `style=invi` 创建不可见的边或节点，甚至通过重新排列文件中节点和边的顺序，来微调布局。
但这可能会适得其反，因为对布局的更改不一定是稳定的。一次调整可能会导致之前的所有的更改都无效，并生成非常糟糕的绘图。
我们未来的计划是将 dot 的数学布局技术与允许用户定义提示和约束的交互式前端结合起来。

```markup
digraph asde91 {
ranksep=.75;
//size = "7.5,7.5";
	{
		node [shape=plaintext, fontsize=16];

		/* the time-line graph */
		past -> 1978 -> 1980 -> 1982 -> 1983 -> 1985 -> 1986 ->
				1987 -> 1988 -> 1989 -> 1990 -> "future";

		/* ancestor programs */

		"Bourne sh"; "make"; "SCCS"; "yacc"; "cron"; "Reiser cpp";
		"Cshell"; "emacs"; "build"; "vi"; "<curses>"; "RCS"; "C*";
	}

	{ rank = same;
		"Software IS"; "Configuration Mgt"; "Architecture & Libraries";
		"Process";
	};

	node [shape=box];

	{ rank = same; "past"; "SCCS"; "make"; "Bourne sh"; "yacc"; "cron"; }
	{ rank = same; 1978; "Reiser cpp"; "Cshell"; }
	{ rank = same; 1980; "build"; "emacs"; "vi"; }
	{ rank = same; 1982; "RCS"; "<curses>"; "IMX"; "SYNED"; }
	{ rank = same; 1983; "ksh"; "IFS"; "TTU"; }
	{ rank = same; 1985; "nmake"; "Peggy"; }
	{ rank = same; 1986; "C*"; "ncpp"; "ksh-i"; "<curses-i>"; "PG2"; }
	{ rank = same; 1987; "Ansi cpp"; "nmake 2.0"; "3D File System"; "fdelta";
		"DAG"; "CSAS";}
	{ rank = same; 1988; "CIA"; "SBCS"; "ksh-88"; "PEGASUS/PML"; "PAX";
		"backtalk"; }
	{ rank = same; 1989; "CIA++"; "APP"; "SHIP"; "DataShare"; "ryacc";
		"Mosaic"; }
	{ rank = same; 1990; "libft"; "CoShell"; "DIA"; "IFS-i"; "kyacc"; "sfio";
		"yeast"; "ML-X"; "DOT";  }
	{ rank = same; "future"; "Adv. Software Technology"; }

	"PEGASUS/PML" -> "ML-X";
	"SCCS" -> "nmake";
	"SCCS" -> "3D File System";
	"SCCS" -> "RCS";
	"make" -> "nmake";
	"make" -> "build";
	"Bourne sh" -> "Cshell";
	"Bourne sh" -> "ksh";
	"Reiser cpp" -> "ncpp";
	"Cshell" -> "ksh";
	"build" -> "nmake 2.0";
	"emacs" -> "ksh";
	"vi" -> "ksh";
	"vi" -> "<curses>";
	"IFS" -> "<curses-i>";
	"IFS" -> "IFS-i";
	"IFS" -> "sfio";
	"<curses>" -> "<curses-i>";
	"<curses-i>" -> "fdelta";
	"RCS" -> "SBCS";
	"RCS" -> "fdelta";
	"ksh" -> "nmake";
	"ksh" -> "ksh-i";
	"ksh" -> "ksh-88";
	"ksh-i" -> "ksh-88";
	"nmake" -> "ksh";
	"nmake" -> "ncpp";
	"nmake" -> "3D File System";
	"nmake" -> "nmake 2.0";
	"ncpp" -> "Ansi cpp";
	"C*" -> "CSAS";
	"fdelta" -> "SBCS";
	"CSAS" -> "CIA";
	"ksh-88" -> "sfio";
	"ksh-88" -> "Configuration Mgt";
	"ksh-88" -> "Architecture & Libraries";
	"IFS-i" -> "Architecture & Libraries";
	"SYNED" -> "Peggy";
	"Peggy" -> "PEGASUS/PML";
	"Peggy" -> "ryacc";
	"PEGASUS/PML" -> "Architecture & Libraries";
	"yacc" -> "ryacc";
	"ryacc" -> "kyacc";
	"kyacc" -> "Architecture & Libraries";
	"ML-X" -> "Architecture & Libraries";
	"APP" -> "Software IS";
	"SBCS" -> "Configuration Mgt";
	"DAG" -> "Software IS";
	"DAG" -> "DOT";
	"CIA++" -> "Software IS";
	"Ansi cpp" -> "Configuration Mgt";
	"nmake 2.0" -> "Configuration Mgt";
	"3D File System" -> "Configuration Mgt";
	"CIA" -> "CIA++";
	"IMX" -> "TTU";
	"TTU" -> "PG2";
	"PG2" -> "backtalk";
	"backtalk" -> "DataShare";
	"DataShare" -> "Architecture & Libraries";
	"nmake 2.0" -> "CoShell";
	"CIA" -> "DIA";
	"APP" -> "DIA";
	"DAG" -> "DIA";
	"fdelta" -> "PAX";
	"PAX" -> "SHIP";
	"SHIP" -> "Configuration Mgt";
	"DIA" -> "Software IS";
	"DOT" -> "Software IS";
	"libft" -> "Software IS";
	"sfio" -> "Architecture & Libraries";
	"CoShell" -> "Configuration Mgt";
	"CoShell" -> "Architecture & Libraries";
	"Mosaic" -> "Process";
	"cron" -> "yeast";
	"yeast" -> "Process";
	"Software IS" -> "Adv. Software Technology";
	"Configuration Mgt" -> "Adv. Software Technology";
	"Architecture & Libraries" -> "Adv. Software Technology";
	"Process" -> "Adv. Software Technology";
}
```
*<center>示例 5：带约束等级的图</center>*

![Drawing with constrained ranks](/assets/image/posts/2020-03-06-06.png?style=centerme)
*<center>图 5：带约束等级(秩)的图</center>*



[^footer6]: 为了完整起见，dot 还提供了对影响布局算法的各种参数。其中包括 *mclimit*、*nslimit*、*nslimit1*、*remincross* 和 *searchsize*。
[^footer7]: 回想一下，最小秩都在图的顶部。


## 3、高级特性

### 3.1 节点端口
节点端口是边可以附着到节点的点。(当边未附加到节点的端口时，它将对准节点中心位置处的边界。)

可以使用 *headport* 和 *tailport* 属性指定简单端口。它们可以被指定为以下 8 个方位点 “n”、“ne”、“e”、“se”、“s”、“sw”、“w” 或 “nw” 中的一个。
（*n*，*s*，*e*，*w* 分别是 *North*，*South*，*East*，*West* 的缩写。）然后，节点的末端将对准节点上的该位置。
因此，如果 `tailport=se`，则边将连接到节点东南角处。

具有 "record" 形状的节点使用记录结构来定义阶段端口。这种形状的节点会将记录表示为框的递归列表。（说人话就是，record 的节点形状就是由一个个小方框组成的，像拼积木一样。）
可以通过在框标签中使用 `<port_name>` 的形式，给这个框定义一个端口名，该框的中心处用作端口点。（默认情况下，边会附着到框中心位置的边界上，并不会指到框的内部。）
然后，使用语法 `node_name:port_name` 作为边的声明的一部分来实现。示例 6 说明了在记录节点中端口名的声明和使用，结果如图 6 所示。

```markup
digraph g {
	splines=polyline;
	node [shape = record,height=.1];
	node0[label = "<f0> |<f1> G|<f2> "];
	node1[label = "<f0> |<f1> E|<f2> "];
	node2[label = "<f0> |<f1> B|<f2> "];
	node3[label = "<f0> |<f1> F|<f2> "];
	node4[label = "<f0> |<f1> R|<f2> "];
	node5[label = "<f0> |<f1> H|<f2> "];
	node6[label = "<f0> |<f1> Y|<f2> "];
	node7[label = "<f0> |<f1> A|<f2> "];
	node8[label = "<f0> |<f1> C|<f2> "];
	"node0":f2 -> "node4":f1;
	"node0":f0 -> "node1":f1;
	"node1":f0 -> "node2":f1;
	"node1":f2 -> "node3":f1;
	"node2":f2 -> "node8":f1;
	"node2":f0 -> "node7":f1;
	"node4":f2 -> "node6":f1;
	"node4":f0 -> "node5":f1;
}
```
*<center>示例 6：使用 records 的二叉搜索树</center>*

![ Drawing of binary search tree](/assets/image/posts/2020-03-06-07.png?style=centerme)
*<center>图 6：二叉搜索树</center>*

示例 7 和 图 7 展示了使用记录节点和端口的另一个例子。这里复用了 图4 的示例，但是这里使用了端口作为边的连接器。
注意，有时候为了让记录看起来更美观，可以设置记录的输入高度为一个较小的值，这样文本标签就会控制记录的实际大小，如 图 6 所示。
否则，节点将使用默认大小（0.75 * 0.5），如图 7 所示。示例 8 和图 8 以从左到右的布局展示了哈希表的结构。

```markup
digraph structs {
	splines=polyline;
	node [shape=record];
	struct1 [shape=record,label="<f0> left|<f1> middle|<f2> right"];
	struct2 [shape=record,label="<f0> one|<f1> two"];
	struct3 [shape=record,label="hello\nworld |{ b |{c|<here> d|e}| f}| g | h"];
	struct1:f1 -> struct2:f0;
	struct1:f2 -> struct3:here;
}
```
*<center>示例 7：带嵌套字段的记录</center>*

![Drawing of records](/assets/image/posts/2020-03-06-08.png?style=centerme)
*<center>图 7：带嵌套字段的记录</center>*

```markup
digraph G {
	splines=polyline;
	nodesep=.05;
	rankdir=LR;
	node [shape=record,width=.1,height=.1];

	node0 [label = "<f0> |<f1> |<f2> |<f3> |<f4> |<f5> |<f6> | ",height=2.5];
	node [width = 1.5];
	node1 [label = "{<n> n14 | 719 |<p> }"];
	node2 [label = "{<n> a1 | 805 |<p> }"];
	node3 [label = "{<n> i9 | 718 |<p> }"];
	node4 [label = "{<n> e5 | 989 |<p> }"];
	node5 [label = "{<n> t20 | 959 |<p> }"] ;
	node6 [label = "{<n> o15 | 794 |<p> }"] ;
	node7 [label = "{<n> s19 | 659 |<p> }"] ;
	node0:f0 -> node1:n;
	node0:f1 -> node2:n;
	node0:f2 -> node3:n;
	node0:f5 -> node4:n;
	node0:f6 -> node5:n;
	node2:p -> node6:n;
	node4:p -> node7:n;
}
```
*<center>示例 8：哈希表结构</center>*

![Hash table graph file](/assets/image/posts/2020-03-06-09.png?style=centerme)
*<center>图 8：哈希表结构</center>*

### 3.2 集群

集群是一个放置在其特有的矩形布局中的子图，当子图的名称是以前缀 `cluster` 命名时，这个子图就表示一个集群。（如果顶层的图设置了 `clusterrank=none`，则关闭此特殊处理）。
可以像对顶级图形那样，设置集群的标签、字体特征相关和 labelloc 属性，默认情况下，集群标签显示在集群子图形的上方。
对于集群，默认情况下标签左对齐；如果 `labeljust="r"`，则标签右对齐。color 属性指定集群矩形边框的颜色。
此外，集群若设置了 `style="filled"`，在这种情况下，在绘制集群之前，集群的矩形边框内将填充成属性 *fillcolor* 所指定的颜色。
（如果未指定 *fillcolor*，则使用群集的 *color* 属性。）

集群是通过递归技术绘制的，该技术计算集群内节点的等级分配和内部排序。示例 9 和图 9 是 *cluster* 布局和相应的图形。

```markup
digraph G {
	subgraph cluster0 {
	node [style=filled,color=white];
	style=filled;
	color=lightgrey;
	a0 -> a1 -> a2 -> a3;
	label = "process #1";
	}
	subgraph cluster1 {
	node [style=filled];
	b0 -> b1 -> b2 -> b3;
	label = "process #2";
	color=blue
	}
	start -> a0;
	start -> b0;
	a1 -> b3;
	b2 -> a3;
	a3 -> a0;
	a3 -> end;
	b3 -> end;
	start [shape=Mdiamond];
	end [shape=Msquare];
}
```
*<center>示例 9：集群图</center>*

![Process diagram with clusters](/assets/image/posts/2020-03-06-10.png?style=centerme)
*<center>图 9：集群图</center>*

如果顶层图的 *compound* 属性设置为 *true*，则 dot 将允许边连接节点和集群（即把集群看作一个“特殊的节点”）。
这是通过定义边的 *lhead* 或 *ltail* 属性来实现的，当集群作为头节点或尾节点时，这些属性的值必须集群的名称,。
在这种情况下，连接的边会在集群的边界处被剪裁（也就是边只能连接到集群的边框上）。
所有边的其他属性（如箭头 *arrowhead* 或方向 *dir*）都将应用于被裁剪的边。
例如，图 10 显示了一个使用 *compound* 属性的集群图。

```markup
digraph G {
	compound=true;
	subgraph cluster0 {
	a -> b;
	a -> c;
	b -> d;
	c -> d;
	}
	subgraph cluster1 {
	e -> g;
	e -> f;
	}
	b -> f [lhead=cluster1];
	d -> e;
	c -> g [ltail=cluster0,
	lhead=cluster1];
	c -> e [ltail=cluster0];
	d -> h;
}
```

![Graph with edges on clusters](/assets/image/posts/2020-03-06-11.png?style=centerme)
*<center>图 10：集群上有边的图</center>*

### 3.3 集中器

在顶层图形上设置 `concentrate=true` 可以启用边合并技术，以减少密集布局中的混乱情况。
边在并行出发、具有公共尾端点且长度大于1时合并。在固定大小的布局中，这样做有一个好处，可以移除部分边，从而让边变迁更大、更易读。
虽然 dot 中的集中器看起来有点像 Newbery 的 [New89]，但它们是通过搜索布局中的边来找到的要合并的边，
而不是通过检测底层图中的完整二分图（或称完全偶图）来找到的。因此，dot 的方法会运行得更快，且不会像 Newbery 算法那样折叠太多的边。

> 可以通过下面的例子来理解集中器的作用。

```markup
digraph G {
	splines=polyline;
	concentrate=true;

	a;
	b;
	c;
	d;
	a->d[minlen=2];
	b->d[minlen=2];
	c->d[minlen=2];
}
```
![Concentrators](/assets/image/posts/2020-03-06-12.png?style=centerme)
*<center>图 11：使用集中器的图</center>*

## 4、命令行选项

默认情况下，dot 在过滤模式下运行，从标准输入 stdin 读取图形，并以附加了布局属性的 DOT 格式将图形写入stdout。dot 支持多种命令行选项：

- `-T` *format*，图形输出格式。格式的允许值为:
	- canon
	- dot
	- fig
	- gif
	- ...
- `-G` *name=value*，键值对的形式，用来设置缺省的图形属性。一般是设置大小、分页等参数（比在输入文件中设置更方便）。类似的选项 -N 和 -E 用于设置结点和边的缺省属性。不过注意，文件内容可以重载命令行参数。
- `-l` *libfile*，指定与设备相关的图形库文件。可以提供多个库。这些名称在输出开始时传递给代码生成器。
- `-o` *outfile*，指定输出的文件名
- `-v` 打印详细输出信息。在处理大型布局时，会给出 dot 处理进度的一些评估信息。
- `-V` 打印版本号


## 5、其他
在顶层图的标题中，图可以声明为 `strict digraph` (严格有向图)。这样就禁止图形创建自引用(self-arcs)和多条边缘(multi-edges)；它们在输入文件中被忽略。
这是什么意思呢？看下面两个例子就知道区别了。

```markup
digraph G {
	a->b;
	a->b;
	b->a[color=blue];
}
```
![digraph](/assets/image/posts/2020-03-06-13.png?style=centerme)
*<center>图 12：非严格有向图</center>*


```markup
strict digraph G {
	a->b;
	a->b;
	b->a[color=blue];
}
```
![digraph](/assets/image/posts/2020-03-06-14.png?style=centerme)
*<center>图 13：严格有向图</center>*

也就是说，如果加了 *strict* 修饰后，在有向情况下，在给定的尾节点和头节点之间**最多只能有一条边**。

结点、边缘、图形可以有 *URL* 属性。在某些输出格式（ps2、imap、ismap、cmap 或 svg）中，这些信息被集成到输出中，
以便在使用适当的工具显示时，节点、边缘和集群能变成活动链接（可以点击并跳转到设置的链接处）。
通常，顶级图的 URLs 充当基础 URLs，以便支持组件的相对 URLs。当输出格式为 imap 或 cmap 时，类似的处理过程会被替换成 *headURL* 和 *tailURL* 属性。

对于某些格式（ps、fig、mif、mp、vtx或svg），可以使用 *comment* 属性在输出中嵌入人类可读的符号。

## 6、结论

dot 生成令人满意的层次结构图，可以在许多设置中应用。
由于 dot 的基本算法工作良好，为进一步研究大型图形的绘制方法和在线（动画）图形绘制等问题奠定了良好的基础。

## 7、致谢

致谢部分，暂时未翻译。详情请查询原文件 @page32。

## 8、参考

参考部分，暂时未翻译。详情请查询原文件 @page33。

## 9、附录

- 附录A：图形文件语法，@page34
- 附录B：Plain Output File Format (-Tplain)，@page35
- 附录C：Attributed DOT Format (-Tdot)，@page36
- 附录D：层（Layers），@page37
- 附录E：节点形状，@page38
- 附录F：箭头形状，@page39
- 附录G：颜色名称，@page40

<hr>