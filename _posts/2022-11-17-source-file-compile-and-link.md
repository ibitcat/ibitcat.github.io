---
title:  "源文件如何变成可执行程序"
date: 2022-11-17
tag:
- 编译与链接
---

我们可能会经常使用 GCC 或者 Visual Studio 来构建项目，对于这些工具或者 IDE 的使用驾轻就熟，但是构建过程中的细节你真的了解吗，项目中的一个个源文件经过这些编译工具构建后是如何生成最终的可执行文件的？

接下来，本文将剖析源文件变成可执行文件的过程，拨开隐藏在这些构建工具下的迷雾。

## 构建的过程
以一个简单的 hello world 为例，源文件内容如下：
```c
// hello.c
#include <stdio.h>

int main(int argc, const char **argv){
        printf("hello world!\n");
        return 0;
}
```
使用命令 `gcc hello.c -o hello` 编译后，最终会得到可执行文件 hello。这个构建过程可能一秒就完成了，但是在这一秒内其实发生了很多事，我们将这个过程分成以下四个阶段：**预编译（Prepressing**）、**编译（compilation）**、**汇编（assembly）**、**链接（linking）**。

整个流程如下图所示：
![图1](/assets/image/posts/2022-11-17-01.svg?style=centerme)

## 预编译
预编译会对源代码文件中的预编译指令进行文本替换方便的操作，处理规则如下所示：
- 将所有的 `#define` 删除，并且展开所有宏定义；
- 处理所有条件预编译指令，比如 `#if`、`#ifdef`、`#elif`、`#else`、`#endif`;
- 处理 `#include` 预编译指令，将被包含的文件展开插入到该预编译指令的位置。注意，这个过程是递归进行的，也就是说被包含的文件可能还包含其他文件。
- 删除所有的注释；
- 添加行标记(*linemarkers*)，比如 `#2 "hello.c" 2`，以便于编译时编译器产生调试用的行号信息及用于编译时产生编译错误或警告时能够显示行号；
- 保留所有的 `#pragma` 编译器指令，因为编译器须要使用它们

关于 GCC 的预编译输出内容，可以参阅官方文档[Preprocessor Output](https://gcc.gnu.org/onlinedocs/cpp/Preprocessor-Output.html#Preprocessor-Output)。

在预编译的输出文件中，可以看到很多 `#` 开头的行，这些行被称为 **行标记**，格式为：`# linenum filename flags`。它表示“#”号后面的内容是来在哪个文件的哪一行，文件名后面可以有零个或多个标志，即`1`、`2`、`3`、`4`，多个标志用空格分隔。

下面描述了每一个标志的意义：
- `1`，表示新文件的开始；
- `2`，表示返回到一个文件，一般出现在包含另一个文件之后；
- `3`，表示后面的内容来在系统头文件；
- `4`，表示后面的文本应被视为包含在隐式的 `extern "C"` 块中；

接下来，我们使用 gcc -E 命令预编译上面的 hello.c 源文件，看看预编译后的内容长什么样（预编译内容过多，忽略中间部分内容）。

```c
# 0 "hello.c"
# 0 "<built-in>"
# 0 "<command-line>"
# 1 "/usr/include/stdc-predef.h" 1 3 4
# 0 "<command-line>" 2
# 1 "hello.c"

# 1 "/usr/include/stdio.h" 1 3 4
# 27 "/usr/include/stdio.h" 3 4
# 1 "/usr/include/x86_64-linux-gnu/bits/libc-header-start.h" 1 3 4
# 33 "/usr/include/x86_64-linux-gnu/bits/libc-header-start.h" 3 4
# 1 "/usr/include/features.h" 1 3 4
# 392 "/usr/include/features.h" 3 4
# 1 "/usr/include/features-time64.h" 1 3 4
# 20 "/usr/include/features-time64.h" 3 4
# 1 "/usr/include/x86_64-linux-gnu/bits/wordsize.h" 1 3 4
# 21 "/usr/include/features-time64.h" 2 3 4
# 1 "/usr/include/x86_64-linux-gnu/bits/timesize.h" 1 3 4
# 19 "/usr/include/x86_64-linux-gnu/bits/timesize.h" 3 4
# 1 "/usr/include/x86_64-linux-gnu/bits/wordsize.h" 1 3 4
# 20 "/usr/include/x86_64-linux-gnu/bits/timesize.h" 2 3 4
# 22 "/usr/include/features-time64.h" 2 3 4
# 393 "/usr/include/features.h" 2 3 4
# 486 "/usr/include/features.h" 3 4
# 1 "/usr/include/x86_64-linux-gnu/sys/cdefs.h" 1 3 4
# 559 "/usr/include/x86_64-linux-gnu/sys/cdefs.h" 3 4
# 1 "/usr/include/x86_64-linux-gnu/bits/wordsize.h" 1 3 4
# 560 "/usr/include/x86_64-linux-gnu/sys/cdefs.h" 2 3 4
# 1 "/usr/include/x86_64-linux-gnu/bits/long-double.h" 1 3 4
# 561 "/usr/include/x86_64-linux-gnu/sys/cdefs.h" 2 3 4
# 487 "/usr/include/features.h" 2 3 4
# 510 "/usr/include/features.h" 3 4
# 1 "/usr/include/x86_64-linux-gnu/gnu/stubs.h" 1 3 4
# 10 "/usr/include/x86_64-linux-gnu/gnu/stubs.h" 3 4
# 1 "/usr/include/x86_64-linux-gnu/gnu/stubs-64.h" 1 3 4
# 11 "/usr/include/x86_64-linux-gnu/gnu/stubs.h" 2 3 4
# 511 "/usr/include/features.h" 2 3 4
# 34 "/usr/include/x86_64-linux-gnu/bits/libc-header-start.h" 2 3 4
# 28 "/usr/include/stdio.h" 2 3 4

...

# 885 "/usr/include/stdio.h" 3 4
extern int __uflow (FILE *);
extern int __overflow (FILE *, int);
# 902 "/usr/include/stdio.h" 3 4

# 3 "hello.c" 2


# 4 "hello.c"
int main(int argc, const char **argv){
 printf("hello world!\n");
 return 0;
}
```
可以看到预编译后的文件比源代码文件增加了很多内容，同时也被插入了很多行标记，因为我们在源文件中包含了 `#include <stdio.h>` 头文件，而预编译过程会递归展开包含的头文件，因此最终生成的文件就增大不少。

接下来，我们梳理下插入的行标记，为了更加清晰了解它的组织结构和作用，我们把上面内容再次精简一下：
```c
# 1 "hello.c" // 对应 #include <stdio.h>

# 1 "/usr/include/stdio.h" 1 3 4 // 开始展开 <stdio.h>
# 27 "/usr/include/stdio.h" 3 4 // 对应 #include <bits/libc-header-start.h>
# 1 "/usr/include/x86_64-linux-gnu/bits/libc-header-start.h" 1 3 4 // 开始展开 <bits/libc-header-start.h>
# 33 "/usr/include/x86_64-linux-gnu/bits/libc-header-start.h" 3 4
...
# 28 "/usr/include/stdio.h" 2 3 4       // 展开结束 <bits/libc-header-start.h>
...
# 3 "hello.c" 2 // 展开结束 <stdio.h>
```
第 1 行表示接下来的内容来自 "hello.c" 的第一行，这一行对应了源文件中的 `#include <stdio.h>`；第 3 行表示这里的内容来自 `/usr/include/stdio.h` 文件的第一行，而且行标志为`1 3 4`，表示该内容是一个新文件的开始，且为系统头文件，隐式的 `extern "C"`(即告诉编译器这部分代码按C编译器的进行编译)；第 4 行的内容来自 `/usr/include/stdio.h` 的 27 行，即`#include <bits/libc-header-start.h>`；第 5 行表示要开始展开新的头文件了；然后以此类推，直到最后一行，它的行标志为`2`，它表示要返回到 "hello.c" 第三行。至此，stdio.h 这个头文件整个展开完毕。

从预编译过程引出一个小技巧，当我们在阅读其他项目代码时，可能因为其代码充斥着大量的宏定义而导致代码晦涩难懂，此时，可以通过命令 `gcc -E -P`，将代码中的宏定义展开。其中，-P 参数可以屏蔽掉行标记。

### 预编译头
从上面的例子会发现一个问题，仅仅是短短一行 `#include <stdio.h>` 就展开出几百行的内容，倘若一个项目内有很多很大的头文件，例如 windows 系统下的 `windows.h`，包含这种大文件的头文件会拖累编译速度。为了解决这个问题，就出现了一种方案——预编译头([Precompiled header](https://en.wikipedia.org/wiki/Precompiled_header))，预编译头将一些项目中普遍使用的头文件内容的词法分析、语法分析等结果缓存在一个特定格式的二进制文件中；当编译实质C/C++源文件时，就不必从头对这些头文件进行词法语法分析，而只需要利用那些已经完成词法-语法分析的结果就可以了。在 windows 系统中，预编译头的扩展名为 `*.pch`，gcc 生成的预编译头后缀名为 `*.h.gch`。

我们还是沿用上面的例子，并增加一个头文件，然后测试一下预编译头的效果，代码如下所示：
```c
// hello.c
#include <stdio.h>
#include "hello.h"

int main(int argc, const char **argv){
	printf("hello world!\n");
	printf("result = %d\n", strAdd("100", "88"));
	return 0;
}

int strAdd(const char *str1, const char *str2) {
	int i1 = atoi(str1);
	int i2 = atoi(str2);
	return i1 + i2;
}

// hello.h
#include <stdlib.h>

int strAdd(const char*, const char*);
```
使用命令 `gcc -c hello.h` 即可生成预编译头，默认的文件名为 `hello.h.gch`。当开启预编译头后，若存在预编译头并且头文件的时间戳没有发生变更，则编译器使用预编译头进行编译。

一般情况下，使用 `stdafx.h` 作为预编译头文件，这只是一个推荐的命名方式，并非强制，一般会把一些经常被包含的系统头文件或者库头文件加入其中。具体可以参考 Visual studio 中的 `stdafx.h` 做法。

>小技巧：可以使用`gcc -H xxx.c` 来打印该源文件使用到的头文件。

## 编译
编译就是把上一步预编译后的 `.i` 文件通过编译器前端进行一系列操作，最终生成与机器无关的中间目标代码，也就是汇编代码。

编译器会分为前端、优化器、后端，它们的划分依据是：**机器的相关性**。编译器前端功能包括：词法分析、语法分析、语义分析、中间代码生成；优化器则是在前端的基础上，对得到的中间代码进行优化，生成目标代码，一般指汇编代码；而编译器后端则负责中间代码转化为针对各自平台的机器代码。也就是说前端和优化器负责把源代码文件中的高级语言转换成汇编语言，后端负责把汇编语言转换成平台相关的机器代码，进而生成目标文件。

在编译期间涉及到的诸如词法分析、语法分析等等，本文不做深入研究，了解这个流程即可，因为我也弄不太懂😒。

## 汇编
汇编这一步相信大家都比较熟悉了，在上一步编译得到的就是汇编代码了。不同平台生成的汇编代码格式也不一样，但是常用的有两种：**AT&T汇编**、**intel汇编**。前者是 GCC 使用的汇编格式，后者是微软使用的汇编格式。这两种汇编格式的区别可以网上搜索对比一下。

接下来，使用命令 `gcc -c hello.s -o hello.o`，将汇编代码汇编成目标文件(*object file*)。我们使用 `file hello.o` 来查看下文件的类型：
```markup
hello.o: ELF 64-bit LSB relocatable, x86-64, version 1 (SYSV), not stripped
```
表明了目标文件 hello.o 是一个 64 位的 ELF 格式的可重定位文件，重定位是链接过程中很重要的一个概念，我会在后面的文章中详细描述它的作用。

我们来反汇编一下 hello.o，看看这个二进制文件的里面有什么，这里我们要借助一个工具——objdump，运行命令：`objdump -d -s hello.o`，得到以下输出：
```asm
hello.o：     文件格式 elf64-x86-64

# 段表
Contents of section .text:
 0000 f30f1efa 554889e5 4883ec10 897dfc48  ....UH..H....}.H
 0010 8975f048 8d050000 00004889 c7e80000  .u.H......H.....
 0020 0000b800 000000c9 c3                 .........
Contents of section .rodata:
 0000 68656c6c 6f20776f 726c6421 00        hello world!.
Contents of section .comment:
 0000 00474343 3a202855 62756e74 75203131  .GCC: (Ubuntu 11
 0010 2e332e30 2d317562 756e7475 317e3232  .3.0-1ubuntu1~22
 0020 2e303429 2031312e 332e3000           .04) 11.3.0.
Contents of section .note.gnu.property:
 0000 04000000 10000000 05000000 474e5500  ............GNU.
 0010 020000c0 04000000 03000000 00000000  ................
Contents of section .eh_frame:
 0000 14000000 00000000 017a5200 01781001  .........zR..x..
 0010 1b0c0708 90010000 1c000000 1c000000  ................
 0020 00000000 29000000 00450e10 8602430d  ....)....E....C.
 0030 06600c07 08000000                    .`......

# 代码段
Disassembly of section .text:

0000000000000000 <main>:
   0:   f3 0f 1e fa             endbr64
   4:   55                      push   %rbp
   5:   48 89 e5                mov    %rsp,%rbp
   8:   48 83 ec 10             sub    $0x10,%rsp
   c:   89 7d fc                mov    %edi,-0x4(%rbp)
   f:   48 89 75 f0             mov    %rsi,-0x10(%rbp)
  13:   48 8d 05 00 00 00 00    lea    0x0(%rip),%rax        # 1a <main+0x1a>
  1a:   48 89 c7                mov    %rax,%rdi
  1d:   e8 00 00 00 00          call   22 <main+0x22>   # 调用 printf 函数
  22:   b8 00 00 00 00          mov    $0x0,%eax
  27:   c9                      leave
  28:   c3                      ret
```
可以看到，汇编指令最终会被翻译成机器能够识别的机器指令。这里要留意下机器指令 `e8 00 00 00 00`，e8 对应 call 指令，而后面的 4 字节对应的是函数地址，但是，这里为什么全是 0 呢？这就涉及到了链接，不过我不打算在本文继续深入，可以先简单的理解成：先为 printf 符号留一个坑，等到链接时找到了 printf 函数真正的位置后再填上这个坑。

好了，到这一步后，整个源文件的编译也就结束了，接下来的工作就交给链接器了。

## 链接
在上一步生成的 hello.o 不是一个可执行文件，因为它使用了一个库函数 `printf`，连接器需要找到这个函数的提供者，并将它与 hello.o 修正、组装在一起，最终形成一个可执行文件。也就是说链接负责把各个目标文件的符号引用修正好，使得各个目标文件能够正确衔接起来。

那 `prinft` 所在的目标文件在哪里呢？在 linux 系统中，由 libc.a 静态库提供，glibc是 linux 系统中最底层的api，几乎其它任何运行库都会依赖于glibc。glibc除了封装 linux 操作系统所提供的系统服务外，它本身也提供了许多其它一些必要功能服务的实现。可以用命令 `ar -t /usr/lib/x86_64-linux-gnu/libc.a |grep -w "printf.o"` 来找到这个目标文件。

要强调一点的是，这里说的链接属于静态链接的范畴，链接其实分为**静态链接**和**动态链接**两种，它们的链接方式有很大的区别，后面的文章会分别单独介绍这两种链接方式。

## 总结
也许我们沉迷于 IDE 的奶头乐中，用惯了它们提供的各种功能高级，而忽视了编译过程最原始朴素的一面，本文旨在扒开“糖衣”，探寻从源文件到可执行文件的转换过程，从而对编译过程有一个较为清晰的了解，但也还谈不上深入，虽不能知其所有然，但至少知其一二然也是不错的进步。