---
layout: post
title: golang的标准库
date: 2015-7-28 15:05:00
updated: 2015-11-05 17:20:00
tags: [go]
comments: true

---

简单介绍golang标准库每个包的功能，介绍顺序跟官网帮助文档顺序一致。  
这里也贴几个地址，也介绍了go的标准库。

- [https://github.com/polaris1119/The-Golang-Standard-Library-by-Example](https://github.com/polaris1119/The-Golang-Standard-Library-by-Example) 
- [http://pkgdoc-liudiwu.coding.io/](http://pkgdoc-liudiwu.coding.io/)

<!-- more -->

### archive
>归档访问包，包含两个package。

- tar
- zip

> 从网上找了一个例子，如下：
	
	package main
	
	import (
		"fmt"
		"os"
		"log"
		"archive/zip"
		"io"
	)
	
	const (
		LOGFILEPATH = "d:\\zip.log"
	)
	
	func main(){
		logfile,err := os.OpenFile(LOGFILEPATH,os.O_CREATE|os.O_RDWR,0);
		if err!=nil {
			fmt.Println(err.Error());
			return;
		}
		defer logfile.Close();
		logger := log.New(logfile,"\r\n",log.Ldate|log.Ltime|log.Llongfile);
		if logger==nil {
			fmt.Println("logger init error");
		}
		r,err := zip.OpenReader("d:\\新建文本文档.zip");
		if err!=nil {
			logger.Fatal(err);
		}
		defer r.Close();
		for _,f := range r.File {
			fmt.Println("FileName : ",f.Name);
			rc,err := f.Open();
			if err!=nil {
				logger.Fatal(err);
			}
			_,err = io.CopyN(os.Stdout,rc,68); //打印文件内容
			if err!=nil {
				if err!=io.EOF {
					logger.Fatal(err);
				}
			}
		}
	}

---

### bufio
>bufio 包实现了缓存IO。它包装了 io.Reader 和 io.Writer 对象，创建了另外的Reader和Writer对象，它们也实现了io.Reader和	io.Writer接口，不过它们是有缓存的。该包同时为文本I/O提供了一些便利操作。

### crypto
>crypto包收集了常见的加密算法。例如md5、rand、rsa等等。常用的加密算法都在这个包内。

- ras
- rand 
- md5

因为工作需要使用过**ras**、**rand**、**md5**算法：

1、rand 实现了加密安全伪随机数发生器。