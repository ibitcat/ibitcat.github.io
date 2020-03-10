---
layout: post
title: 【翻译】使用dot绘图
date: 2020-03-06 19:50:00 +0800
excerpt: "dotguide pdf 翻译"
tag: [翻译]
comments: true

---


## 0、摘要

**dot**可以以层次结构的方式画有向图。它可以运行在命令行程序、web可视服务、兼容的图形界面。
它的功能包括：

用于放置节点和边样条线的布局优化算法、边标签、带有用于绘制数据结构的“端口”的“记录”(`record`或者`Mrecord`)形状、群集布局以及用于面向流的图形工具的底层文件语言。

下面是SML-NJ的简化模块依赖关系图。在1.4 Ghz AMD Athlon 编译耗时0.98秒。


![SML-NJ简化模块依赖关系图](/images/posts/dot/simple.png)
*SML-NJ简化模块依赖关系图*

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

- **示例1**： *简单的有向图*
```
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

&emsp;&emsp;当节点的名称首次出现在文件中时，将创建该节点。当节点由边运算符 `->` 连接时，将创建边。
在本例中，第2行使边从 `main` 到 `parse`，从 `parse` 到 `execute`。运行下面的命令（文件名为 graph1.dot）将会生成出图1的图形。

>`$ dot -Tps graph1.dot -o graph1.ps`

命令行选项 `-Tps` 选择 PostScript（EPSF）输出。*graph1.ps* 可以打印、可以由 PostScript 查看器显示，或者也可以嵌入到另一个文档中。
![ Drawing of small graph](/images/posts/dot/small.png)
*图1：简单有向图*

&emsp;&emsp;通常可以通过设置输入文件中节点、边或子图的属性来调整图形布局中节点和边的表现方式或位置。
属性是字符串的键值对（name-value）。示例2和图2展示了一些布局属性。

- **示例2**： *稍复杂的有向图*
```
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

![ Drawing of fancy graphh](/images/posts/dot/fancy.png)
*图2：稍复杂的有向图*


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

&emsp;&emsp;另一类节点形状是基于记录的节点。其中包括形状 *record* 和 *Mrecord* 。两者是相同的，只是后者有圆角。
这些节点表示字段的递归列表，这些字段绘制成水平行和垂直行交替的方框。递归结构由节点的标签（`label`）确定，该标签具有以下描述：

- 
```
rlabel → field ( ’|’ field )*
field → boxLabel | ’’ rlabel ’’
boxLabel → [ ’<’ string ’>’ ] [ string ]
```

&emsp;&emsp;大括号、竖杠和尖括号必须转义。空格是 *tokens* 的分隔符，因此，如果要在文本中按字面意思显示空格，必须对它们进行转义（eg.: `"hello\ world |test"`）。
*boxLabel* 中的第一个字符串为字段名，并用作方框的的端口名（参见第3.1节）。第二个字符串用作字段的标签；它可以包含与多行标签相同的转义序列（参见第2.2节）。
示例4和图4的例子说明了 records 的使用和它的一些相关属性。

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
其中，数字形式的表示法更适用于自动生成颜色的脚本或工具。颜色名称不区分大小写，并且会忽略非字母数字字符，因此 *warmgrey* 和 *Warm_Grey* 是等效的。


&emsp;&emsp;我们可以提供一些在图形绘图中使用颜色的提示：
- 首先，避免使用太多鲜艳的颜色。“彩虹效应”会令人困惑。所以最好选择较窄的颜色范围，或者改变饱和度以及色相。
- 其次，当节点用深色或非常饱和的颜色填充时，`fontcolor=white` 和 `fontname=Helvetica` 的标签看起来会更容易阅读（我们还为 dot 提供了 PostScript 函数，可以从普通字体创建轮廓字体）。
- 最后，在某些输出格式中，可以定义自己的颜色空间。例如，如果使用 PostScript 进行输出，则可以在库文件中重新定义 *nodecolor*、*edgecolor* 或 *graphcolor*。因此，要使用 RGB 颜色，请将以下行放在文件 *lib.ps* 中。
```
/nodecolor {setrgbcolor} bind def
```
使用 `-l` 命令行选项加载此文件。
~~~
dot -Tps -l lib.ps file.dot -o file.ps
~~~

&emsp;&emsp;***style*** 属性控制节点和边的其他图形特征。此属性是用逗号分隔的、带有可选参数列表的原语列表。
预定义的原语包括：*solid*, *dashed*, *dotted*, *bold* 和 *invis* 。
前四条控制线绘制在节点边界和边上，具有明显的意义，invi值使节点或边保持未绘制状态？？。

节点的样式包括：*filled*, *diagonals* 和 *rounded*。

- *filled* 会使用 *fillcolor* 指定的颜色对节点内部进行阴影填充。如果 *fillcolor* 未设置，则使用 *color* 属性的值。如果 *color* 属性也未设置，则使用浅灰色作为默认值[^footer5]。
- *diagonals* 样式会在节点顶点的两边之间绘制一条短对角线。
- *rounded* 样式会使多边形的角变为圆角。

&emsp;&emsp;用户定义的样式原语可以实现为自定义 PostScript 过程。这些原语在图、节点或边的 *gsave* 上下文中执行，然后再绘制其任何标记？？。
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

### 2.5 节点和边的放置

## 3、高级特性

### 3.1 节点端口
### 3.2 集群
### 3.3 集中器

## 4、命令行选项

## 5、其他

## 6、结论

## 7、致谢

## 参考
