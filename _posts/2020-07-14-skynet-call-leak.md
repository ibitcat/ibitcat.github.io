---
title:  "解决skynet中call引起的“数据泄露”的问题"
date: 2020-07-14
tag:
- skynet
---

众所周知，***call*** 是 skynet 中最容易滋生 bug 的地方，需要格外小心小心再消息，本文所介绍的也只是其中一个问题，以及我个人的一种解决方案。

## 问题分析

一般游戏服务器中，一类游戏实体都会用一个专门管理器进行统一管理，最常见的就是 `plr_mgr`，它管理着登录到该节点的所有玩家实体，大致的实现如下：

```lua
-- plr_mgr.lua
-- 玩家实体管理器

local plr_mgr = {}
plr_mgr.plrs = {}

function plr_mgr.addPlayer(plr)
    plr_mgr.plrs[plr.id] = plr
end

function plr_mgr.getPlayer(id)
    return plr_mgr.plrs[id]
end

function plr_mgr.delPlayer(id)
    local plr = plr_mgr.getPlayer(id)
    if plr then
        saveDB(plr) --玩家数据存库

        plr_mgr.plrs[id] = nil
    end
end

return plr_mgr
```

而一组游戏服都会由多个节点组成，且节点之间一定会存在相会调用的情况，假设现在有两个 skynet 节点（即进程）：`user`进程负责管理已经登录的玩家；`world`进程为世界中心节点，负责一些玩家公共关系的玩法，例如工会系统。

此时如果一个玩家 A 向`world`上的某一个工会发起加入工会的请求，且目标工会自动允许加入，我们用代码简单描述这个过程：

```lua
function user2world_join_league(plr_id, league_id)
    local plr = plr_mgr.getPlayer(plr_id)
    if plr then
        -- call world 节点的 league 服务
        local ok = skynet.call(world, ".league", ...)

        -- call 返回，可能 plr 已经不存在于 plrs 中了
        if ok then
            -- 允许加入工会
            plr._league_id = league_id
        end
    end
end
```

对于上面的代码，一般情况是没有问题的，但是若在 `skynet.call` 请求发出去后且在 call 返回前，玩家下线入库且玩家实例对象从 `plrs` 中删除了，等到 call 真正返回后，虽然看上去 call 协程内的 plr 的 `_league_id` 确实更新了，但是 plr 已经没有机会触发入库逻辑了，也就是说出现玩家“数据泄露”（或称“数据丢档”），如果涉及跟玩家收益相关的 call 也发生这样的数据丢失，对于一款游戏来说是非常危险的，可能造成玩家口碑崩坏。

## 解决方案

从上面我们很明确知道了问题症结所在：**怎么确保 call 返回后实体对象还可用？**

知道了问题就可以“对症下药”了，最简单粗暴的解决办法就是在 call 之后再重新 `get` 一次，还是上面的例子，对其进行一些小修改：
```lua
function user2world_join_league(plr_id, league_id)
    local plr = plr_mgr.getPlayer(plr_id)
    if plr then
        -- call world 节点的 league 服务
        local ok = skynet.call(world, ".league", ...)

        -- call 返回，可能 plr 已经不存在于 plrs 中了
        if ok then
            -- 允许加入工会
            plr = plr_mgr.getPlayer(plr_id) --再次get，检查plr是否有效
            if plr then
                plr._league_id = league_id
            end
        end
    end
end
```

不过这种处理很是丑陋且每一处 call 之后都需要检查，如果稍微不注意可能会忘记检查，这种方案肯定是不可取的。那有没有其他更好的方式，可以不用太多关注 call 之后的检查，减少心里负担呢？我个人想到两种解决方案：**引用计数**和**包装法**。

### 引用计数

这种方式有点类似“垃圾回收”，在 call 前实体对象的引用次数 `+1`，call 返回后引用次数 `-1`，且在玩家下线入库时检查引用计数是否等于 0，若大于 0 则表示还有 call 没有返回，需要继续等待，直到玩家的所有call都成功返回后才进行下线入库操作。大概的处理方式如下：
```lua
function plr_mgr.delPlayer(id)
    local plr = plr_mgr.getPlayer(id)
    if plr and (plr.__ref or 0)==0 then --引用计数为0则入库
        saveDB(plr) --玩家数据存库

        plr_mgr.plrs[id] = nil
    end
end

function _incRef(plr)
    plr.__ref = (plr.__ref or 0) + 1
end

function _decRef(plr)
    plr.__ref = math.max((plr.__ref or 0) - 1, 0)
end

function user2world_join_league(plr_id, league_id)
    local plr = plr_mgr.getPlayer(plr_id)
    if plr then
        _incRef(plr)

        -- call world 节点的 league 服务
        local ok = skynet.call(world, ".league", ...)

        -- call 返回
        _decRef(plr)
        if ok then
            -- 允许加入工会
            plr._league_id = league_id
        end
    end
end
```

虽然这种方式能够一定程度上解决数据丢档的问题，但是在具体编码时还是要“侵入式”的写很多维护引用计数的代码。不过可以使用 `lua 5.4` 的**close变量**(`To-be-closed Variables`)来简化这些引用计数的流程。

```lua
-- 使用lua 5.4 的close 变量
function plr_mgr.addPlayer(plr)
    setmetatable(plr, {
        __close = function(t, err)
            t.__ref = math.max((t.__ref or 0) - 1, 0)
        end
    })
    plr_mgr.plrs[plr.id] = plr
end

function plr_mgr.getPlayerWithRef(id)
    local plr = plr_mgr.plrs[id]
    if plr then
        plr.__ref = (plr.__ref or 0) + 1
        return plr
    end
end

function user2world_join_league(plr_id, league_id)
    local plr <close> = plr_mgr.getPlayerWithRef(plr_id)
    if plr then
        -- call world 节点的 league 服务
        local ok = skynet.call(world, ".league", ...)
        if ok then
            -- 允许加入工会
            plr._league_id = league_id
        end
    end
end
```

### 包装法

我个人更推荐这种做法，结合 `__index` 和 `__newindex` 元方法，我们把真正的实体对象再进行一次包装，当 call 返回后，若真实对象被删除，包装体的索引操作就会报错，从而禁止 call 修改已经不在实体管理器 `mgr` 中的实体的数据。具体实现如下：
```lua
function plr_mgr.addPlayer(plr)
    local wrapper = setmetatable({__plr=plr}, {
        __index = function(t, k)
            local player = rawget(t, "__plr")
            assert(player, "player maybe destoryed!")
            return player[k]
        end,
        __newindex = function(t, k, v)
			local player = rawget(t, "__plr")
			assert(player, "player maybe destoryed!")
			player[k] = v
        end,
        __pairs = function(t)
            local player = rawget(t, "__plr")
            assert(player, "player maybe destoryed!")
            return pairs(player)
        end
    })
    plr_mgr.plrs[plr.id] = wrapper
end

function plr_mgr.delPlayer(id)
    local wrapper = plr_mgr.getPlayer(id)
    if wrapper then
        saveDB(wrapper) --玩家数据存库

        rawset(wrapper, "__plr", nil)
        plr_mgr.plrs[id] = nil
    end
end
```
这种方式不仅解决了玩家“数据丢档”的问题，也不需要对 call 逻辑的代码有额外的处理，减少心智负担。不过可能会在玩家下线入库操作后，出现很多 call 返回后的 `assert` 错误，因此可以对上面的处理再进行一次优化：我们把包装体和真实对象分开存放，玩家下线只是把其包装体的引用删除，而真实对象则延迟一段事件后再删除并**设置为不可用**，若玩家又快速上线，则直接使用真实对象创建包装体，跳过了读数据库的操作。

例如：玩家下线后，立即把玩家的包装体删除，然后玩家在 5 分钟后依然没有操作（登录）则认为玩家已经完全登出游戏，此时再从管理器中删除玩家真实对象的引用，若玩家在 5 分钟内又重新上线，则使用管理器中还存在的真实对象来创建包装体。

具体实现如下：
```lua
local plr_mgr = {}
plr_mgr._id2plr = {}
plr_mgr._id2wrapper = {}

function plr_mgr.loadPlayer(id)
    local plr = load_db(id) -- 去数据库load玩家
    return plr
end

function plr_mgr.addPlayer(id)
    local plr = plr_mgr._id2plr[id]
    if not plr then
        plr = plr_mgr.loadPlayer(id)
    end

    local wrapper = setmetatable({__plr=plr}, {
        __mode = "kv",
        __index = function(t, k)
            local player = rawget(t, "__plr")
            assert(player and player.__isvalid, "player maybe destoryed!")
            return player[k]
        end,
        __newindex = function(t, k, v)
			local player = rawget(t, "__plr")
			assert(player and player.__isvalid, "player maybe destoryed!")
			player[k] = v
        end,
        __pairs = function(t)
            local player = rawget(t, "__plr")
            assert(player, "player maybe destoryed!")
            return pairs(player)
        end
    })

    plr.__isvalid = true
    plr_mgr._id2plr[id] = plr
    plr_mgr._id2wrapper[id] = wrapper
end

function plr_mgr.getPlayer(id)
    return plr_mgr._id2plr[id]
end

-- 在有 call 的逻辑中，使用该接口获取包装体
function plr_mgr.getWrapper(id)
    return plr_mgr._id2wrapper[id]
end

-- 玩家下线
function plr_mgr.logoutPlayer(id)
    local wrapper = plr_mgr.getWrapper(id)
    if wrapper then
        local plr = plr_mgr.getPlayer(id)
        saveDB(plr) --玩家数据存库

        plr_mgr._id2wrapper[id] = nil
    end
end

-- 玩家完全登出
function plr_mgr.delPlayer(id)
    local plr = plr_mgr.getPlayer(id)
    if plr then
        plr.__isvalid = -1
        saveDB(plr) --玩家数据存库

        if plr.__isvalid == -1 then
            plr.__isvalid = nil
            plr_mgr._id2plr[id] = nil
        end
    end
end

return plr_mgr
```