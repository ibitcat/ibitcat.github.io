---
layout: post
title: "入住github pages"
date: 2014-12-13
tag: [生活]
comments: false
feature: http://domicat.me/images/posts/githubpages.jpg

---

一番折腾，我的github pages 终于搭建完成。以后这里就是我的code block。

一共经历了三个版本，从最开始很挫的基于jekyll搭建的站点，再到第二版本，稍微高大上了那么一点点，
最后迁移到hexo。

一路下来，也是耗费了很多心血。但是感觉很值得，从一开始什么都不懂，到现在能自己改写小东西，虽然我一点前端都不会 - -

另外，关于如何添加一下小玩意到NexT主题上，请参考：  

- [玩转NexT](http://jijiaxin89.com/2015/08/21/%E7%8E%A9%E8%BD%AChexo%E5%8D%9A%E5%AE%A2%E4%B9%8Bnext/)  
- [站内搜索](http://lizhuolun.com/posts/%E4%B8%BAhexo-next%E4%B8%BB%E9%A2%98%E6%B7%BB%E5%8A%A0tinysou-Swiftype-%E7%AB%99%E5%86%85%E6%90%9C%E7%B4%A2/)
- [多说评论自定义](http://wsgzao.github.io/post/duoshuo/)

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