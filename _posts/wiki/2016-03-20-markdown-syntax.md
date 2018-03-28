---
layout: post
title:  "Markdown 语法"
date:   2016-03-15
excerpt: "Markdown 语法"
tag:
- markdown
comments: true
---

文章转载自[Markdown Syntax](https://taylantatli.github.io/Moon/markdown-syntax/)

另外，可以参考：[Markdown，你只需要掌握这几个](http://www.cnblogs.com/crazyant007/p/4220066.html?utm_source=tuicool&utm_medium=referral)。

## HTML Elements

像写记事本一样，可以记录你想记录的内容，可以是html 内容，也可以是纯文本内容。

## Heading 1（标题1）

两个"#"表示用`<h2>`标签，这里需要注意的是：我修改的文章目录，只支持从两个"#"开始，不支持一个"#",因为`<h1>`字太大了。

## Heading 2（标题2）

### Heading 3（子标题3）

#### Heading 4

##### Heading 5

###### Heading 6

### Body text （内容）

文本内容，**这里是加粗**， *这里是斜体*.

![这里是图片](/assets/img/avatar.jpg)
{: .image-right}

~~这里是删除线~~

### Blockquotes（引用）

> 这里是引用。

## List Types（列表）


### Ordered Lists（有序列表）

1. Item one
   1. sub item one
   2. sub item two
   3. sub item three
2. Item two

### Unordered Lists（无序列表）

* Item one
* Item two
* Item three

## Tables（表格）

| Header1 | Header2 | Header3 |
|:--------|:-------:|--------:|
| cell1   | cell2   | cell3   |
| cell4   | cell5   | cell6   |
|----
| cell1   | cell2   | cell3   |
| cell4   | cell5   | cell6   |
|=====
| Foot1   | Foot2   | Foot3
{: rules="groups"}

注意： `{: rules="groups"}`，这里的rules可以填写下面的值：

| 值 | 描述 |
|:--------|:-------:|
| none   | 没有线条。   |
| groups   | 位于行组和列组之间的线条。   |
| rows   | 位于行之间的线条。   |
| cols   | 位于列之间的线条。   |
| all   | 位于行和列之间的线条。   |
{: rules="all"}

## Code Snippets（代码高亮）

{% highlight css %}
#container {
  float: left;
  margin: 0 -240px 0 0;
  width: 100%;
}
{% endhighlight %}

代码高亮有两种方式：  

- 方式1: 使用 highlight xxx endhighlight
- 方式2: 使用三个反引号


## Buttons（按钮）

应用 `.btn` class，可以是你的链接更突出。

{% highlight html %}
<a href="#" class="btn btn-success">Success Button</a>
{% endhighlight %}

<div markdown="0"><a href="#" class="btn">Primary Button</a></div>
<div markdown="0"><a href="#" class="btn btn-success">Success Button</a></div>
<div markdown="0"><a href="#" class="btn btn-warning">Warning Button</a></div>
<div markdown="0"><a href="#" class="btn btn-danger">Danger Button</a></div>
<div markdown="0"><a href="#" class="btn btn-info">Info Button</a></div>

## KBD

也可以为键盘按钮使用 `<kbd>` 标签.

{% highlight html %}
<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
{% endhighlight %}

Press <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to move your car. **Midtown Maddness!!**

## Notices（通知）

**注意!** 你可以将 `{: .notice}`附加到段落后面来添加通知.
{: .notice}
