# Bug report → Pouchy 平台:`POST /v1/sessions` 拒绝合法的 `pchy_sk_` 密钥（401）

**消费方**：a2a.fun（game server，Railway，Node 20）
**接的 SDK**：`@pouchy_ai/companion-sdk@0.10.0`
**现象**：后端用 owner 的**项目 Secret Key**(`pchy_sk_…`, live)去铸 session，平台稳定返回 **401 invalid or revoked**,导致所有玩家都没有 AI 伴侣。

---

## 1. 后端发出的请求（完全按你们给的合约）

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

## 3. 消费方侧已逐一确认无误（诊断日志佐证）

后端在失败时打印了 key 的**类型前缀 + 长度**（不含密钥本体）：

```
pouchy-session mint failed: 401 {...} (keyPrefix=pchy_sk_ keyLen=<full> agent=PY8G8zxqVb76LARCPHUu)
```

- ✅ **key 类型正确**：`keyPrefix=pchy_sk_`（不是 `pchy_admin_`，也不是 session token）。
- ✅ **key 环境**：dashboard「API 密钥」页显示这把名为 `POUCHY_SECRET_KEY`、环境 **live**、值 `pchy_sk_ox_v…`。
- ✅ **agent 正确**：`PY8G8zxqVb76LARCPHUu`（A2A Fun）。
- ✅ **端点正确**：能收到 mintSession **自身**的校验错误，说明请求确实到达了铸 session 逻辑（不是 404/路由问题、不是 www/非 www 重定向）。
- ✅ **body 正确**：若 body 非法应是 400，而这里是 401（纯密钥校验失败）。

即：请求方法/URL/Header/Body/密钥类型全部符合合约,唯独平台把这把 **live `pchy_sk_`** 判为 invalid/revoked。

## 4. 请 Pouchy 侧排查（mintSession / verifySecretKey 路径）

同一把 `pchy_sk_ox_v…`(live) 对 agent `PY8G8zxqVb76LARCPHUu` 铸 session 被判 401 invalid/revoked,请核对:

1. **密钥是否存在且 active**：这把 `pchy_sk_ox_v…` 在 secret-key 存储里查得到吗?是否被标记 revoked/expired?（dashboard 上它还显示为有效,存储里是否一致?）
2. **密钥 ↔ 项目/agent 关联**：这把 key 所属的**项目**是否就是 agent `PY8G8zxqVb76LARCPHUu` 所在的项目?mintSession 是否要求「key 的 project == agent 的 project」,而这里不匹配 → 被当成"对本 agent 无效"?
3. **环境匹配**：key 是 `live`;`/v1/sessions` + 这个 agent 是否也要求 live?是否存在 live/test 环境错配导致校验失败?
4. **校验逻辑分支**：错误文案把「admin key / session token」和「invalid/revoked」并列在一条里 —— 是否 verifySecretKey 对**合法 `pchy_sk_` 但查库未命中**的情况,错误地走进了这条兜底文案?即真正原因可能是"查不到这把 key",而非类型问题。
5. **哈希/存储**：secret key 是否以哈希存储、比对时算法/盐一致?最近有没有 rotate/迁移导致旧 key 对不上?

## 5. 复现

- 后端(a2a game server, Railway `a2a-production-6008.up.railway.app`)配置 env `POUCHY_SECRET_KEY=<pchy_sk_… live>`、`POUCHY_AGENT_ID=PY8G8zxqVb76LARCPHUu`。
- 前端进游戏 → 后端 `POST https://pouchy.ai/v1/sessions` → 稳定 401。
- 每次玩家进入都可复现(日志里成对出现 `pouchy-session mint failed: 401`)。

## 6. 消费方可配合的验证

- 换一把**全新创建**的 `pchy_sk_`(live)再试:若新 key 也 401 → 基本确认是平台侧 verifySecretKey/项目关联的问题;若新 key 通过 → 旧 key 确被 revoke。
- 需要的话可临时开启更详细的请求回显(不含密钥本体)配合定位。

---

**一句话**:a2a 集成端已按合约核对无误(`pchy_sk_` live + 正确 agent + 正确端点),问题定位在 Pouchy `POST /v1/sessions` 的**密钥校验/项目关联**逻辑 —— 麻烦从"这把 live `pchy_sk_ox_v…` 为何对 agent `PY8G8zxqVb76LARCPHUu` 被判 invalid/revoked"入手。
