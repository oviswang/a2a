# Pouchy 平台自查报告：`pouchy.ai` vs `www.pouchy.ai` 跳转导致 `Authorization` 被剥离 → `/v1/sessions` 对**任何** key 都 401

**报送方**：a2a.fun 集成端（game server，Railway，Node 20，`@pouchy_ai/companion-sdk@0.10.0`）
**结论优先级**：⚠️ **首要怀疑 = apex/www 跳转在服务端 fetch 上丢掉 `Authorization`**（消费方反馈此类 www 问题在平台上**反复出现过多次**）；次要 = `/v1/sessions` 与 `/api/version` 部署/数据源不一致。
**诉求**：请按 §5 清单系统排查平台上所有「apex↔www 跳转」与「同一路由多部署/多数据源」的隐患，不止 `/v1/sessions` 这一处。

---

## 1. 一句话根因假设

`POST https://pouchy.ai/v1/sessions` 若被 **30x 跳转到 `https://www.pouchy.ai/...`（或反向）**，由于这是**跨 origin 跳转**，符合 Fetch 规范的客户端（Node `undici`/浏览器）会在重定向时**删除 `Authorization` 请求头**。于是请求虽然最终到达 `verifySecretKey`，却**不带任何 key** → 一律返回 `401 "invalid or revoked secret key…"`。

这可以**统一解释整条排查里的全部现象**：无论换成哪把 key（有效的、已吊销的、刚新建的），结果都**完全一样**地 401 且是同一句文案——因为 key 根本没送达校验逻辑。

## 2. 已确认的硬事实

**a2a 的请求（完全合约）：**
```
POST https://pouchy.ai/v1/sessions
Authorization: Bearer <pchy_sk_… live，服务端 env，已 .trim()>
Content-Type: application/json
{ "agent": "PY8G8zxqVb76LARCPHUu", "external_user_id": "a2afun_<visitorId>" }
```
- key 指纹：`keyId=pchy_sk_t2TI…W9Sw  keyLen=51  rawLen=51`（长度对、无空格、无截断）。

**平台返回（稳定复现）：**
```
HTTP 401  {"error":"invalid or revoked secret key — this endpoint needs a
project Secret Key (pchy_sk_…) from the dashboard Keys page; admin keys
(pchy_admin_…) and session tokens cannot mint sessions"}
```

**两个自相矛盾的观测（正是"key 没送达"或"部署错位"的指纹）：**

| 观测 | 值 | 矛盾点 |
|---|---|---|
| `GET pouchy.ai/api/version` | `sha=7149900d20`，`deployment=pouchy-7omcpovdw-…vercel.app`，`env=production` | 说修复已上线 |
| `POST pouchy.ai/v1/sessions` 错误文案 | **仍是修复前的 "invalid or revoked …" 老文案** | 但 §4 修复后应返回新文案 "**was revoked**"/或直接 201 → **这个端点没跑 7149900d20** |
| Pouchy 生产自检（Firestore `mtsocial`，project `zBbUAz6SF2NBagAoYVH5`） | `t2TI…W9Sw`：record✔ 指针✔ `revoked:false` **`wouldVerify:true`** | 自检说这把**有效、必 201**，线上却 401 → **线上 `/v1/sessions` 与自检不是同一数据/同一部署** |

**a2a 试过的三把旧 key（现均 revoked，属正常）：**
`pchy_sk_ox_v…YDj4`、`pchy_sk_GbMr…luY8`、`pchy_sk_L4Jp…RuSM` —— 全 revoked，是"删旧建新"循环留下的，**不是本问题主因**。主因是：连**自检判定有效**的 `t2TI…W9Sw` 也 401。

## 3. 为什么锁定 www/apex 跳转（而非 env / 消费方）

- ✅ 消费方合约无误：能收到 `verifySecretKey` **自身**的错误文案，说明请求到达了校验逻辑；key `rawLen=51` 传输干净。
- ✅ env 无误：Railway 里 keyId 已是 `t2TI…W9Sw`（与自检认定的有效 key 一致），长度/无空格都对。
- ✅ 换 key 无用：有效 key 也 401，且文案永远一致 → 强烈指向"**key 在途中被丢弃**"或"**端点读错库/跑错代码**"。
- ⚠️ **消费方明确反馈：平台上 `www`/apex 这类跳转问题此前已多次出现。** 跨 origin 跳转剥离 `Authorization` 恰好能产生"任何 key 都 invalid"的确切症状。

> 关键：即便线上 `/v1/sessions` 已是 `7149900d20`，只要请求在 apex→www 跳转中丢了 `Authorization`，`verifySecretKey` 收到空 key 仍会走"查不到 → invalid …"分支。**所以'老文案'既可能是部署错位，也可能是 auth 被剥离后落到 not-found 分支——两条都请一并排查。**

## 4. 独立复现（脱离 a2a / Railway，任何人可跑）

在任意终端跑（`<KEY>` = 当前有效 key `t2TI…W9Sw` 的完整明文）：

```bash
# ① 看 apex 是否对 POST 发生跳转、Authorization 是否被带到最终 URL
curl -sS -i -X POST https://pouchy.ai/v1/sessions \
  -H "authorization: Bearer <KEY>" -H "content-type: application/json" \
  -d '{"agent":"PY8G8zxqVb76LARCPHUu","external_user_id":"a2afun_test"}'

# ② 直接打 www，看是否结果不同
curl -sS -i -X POST https://www.pouchy.ai/v1/sessions \
  -H "authorization: Bearer <KEY>" -H "content-type: application/json" \
  -d '{"agent":"PY8G8zxqVb76LARCPHUu","external_user_id":"a2afun_test"}'

# ③ 用 -v 观察是否有 301/308，以及重定向后请求头里 authorization 是否还在
curl -v -L -X POST https://pouchy.ai/v1/sessions \
  -H "authorization: Bearer <KEY>" -H "content-type: application/json" \
  -d '{"agent":"PY8G8zxqVb76LARCPHUu","external_user_id":"a2afun_test"}' 2>&1 | grep -iE "location:|authorization:|< HTTP"
```

**判读：**
- ①/② 有一个 `201` 另一个 `401` → **同一路由在 apex/www 行为不一致**，请统一。
- ③ 里出现 `Location: https://www.pouchy.ai/...`（或反向）→ **存在跨 origin 跳转**；`curl -L` 默认会重发但会带上 auth，而 **Node `undici`/浏览器 fetch 会在跨 origin 跳转时删掉 `Authorization`** → 这就是 a2a 侧"任何 key 都 401"的根因。

（a2a 侧已在服务端加了落点日志：失败时打印 `finalUrl` / `redirected` / 命中部署头。若 `redirected=true` 且 `finalUrl` 落到 www，即在消费方侧实证了本假设。）

## 5. 请 Pouchy 系统性自查清单（不止 `/v1/sessions`）

**A. apex ↔ www 跳转（本次首要）**
1. `pouchy.ai` 与 `www.pouchy.ai` 哪个是 canonical？对 **`/v1/*` 这类带 `Authorization` 的 API 路由**，是否存在从非-canonical 域到 canonical 域的 **301/308 跳转**？
2. 若存在：**API 路由不应依赖跨 origin 跳转**。要么两个域都直接服务同一份 API（不跳转），要么在文档/SDK 里把 baseUrl 固定为 canonical 域，避免消费方打到会跳转的那个域。
3. 全站排查：还有哪些**带认证头的 POST/PUT** 路由处在"会跳转"的域上？（跳转剥离 Authorization 会静默产生 401，极难定位——正是本次踩的坑。）

**B. `/v1/sessions` 部署/数据源一致性**
4. `pouchy.ai/v1/sessions` 与 `pouchy.ai/api/version` 是**同一个 Vercel 部署**吗？为何 version 报 `7149900d20`，而 `/v1/sessions` 仍吐**修复前文案**？是否 `/v1/*` 是独立 function/独立 project/被 edge/CDN 缓存了旧版？
5. 线上 `/v1/sessions` 运行时实际连的 **Firestore project** 是不是自检用的 `mtsocial`？直接在**线上端点**（非自检脚本）对 `t2TI…W9Sw` curl 一次，看真实返回与命中的部署。
6. 确认 `7149900d20` 的原子建 key + 自愈 + 拆分文案，**确实部署到了服务 `/v1/sessions` 的那个 target**，而不仅仅是 `/api/version` 那个。

**C. 回归防护**
7. 加一个**端到端探针**：定时用一把已知有效 `pchy_sk_` 对**线上 `pouchy.ai/v1/sessions`（走真实 DNS/CDN/跳转链路）** 铸一次 session，断言 201 且响应带正确部署头——能第一时间抓到"跳转剥离 auth""部署错位""CDN 缓存旧版"这三类问题。

## 6. 消费方侧的对应动作（待你们确认后）

- 若确认是 apex→www 跳转：a2a 会把 `POUCHY_BASE_URL` 固定到**不发生跳转的 canonical 域**，从源头避免 `Authorization` 被剥离。请告知 canonical 域是哪个。
- 若确认是部署/数据源错位：a2a 无需改动，等你们把 `/v1/sessions` 对齐到 `7149900d20` + 正确 Firestore 即可。

---

**一句话**：a2a 用**自检都判定有效**的 key `t2TI…W9Sw` 打 `pouchy.ai/v1/sessions` 仍 401、且是**修复前老文案**。最可能是 **apex↔www 跨 origin 跳转把 `Authorization` 剥离**（此类 www 问题在平台反复出现），其次是 **`/v1/sessions` 部署/数据源与 `/api/version`、与自检不一致**。请按 §5 系统排查所有"带认证头 + 会跳转"的路由，并对齐 `/v1/sessions` 的部署与数据源。keyId（非敏感）= `pchy_sk_t2TI…W9Sw`。
