
该主题Fork自 [Moon Jekyll Theme](https://github.com/TaylanTatli/Moon), 并做了一些修改，欢迎fork。

修改如下：
- 评论改为[gitment](https://github.com/imsun/gitment)
- 增加文章目录,移植自[http://mazhuang.org](http://mazhuang.org),(因为之前的博客是基于他修改的)
- 图片显示改为fancybox,之前是magnific-popup
- 修改字体
- 增加footer，并固定到页面底部
- 修改404页面
- 增加搜索功能，功能移植自[space-jekyll-template](https://github.com/victorvoid/space-jekyll-template)
- 移除文章分享功能（因为对我没啥用，博客主要用来做笔记）
- 增加wiki
- 增加links

**优化：**

采用了gulp压缩过js文件，并合并成一个 main.js文件。需要安装node.js,并安装glup模块，以及相关插件，然后完毕后，运行`gulp`即可。