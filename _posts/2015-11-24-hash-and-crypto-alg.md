---
layout: post
title: 这些年，我遇到的哈希、加密算法
date: 2015-11-24 16:50:00
tag: [算法]

---


最近接各种sdk，期间涉及到了很多hash算法、加密算法，虽然之前也一直有接触这些比较常用的算法，也算是熟悉一些常用的算法，起初也不觉得有非常大的必要记录下来，后面想想，还是整理下记录下来，有备无患嘛。

<!-- more -->

### 1、hash算法

"哈希"在工作中常常被提起，主要是把任意长度的输入，通过散列算法，变换成固定长度的输出。比较常见的算法有：**MD5**、**SHA1**、**HMAC**、**HMAC_SHA1** 等。

很多人将他们称之为加密算法，个人觉得其实他们算不算加密算法，除了其中的**HMAC_SHA1需要输入秘钥**，其他的都是不需要秘钥的，他们的作用都是计算输入内存的散列值，确保信息传输完整一致。例如很多软件，都会在官网放出软件的MD5、SHA值，主要是确保你下载的软件是否是原版的，确保没有被其他人破解、篡改。

特别注意：哈希算法都是不可逆算法，也就是你无法根据给定的MD5反向解密得出hash前的数据。举个栗子：你可以计算出1G MP4文件的MD5值"123456"(假设的)，但是你肯定无法根据这个“123456”得到这个1G的MP4，如果可以，那该是多么牛逼的压缩技术，还需要等待漫长的下载吗?找AV得多么幸福啊……

主要注意：**SHA1**和**HMAC_SHA1**是有区别的，前者无需秘钥，而后者需要输入秘钥，安全性更好。


下面是用golang写的小代码片段：

```go
import (
	"fmt"
	"crypto/hmac"
	"crypto/md5"
	"crypto/sha1"
	"encoding/hex"
	"io"
)

// 计算md5
func Md5(value string) string {
	h := md5.New()
	h.Write([]byte(value))
	return fmt.Sprintf("%s", hex.EncodeToString(h.Sum(nil)))
}

// sha1
func Sha1(){
	h := sha1.New()
	io.WriteString(h, "hello,domi~")
	signature := fmt.Sprintf("%x", h.Sum(nil))
}

// hmac_sha1
func HmacSha1() string{
	hasher := hmac.New(sha1.New, []byte("key"))
	hasher.Write([]byte("hello,cat~"))

	seg := hasher.Sum(nil)
	return base64.StdEncoding.EncodeToString(seg)
}
```

>Tips:  

关于golang MD5等计算的小问题：

```go
// 方式一
h := md5.New()
h.Write([]byte("test"))
h.Sum(nil)

// 方式二
md5.Sum([]byte("test"))
```

这两种方式是有区别的：  

- 方式一中：Write函数会把MD5对象内部的字符串clear掉，然后把其参数作为新的内部字符串。Sum函数则是先计算出内部字符串的MD5值，而后把输入参数附加到内部字符串后面。如果 `h.Sum(nil)`参数不填nil，而传入`[]byte("foo")`,则最后的结果为：`098f6bcd4621d373cade4e832627b4f6foo`,会发现foo出现在md5("test")的后面。
- 方式二中：直接使用md5包中的`Sum`方法，效果与方式一中传nil参数是一样的。


### 2、加密算法

加密算法又分为：**对称加密**和**非对称加密**，对称加密，顾名思义，就是加密和解密都使用相同的秘钥；非对称加密则是加密和解密的秘钥是不一样的。  
具体可以参考：[http://www.willrey.com/support/ssl_DES.html](http://www.willrey.com/support/ssl_DES.html)

常用的对称加密：

- DES（Data Encryption Standard）：数据加密标准，速度较快，适用于加密大量数据的场合。
- 3DES（Triple DES）：是基于DES，对一块数据用三个不同的密钥进行三次加密，强度更高。
- AES（Advanced Encryption Standard）：高级加密标准，是下一代的加密算法标准，速度快，安全级别高；

常用的非对称加密：

- RSA：由 RSA 公司发明，是一个支持变长密钥的公共密钥算法，需要加密的文件块的长度也是可变的；
- DSA（Digital Signature Algorithm）：数字签名算法，是一种标准的 DSS（数字签名标准）；
- ECC（Elliptic Curves Cryptography）：椭圆曲线密码编码学。

不过1024位 RSA 私钥加密已被破解，已经越来越不安全了。

另外：关于RSA的公钥和私钥到底哪个才是用来加密和哪个用来解密？可以参考[知乎的讨论](http://www.zhihu.com/question/25912483)。
简单来说就是：如果是用来加密，则使用公钥加密，私钥解密；如果是用来做数字签名，则使用私钥加密，公钥解密，同时需要带上原数据hash后再用私钥加密的签名。

引用知乎的答案：

>其实公钥和私钥都可以用来加密或解密---只要能保证用A加密，就用B解密就行。至于A是公钥还是私钥，其实可以根据不同的用途而定。  
>
>例如说，如果你想把某个消息秘密的发给某人，那你就可以用他的公钥加密。因为只有他知道他的私钥，所以这消息也就只有他本人能解开，于是你就达到了你的目的。
>
>但是如果你想发布一个公告，需要一个手段来证明这确实是你本人发的，而不是其他人冒名顶替的。那你可以在你的公告开头或者结尾附上一段用你的私钥加密的内容（例如说就是你公告正文的一段话），那所有其他人都可以用你的公钥来解密，看看解出来的内容是不是相符的。如果是的话，那就说明这公告确实是你发的---因为只有你的公钥才能解开你的私钥加密的内容，而其他人是拿不到你的私钥的。
>
>最后再说一下数字签名。数字签名无非就两个目的：证明这消息是你发的；证明这消息内容确实是完整的.
>
>也就是没有经过任何形式的篡改（包括替换、缺少、新增）。  
>其实，上面关于“公告”那段内容，已经证明了第一点：证明这消息是你发的。那么要做到第二点，也很简单，就是把你公告的原文做一次哈希（md5或者sha1都行），然后用你的私钥加密这段哈希作为签名，并一起公布出去。当别人收到你的公告时，他可以用你的公钥解密你的签名，如果解密成功，并且解密出来的哈希值确实和你的公告原文一致，那么他就证明了两点：这消息确实是你发的，而且内容是完整的。

数字证书就是经过CA认证过的公钥，而私钥一般情况都是由证书持有者在自己本地生成的，由证书持有者自己负责保管。具体使用时，签名操作是发 送方用私钥进行签名，接受方用发送方证书来验证签名；加密操作则是发送方用接受方的证书进行加密，接受方用自己的私钥进行解密。

这里顺便记录下openssl生成rsa公钥和秘钥、证书、pfx等相关的操作，以备后面的工作需要。

Ubuntu环境下：
	
	$ openssl 进入OpenSSL程序
	OpenSSL> genrsa -out rsa_private_key.pem 1024 #生成私钥
	OpenSSL> rsa -in rsa_private_key.pem -pubout -out rsa_public_key.pem #生成公钥
	OpenSSL> req -new -x509 -key rsa_private_key.pem -days 750 -out rsa_cert.cer #生成证书（会引导你输入一堆的信息）
	OpenSSL> pkcs12 -export -name yourname -in rsa_cert.cer -inkey rsa_private_key.pem -out rsa_pfx.pfx #生成pfx（需要输入两次密码）
	OpenSSL> exit ## 退出OpenSSL程序

另外，关于pkcs的标准，参考[这篇文章](http://weekend.blog.163.com/blog/static/7468958201131591422649/)

### 3、base64

为什么要单独写base64，因为它算不上是加密算法，也算不上是hash算法，不知道放在哪里……

BASE64加密后产生的字节位数是8的倍数，如果不够位数以=符号填充。其他细节可以上网查询，我也没有深入了解。
