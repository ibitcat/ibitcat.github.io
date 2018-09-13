---
layout: post
title: wsl ubuntu 16.04下编译安装php5.6
date: 2018-09-13 14:09:00 +0800
excerpt: "在linux下（ubuntu 16.04）下编译安装php5.6，并添加pthread多线程扩展。"
tag: [环境搭建]
comments: true

---


参考：https://blog.csdn.net/qq_34372929/article/details/79854388

## 1、移除已安装的php

~~~
sudo dpkg -l | grep php| awk '{print $2}' |tr "\n" " "
sudo apt-get install aptitude
sudo aptitude purge `dpkg -l | grep php| awk '{print $2}' |tr "\n" " "`
~~~

## 2、下载源码包

~~~
cd ~
wget http://cn2.php.net/get/php-5.6.37.tar.gz/from/this/mirror
sudo mv mirror php-5.6.37.tar.gz
tar zxvf php-5.6.37.tar.gz
~~~

## 3、安装依赖

~~~
cd ~/php-5.6.37
sudo apt-get install \
gcc \
make \
libmysqlclient-dev \
libmcrypt-dev \
libcurl4-openssl-dev \
openssl=1.0.2* \
libssl-dev=1.0.2* \
libssh-dev \
libzzip-dev \
libreadline-dev \
libxml2-dev \
bzip2 \
libbz2-dev \
libfreetype6-dev \
libjpeg-dev \
libpng12-dev \
pkg-config \
lib32bz2-dev \
~~~

## 4、configure

~~~
./configure --prefix=/usr/local/php \
--with-config-file-path=/usr/local/php/etc \
--enable-inline-optimization --disable-debug \
--disable-rpath --enable-shared --enable-opcache \
--enable-fpm --with-fpm-user=domi \
--with-fpm-group=domi \
--with-mysql=mysqlnd \
--with-mysqli=mysqlnd \
--with-pdo-mysql=mysqlnd \
--with-gettext \
--enable-mbstring \
--with-iconv \
--with-mcrypt \
--with-mhash \
--with-openssl \
--enable-bcmath \
--enable-soap \
--with-libxml-dir \
--enable-pcntl \
--enable-shmop \
--enable-sysvmsg \
--enable-sysvsem \
--enable-sysvshm \
--enable-sockets \
--with-curl \
--with-zlib \
--enable-zip \
--with-bz2 \
--with-readline \
--enable-maintainer-zts
~~~

**注意点:**

php5.6 只支持openssl 1.0，不支持1.1

参考这里：[github issue](https://github.com/phpbrew/phpbrew/issues/939)

## 5、配置

~~~
cd ~/php-5.6.37
sudo cp php.ini-development /usr/local/php/etc/php.ini
sudo cp sapi/fpm/init.d.php-fpm /etc/init.d/php-fpm
sudo chmod u+x /etc/init.d/php-fpm
sudo service php-fpm start

#修改环境变量
sudo vim ~/.bashrc
PATH=$PATH:/usr/local/php/bin
sudo source .bashrc
~~~

## 6、报错
- failed to retrieve TCP_INFO for socket: Protocol not available (92)

	解决：修改php-fpm.conf文件，设置 log_level = alert

- Automatically populating $HTTP_RAW_POST_DATA is deprecated

	解决：修改php.ini配置文件的字段：always_populate_raw_post_data = -1


## 7、安装pthread扩展

~~~
cd ~
sudo wget http://pecl.php.net/get/pthreads-2.0.10.tgz
tar zxvf pthreads-2.0.10.tgz
cd pthreads-2.0.10
phpize
./configure --with-php-config=/usr/local/php/bin/php-config
make
sudo make install

#修改php.ini,添加
extension=pthreads.so
~~~

(如果出现error: pthreads requires ZTS, please re-compile PHP with ZTS enabled的错误，说明在编译php时没有加入--enable-maintainer-zts，所以只能重新编译php)