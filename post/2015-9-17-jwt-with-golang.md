---
layout: post
title: 学习jwt以及jwt在golang中的使用
date: 2015-9-17 15:08:00
updated: 2015-11-05 17:23:00
description: "学习jwt（json web token）以及在golang中，如何使用jwt"
tags: [go, jwt]
comments: true

---

最近转过来开发app，一番折腾+研究，发现真的是隔行如隔山，好多东西都不能按照游戏服务器开发的思路来。

这一篇主要记录关于jwt的相关知识，主要分为两个部分：  
1、了解jwt（json web token）；  
2、如何在项目中使用jwt-go；

### 学习jwt以及jwt在golang中的使用

#### 1、什么是jwt

jwt（json web token），主要包括三个部分：head、claim、sign。

**JWT Claims**

- 1、"iss"标示：
 iss 是 issuer的简称，表示请求的实体信息，例如用户名等。该选项不是必须的。
- 2、"sub"标示：
 sub 是 subject的简称，表示请求的主题信息，例如uuid之类的信息。该选项不是必须的。
- 3、"aud"标示：
 aud 是 audience的简称，表示请求的接受者，例如。该选项不是必须的。
- 4、"exp"标示：
 exp 是 expiration time的简称，表示token的到期时间，到期后，不能处理请求。该选项是必须的。
- 5、"iat"标示：
 iat  是 issued at的简称，表示token生成的时间。该选项不是必须的。
