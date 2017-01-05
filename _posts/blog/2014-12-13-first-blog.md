---
layout: post
title: "入住github pages"
date: 2014-12-13
tag: [生活]
comments: false
feature: http://domicat.me/images/posts/githubpages.jpg

---

一番折腾，我的github pages 终于搭建完成。以后这里就是我的code block。

一共经历了n个版本，从最开始很挫的基于jekyll搭建的站点，再到第二版本，再到hexo，最后又迁移回jekyll。

一路下来，也是耗费了很多心血。但是感觉很值得，从一开始什么都不懂，到现在能自己改写小东西，虽然我一点前端都不会 - -

在博客中内嵌播放器：

**豆瓣fm：**  
	
	<center> <iframe name="iframe_canvas" src="http://douban.fm/partner/baidu/doubanradio" scrolling="no" frameborder="0" width="400" height="200"></iframe> </center>


**虾米播播：**  
可以参考[http://jingyan.baidu.com/article/a65957f48947af24e67f9bb6.html](http://jingyan.baidu.com/article/a65957f48947af24e67f9bb6.html)

```html
<center><embed src="http://www.xiami.com/widget/0_1769157640,_360_260_CD5C5C_808080_1/multiPlayer.swf" type="application/x-shockwave-flash" width="360" height="175" wmode="transparent"></embed></center>
```

**网易云音乐：**  
{% highlight html %}
<iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="http://music.163.com/outchain/player?type=2&id=28287199&auto=1&height=66"></iframe>
{% endhighlight %}