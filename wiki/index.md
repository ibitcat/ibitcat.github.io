---
layout: page
title: Wiki
excerpt: 各种wiki
comments: false
---

<center><a href="http://domicat.me"><b>Domicat</b></a> 好记性不如烂笔头.</center>

<div class="post-list">
    {% for post in site.wiki %} 
    <ul>
        <li class="wow fadeInLeft" data-wow-duration="1.5s">
            <a class="zoombtn" href="{{ site.url }}{{ post.url }}">{{ post.title }}</a>
            <p>{{ post.excerpt }}</p>
            <a href="{{ site.url }}{{ post.url }}" class="btn zoombtn">Read More</a>
        </li>
    </ul>
    {% endfor %}
</div>