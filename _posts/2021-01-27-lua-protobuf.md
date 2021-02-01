---
title:  "集成 lua-protobuf 到 skynet"
date: 2021-01-27
tag:
- Protobuf
---

### 起因
目前，我们的游戏服务器使用的数据存储方式是将服务器数据用 protobuf 序列化，然后将序列化的二进制数据入库到 Mysql 中。在这个过程中我们使用的是云风的 [pbc](https://github.com/cloudwu/pbc) 库来操作 protobuf，但是在实际使用中，发现了一些 pbc 的不足之处，最后经过探讨与评估后，我们决定使用 **[lua-protobuf](https://github.com/starwing/lua-protobuf)** 这个开源库来替换掉 pbc。

这里顺带提一点，我个人不太倾向使用 mysql 来存在二进制数据块（blob 类型），至少在游戏服务器中不太适用，因为当把整个游戏数据都打包成一个数据块存入到 mysql 后，并不是“所见即所得”了，这会对线上问题分析、数据修正等带来很多困扰，例如若需要离线修复某些数据时，你无法直接操作二进制数据块，需要经过 **[反序列化 -> 修改数据-> 序列化 -> 写入数据库]** 这一系列操作。另外，当存入的二进制数据超过 16Mb 时，你还需要注意 mysql 的分片。最后，Mysql 引擎也会对 BLOB 与 TEXT 做一些特殊处理，当BLOB与TEXT的值太大时，InnoDB会使用专门的“外部”存储区域来进行存储，此时每个值在行内会采用1~4个字节存储指针，在外部存储区域存储实际值，在某些情况下可能引起性能问题。

### 对比 pbc
首先，我们要清楚 pbc 的不足才能明白为什么要替换掉它，在实际使用过程中，我总结了一下 pbc 存在的一些问题（*也可能是使用姿势不对*）：
1. pbc 采用的是惰性加载的方式，一开始并知道这个协议里面有什么域，必须在访问过一次后，这个消息的所有域（字段）才能被确认，若消息内包含了其他消息类型，则以此类推。
2. 访问消息中不存在的字段时会报断言错误，这就直接限制了反序列化后的 table 的可扩展性，当一些运行时数据想要挂载到协议的 table 上时，就变得不可行了。
3. 在与 skynet 的 sproto 结合使用中会存在一些问题，当 sproto 中的协议字段在 protobuf 的协议中不存在时，sproto 序列化会报错，究其原因是由上面第 2 条引起。
4. 消息的默认值是通过元表的方式实现的，经过同一个消息类型反序列化后的 lua table 都被设置了同一个默认值元表，而这些带有默认值的字段在没有设置新值时，在序列化成二进制时会被忽略，当在需要默认值入库的使用场景中会出现一些问题，例如：在上一个版本玩家的 money 默认值为 `[default=100]`，而新版本默认值修改为 `[default=200]`，但是更新后又不能影响上一版本已经注册过的玩家，此时就无法满足需求了（当然这里只是用一个例子来说明该问题，现实可能不会有这种需求）。
5. pbc 是由 C 和 Lua 组成的混合库，C 负责解析 pb 文件以及提供底层解析，Lua 层则进行封装以提供更友好的接口，上面提到的很多惰性加载都是在 Lua 中实现，且使用了大量的元表，这也导致了 lua 层代码晦涩难懂。

以上的这些问题口说无凭，下面直接上例子，首先创建一个通讯录的消息描述文件（schema文件，`.proto` 后缀名），其内容如下：
```markup
// addressbook_v2.proto
syntax = "proto2";
package tutorial;

message Profile {
  optional string nick_name = 1;
  optional string icon = 2;
}

message Person {
  required string name = 1;
  required int32 id = 2;
  optional string email = 3;

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    required string number = 1;
    optional PhoneType type = 2 [default = HOME];
  }

  repeated PhoneNumber phone = 4;
  repeated int32 test = 5 [packed=true];
  optional Profile profile = 6;
}

message AddressBook {
  repeated Person person = 1;
  optional int32 count = 2 [default = 0];
  required Person self = 3;
  optional int32 version = 4 [default = 1001];
}
```

接下来我们使用 pbc 来编/解码，用实验来证明上面所说的问题，关于 pbc 的惰性加载流程也在下面代码的注释中有描述：
```lua
-- tutorial.lua

-- xprint 是我个人用来打印 lua table 的库，https://github.com/shuimu98/domi-lab/blob/master/lua/print_table.lua 自取
require("xprint")
local pbc = require("protobuf")
pbc.register_file("addressbook_v2.pb")

-- 编/解码
print("\n========= 编/解码 =========")
local addrbook = {
    -- person = {
    --     {name="a", id=1, email="a@qq.com"},
    --     {name="b", id=2, email="b@qq.com"}
    -- },
    count = 1,
    self = {name="c", id=3, email="c@qq.com", profile={nick_name="nick_c", icon="c.ico"}}
}
local bytes = pbc.encode("tutorial.AddressBook", addrbook)
local data = pbc.decode("tutorial.AddressBook", bytes)


-- 字段访问
print("\n========= 字段访问 =========")
--[[
对于根域，在反序列化后会把那些基础类型的字段解析出来；
对于非基础类型的字段，则采用惰性加载的方式，在未访问过时，其存储如下：
 data = {
    count = 1,
    self = {"tutorial.Person", buffer1<二进制数据>} -- 其元表为：decode_message_mt
}
此时，data.self 这个 table 实际是没有解析过的，它只是暂存了消息类型名以及对应的能够被解码的二进制buffer。
关于 data.self 是怎么来的，可以参考 protobuf.lua 中的 decode_message_cb 回调函数（注意，这个函数是由 c 层调用的），
它是在解码父域 data（也就是“tutorial.AddressBook”）时，在 decode_message_cb 回调中定义的 table，并设置了元表 decode_message_mt。

若想要获取 data.self 的字段数据，就需要手动访问一次 self 中的字段，以触发 data.self 的解码操作，具体逻辑由 decode_message_mt
这个元表中的 __index 和 __pairs 元方法处理。

当触发了解码后，最初暂存在 data.self 的消息类型名和buffer就会被清空，取而代之的是定义在该消息的所有字段值。
]]
print("count = ", rawget(data, "count")) -- 输出： count = 1
local myself = rawget(data, "self")
print("self = ", myself, rawget(myself, 1)) -- 输出：self = table: 0x7fffcd047ec0   tutorial.Person

-- 手动访问 data.self.name，触发 self 的解码，并清空暂存信息
print("data.self.name =", myself.name) -- 输出：data.self.name = c
print("self1 = ", myself, rawget(myself, 1)) -- 输出：self1 = table: 0x7fffbddb25c0   nil


-- 字段默认值
print("\n========= 字段默认值 =========")
xprint("default mt = ", getmetatable(data)) -- 输出： default mt = {["__index"] = function: 0x7fffcf5341f0}
print("version = ", data.version) -- 输出：version = 1001


-- 数据兼容性测试
-- 首先保存序列化后的数据到 output.data，然后修改 addressbook.proto 中的 version 字段默认值为 [default] = 1111，并编译成新的 .pb
print("\n========= 数据兼容性 =========")
local w = false -- 读取切换开关
if w then
    local default_t = pbc.decode("tutorial.AddressBook", "")
    xprint(default_t, default_t.version) -- 输出：version = 1001
    local content = pbc.encode("tutorial.AddressBook", default_t)
    local f = io.open("output.dat", "w+")
    f:write(content)
    f:flush()
    f:close()
    print("bytes = ", content)
else
    local f = io.open("output.dat", "r")
    local content = f:read('*a')
    f:close()
    local abt = pbc.decode("tutorial.AddressBook", content)
    xprint(abt, abt.version) -- 输出：version = 1111，而不是上次的 1001
end


-- 打印 data 完整信息
xprint(data) -- 输出如下：
--[[
[file]=@tutorial.lua, [line]=44: 
{
    ["self"] = {
    |   ["name"] = "c",
    |   ["email"] = "c@qq.com",
    |   ["id"] = 3,
    |   ["profile"] = {
    |       ["nick_name"] = "nick_c",
    |       ["icon"] = "c.ico"
    |   }
    },
    ["count"] = 1
}
]]

-- 访问一个不存在的值，pbc 会直接报错
print("data.test = ", data.test)
```

当然，也并不是说 pbc 完全就是糟糕的，只是在我们项目中使用它遇到了一些问题使得它的缺点被放大。我们选择 lua-protobuf 来替换 pbc，主要是其具有以下优点：
1. lua-protobuf 反序列化后得到是一张纯粹的 lua table，其中的字段在反序列化后都已经确定（proto2和proto3 默认值的处理有一些区别）。
2. 访问不存在的字段时不会报错，在序列化时会忽略那些在未在消息中定义的字段，这样我们可以在运行时在 table 上挂载一些临时字段而不用担心序列化报错。
3. 对于 proto3 的默认值处理更加合理（proto2 与 pbc 类似，也是通过元表来实现默认值读取，需要设置选项 `"use_default_metatable"`）。
4. lua-protobuf 更加简洁，所有功能都在 C 层实现，只需要编译一个 C 文件即可，也不用在 lua 层做额外的逻辑。
5. 减少外部 `protoc` 组件依赖，可以使用其提供的 protoc.lua 库来加载、编译 schema 文件，对于那些只有少量 schema 文件的项目更适合。

现在，我们使用 lua-protobuf 分别对 proto2 和 proto3 进行编解码测试，proto2 版本的 schema 文件不变，还是如上面所示，proto3 版本的 schema 定义如下：
```markup
// addressbook_v3.proto
syntax = "proto3";
package tutorial;

message Profile {
  string icon = 2;
  string nick_name = 1;
}

message Person {
  string name = 1;
  int32 id = 2;
  string email = 3;

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    string number = 1;
    PhoneType type = 2 [default = HOME];
  }

  repeated PhoneNumber phone = 4;
  repeated int32 test = 5 [packed=true];
  Profile profile = 6;
}

message AddressBook {
  repeated Person person = 1;
  int32 count = 2 [default = 0];
  Person self = 3;
  int32 version = 4 [default = 1001];
  int32 date = 5;
}
```

lua 测试代码如下：
```lua
-- tutorial.lua
require('xprint')
local pb = require 'pb'
local protoc = require 'protoc'

-- load proto 文件
local proto3 = true -- proto3 开关
local pc = protoc.new()
pc:addpath("proto/") -- 添加 .proto 文件路径
pc.include_imports = true
if proto3 then
    -- 文件路径：proto/addressbook_v3.proto
    pc:loadfile('addressbook_v3.proto')
else
    -- 文件路径：proto/addressbook_v2.proto
    pc:loadfile('addressbook_v2.proto')
end
-- xprint(pc.loaded)


-- 创建默认表
print("\n========= 创建默认表 =========")
--xprint(pb.defaults('tutorial.AddressBook', true))
if not proto3 then
    -- proto2 默认值使用元表方式实现
    pb.option("use_default_metatable")
end
local default_t = assert(pb.decode('tutorial.AddressBook'))
xprint(getmetatable(default_t))
xprint(default_t)
print("default version = ", default_t.version)


-- 编/解码
print("\n========= 编/解码 =========")
local addrbook = {
    person = {
        {name="a", id=1, email="a@qq.com"},
        {name="b", id=2, email="b@qq.com"}
    },
    count = 1,
    self = {name="c", id=3, email="c@qq.com", profile={nick_name="nick_c", icon="c.ico"}}
}
local bytes = assert(pb.encode('tutorial.AddressBook', addrbook))
local data = assert(pb.decode('tutorial.AddressBook', bytes))
xprint(data, data.version)


-- 字段访问
print("\n========= 字段访问 =========")
print("count = ", data.count, rawget(data, "count")) -- 输出： count = 1  1
print("non-existent field = ", data.biubiu, data.self.biubiu) -- 输出：non-existent field =    nil     nil
--print("self = ", myself, rawget(myself, "name")) -- 输出：


-- 数据兼容性测试
-- 首先保存序列化后的数据到 output.data，然后修改 addressbook.proto 中的 version 字段默认值为 [default] = 1111
print("\n========= 数据兼容性 =========")
local w = false -- 读写开关
if w then
    local content = assert(pb.encode('tutorial.AddressBook', data))
    print("encode version = ", data.version) -- 输出：version = 1001
    local f = io.open("output.dat", "w+")
    f:write(content)
    f:flush()
    f:close()
    print("bytes = ", content)
else
    local f = io.open("output.dat", "r")
    local content = f:read('*a')
    f:close()
    local abt = pb.decode("tutorial.AddressBook", content)
    print("decode version = ", abt.version) -- 输出：version = 1001
end
```

### 升级到 proto3
在本次替换 pbc 的过程中顺便升级到了 proto3，当然版本升级并不是必选项，只是 proto3 更加适合我们的项目，对我们后期版本维护更加友好。

对比 proto2，Protobuf v3 有两个我认为比较大的区别：
- proto3 删除了 *required* 及 *optional* 这二个关键字（因为 *required* 违反了 protobuf 的兼容性语义），将这两个域标签抹平，可以认为是在 proto2 中的 *required* 和 *optional* 在 proto3 中都变成了 *optional*，且在 proto3 中无需显式写上 *optional*。
- 移除了 default 选项（在 lua-protobuf 的编译库中保留了该特性，可以自定义默认值），对于基础数据类型（int,string,bool...）来说，它们的默认值是其数据类型的零值，例如：int32 类型的域默认值为 `0`，string 类型的域默认值为空字符串 `""`，这有点像 golang 对于变量的态度。

当然，proto3 还有其他特性，这里不做多的说明，目前项目也未使用到其他的特性，例如 map、oneof 等等。

关于 proto3 移除 *required* 有很多争论，为什么要移除 *required* 是因为它违反了兼容性原则，被定义成 *required* 的字段不能安全的增加和删除。例如，如果向 .proto 定义添加 *required* 字段，则使用旧定义构建的二进制文件将无法解析使用旧定义序列化的数据，因为旧数据中不存在 *required* 字段。因此推荐使用 *optional* 来代替 *required*。在 proto3 中删除了 *required* 后，*optional* 也显得多余，因此 *optional* 也一同被移除。

### 集成与封装
得益于 lua-protobuf 源代码的“短小精湛”，使得它很容易就能集成到 skynet 中，gcc 编译一个动态链接库即可(具体安装流程可查看[官方Wiki](https://github.com/starwing/lua-protobuf/blob/master/README.zh.md))：
```
gcc -O2 -shared -fPIC pb.c -o pb.so
```
然后把编译好的动态库路径添加到 skynet 启动配置中的 `lua_cpath` 中即可使用。

为了更方便使用，我进行了简单的二次封装，主要是优化了默认表的生成过程，原始库中的 `pb.decode(type)` 得到的 lua table 并不会对其中的子消息类型也进行默认表生成逻辑，而只是简单赋值一个空 table，我这里使用了递归的方式，对子消息类型的默认表生成做了支持（暂未支持循环嵌套的消息类型），代码如下：
```lua
function create_default(type)
    local function _default(type)
        local lua_table = pb.decode(type)
        if not lua_table then
            error("lua-protobuf create default fail. type = " .. type)
            return
        end

        for name, tag, subtype in pb.fields(type) do
            print(name, tag, subtype, pb.type(subtype))
            if not lua_table[name] then
                local sname, _, sty = pb.type(subtype)
                if sty =="message" and sname ~= type then
                    -- 只支持 message，且不支持循环嵌套
                    lua_table[name] = _default(subtype)
                end
            end
        end
        return lua_table
    end

    return _default(type)
end
```

我们拿上面的 proto3 中的消息 `AddressBook` 为例，生成一张 *full default lua table*，表结构如下：
```lua
-- test
xprint(create_default("tutorial.AddressBook"))

-- 生成的默认表如下
--[[
{
    ["person"] = { }, --repeated
    ["date"] = 0,
    ["version"] = 1001,
    ["self"] = {
    |   ["email"] = "",
    |   ["test"] = { },
    |   ["id"] = 0,
    |   ["phone"] = { },
    |   ["name"] = "",
    |   ["profile"] = {
    |       ["icon"] = "",
    |       ["nick_name"] = ""
    |   }
    },
    ["count"] = 0
}
]]
```


### 参考
- [官方Wiki](https://github.com/starwing/lua-protobuf/blob/master/README.zh.md)
- [lua-protobuf 使用说明](https://zhuanlan.zhihu.com/p/26014103)
- [Language Guide (proto3)](https://developers.google.com/protocol-buffers/docs/proto3)
- [Protocol Buffer 3学习笔记](https://www.cntofu.com/book/116/index.html)
- [区分 Protobuf 中缺失值和默认值](https://zhuanlan.zhihu.com/p/46603988)
- [Why required and optional is removed in Protocol Buffers 3](https://stackoverflow.com/questions/31801257/why-required-and-optional-is-removed-in-protocol-buffers-3)
- [高性能mysql之慎用BLOB与TEXT](https://www.cnblogs.com/shuaiandjun/p/9684021.html)