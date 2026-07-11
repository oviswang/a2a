# Bug report → Pouchy 平台：`POST /v1/sessions` 拒绝**刚新建**的合法 `pchy_sk_` 密钥（401）

**消费方**：a2a.fun（game server，Railway，Node 20）
**接的 SDK**：`@pouchy_ai/companion-sdk@0.10.0`
**现象**：后端用 owner 的**项目 Secret Key**(`pchy_sk_…`, live)去铸 session，平台稳定返回 **401 invalid or revoked**，导致所有玩家都没有 AI 伴侣。**换一把刚在 dashboard 新建的 key 同样 401。**

> **一句话定位**：这不是"旧 key 被 revoke"，也不是消费方合约问题。**一把刚创建几秒的 live `pchy_sk_` 也被判 invalid/revoked** → 问题在 Pouchy 侧「dashboard 建 key 的**写路径**」与「`/v1/sessions` 校验 key 的**读路径**」不一致。请从这两条路径的存储/哈希/项目作用域是否一致入手。

---

## 1. 后端发出的请求（完全按合约）

```
POST https://pouchy.ai/v1/sessions
Authorization: Bearer <POUCHY_SECRET_KEY>          # pchy_sk_… (live)，服务端 env，未下发前端
Content-Type: application/json

{
  "agent": "PY8G8zxqVb76LARCPHUu",                 # A2A Fun 的 Agent id
  "external_user_id": "a2afun_<visitorId>"         # visitorId 已 sanitize 成 [A-Za-z0-9_]，长度 ≤48
}
```

- key 在发送前做了 `.trim()`（排除尾随空格/换行）。
- 期望：`201 { session_token, expires_in, instance }`。

## 2. 平台实际返回

```
HTTP 401
{"error":"invalid or revoked secret key — this endpoint needs a project
Secret Key (pchy_sk_…) from the dashboard Keys page; admin keys
(pchy_admin_…) and session tokens cannot mint sessions"}
```

## 3. 为什么可以断定「消费方没问题」

后端在失败时打印**非密钥指纹**（首 12 + 末 4 字符 = dashboard 显示的 key id，+ 精确长度 + 未 trim 的原始长度）：

```
pouchy-session mint failed: 401 {…} (keyId=pchy_sk_XXXX…YYYY keyLen=51 rawLen=51 agent=PY8G8zxqVb76LARCPHUu)
```

- ✅ **能收到 `verifySecretKey` 自身那句特定文案** → 请求已穿过路由、穿过 www/非-www 重定向、带着完整 `Bearer pchy_sk_…` 到达**铸 session 的密钥校验分支**。若是消费方任一环节出错，应是 404 / 400 / 或"admin key"那句，而不是这句。
- ✅ **key 类型正确**：`keyPrefix=pchy_sk_`（非 `pchy_admin_`、非 session token）。
- ✅ **key 长度正确**：`keyLen=51`、`rawLen=51`（`pchy_sk_` 8 + base64url(32B) 43 = 51，未截断、无空格）。
- ✅ **agent 正确**：`PY8G8zxqVb76LARCPHUu`。而且 401 是**纯密钥校验失败**——若是 agent/body 问题应为 404/400，说明校验在读到 agent 之前就已失败。

即：请求方法/URL/Header/Body/密钥类型/长度全部符合合约，**唯独平台把这把 live `pchy_sk_` 判为 invalid/revoked。**

## 4. 判别性实验（本次新增的关键事实）

| # | 试的 key | 来源 | 结果 |
|---|---|---|---|
| 1 | `pchy_sk_ox_v…`（dashboard 显示 live、有效） | dashboard 现存 | 401 |
| 2 | `pchy_sk_GbMr…luY8`（51 字符，格式合格） | 之前 env 里的 | 401 |
| 3 | **`pchy_sk_…RuSM`（51 字符，dashboard 刚新建）** | **新建几秒** | **401** |

**第 3 行是决定性的**：一把刚创建的 live key 不可能"被 revoke"。它仍被 `verifySecretKey` 判为查不到/已撤销 → **dashboard 的建 key 写入 与 `/v1/sessions` 的查 key 读取，看的不是同一份数据。**

## 5. 请 Pouchy 侧核对（`mintSession` / `verifySecretKey` 路径）

按"写路径 vs 读路径不一致"这条主线排查：

1. **同库同表**：dashboard「新建 Secret Key」写入的表/集合，与 `/v1/sessions` 里 `verifySecretKey` 查询的表/集合，是否是**同一个**？（最常见：建 key 写进 A，校验读的是 B。）
2. **哈希/编码一致**：secret key 若以 hash 存储，建 key 时的哈希算法/盐/编码，与校验时**逐字节一致**吗？最近有没有 rotate/迁移导致新旧不一致？
3. **环境（live/test）作用域**：建 key 落在哪个 env 分区，`/v1/sessions` 又在哪个 env 分区查？dashboard 显示 live，校验是否误查了 test（或反之）？
4. **项目/agent 作用域**：`verifySecretKey` 是否要求「key.project == 请求 agent 的 project」？若 key 与 agent `PY8G8zxqVb76LARCPHUu` 不在同一 project，会不会被兜底成"invalid/revoked"（而非更准确的"key 与 agent 不匹配"）？
5. **错误文案兜底**：把「admin key / session token」与「invalid/revoked」写在同一句里 —— 是否 `verifySecretKey` 对**合法 `pchy_sk_` 但查库未命中**的情况，错误地走进了这条兜底文案？真正原因很可能是"查不到这把 key"。

**最快的自检**：在 Pouchy 侧直接对刚新建的这把 key 跑一次 `verifySecretKey(rawKey)`，看它返回 null 还是命中；再和 dashboard 建 key 的写入代码逐字段对比存的是什么、怎么存的。

## 6. 复现

- 后端（a2a game server, Railway `a2a-production-6008.up.railway.app`）配置 env `POUCHY_SECRET_KEY=<pchy_sk_… live>`、`POUCHY_AGENT_ID=PY8G8zxqVb76LARCPHUu`。
- 前端进游戏 → 后端 `POST https://pouchy.ai/v1/sessions` → 稳定 401（日志里成对出现 `pouchy-session mint failed: 401`，`keyId` 即被拒 key 的指纹）。
- **换刚新建的 key 仍复现** → 排除"旧 key 失效"。

---

**给 Pouchy 端的一句话**：a2a 集成端合约无误（`pchy_sk_` live + 正确 agent + 正确端点，且能收到 `verifySecretKey` 自身的校验错误）。**一把 dashboard 刚新建的 live `pchy_sk_` 也被 `/v1/sessions` 判 invalid/revoked** —— 请核对「dashboard 建 key 的写路径」与「`/v1/sessions` 校验 key 的读路径」是否落在同一存储/哈希/env/project 作用域。
