# Aicoo Skills — 新用户 Onboarding 测试

在支持 skill 的 agent 里测(Claude Code / Codex）。找一个**没登录过 Aicoo 的账号/环境**测新用户。

> ⚠️ **装完要重启**：Codex 等 runtime 装 skill 后**要重启 / 开新对话**才会加载 skill。
> 所以顺序是：**装 → 重启/开新对话 → 说 "onboard aicoo"**。
> 装完当前对话里 agent 还读不到 skill，不 onboard 是正常的——重启后再测。

---

## 期待流程（重启后一句话触发应该发生什么）

重启/开新对话后，对 agent 说一句 **"onboard aicoo"**（或"帮我 onboard aicoo，一步步中文带我做"），然后：

1. **登录**：agent **自己运行登录脚本** → 浏览器**自动弹出 Aicoo 授权页**，并且 agent 在回复里**给出一个可点击的登录链接**（防没弹出）。你点链接 → 登录（新用户在这一屏用邮箱/Google 注册）→ 点 **Approve**。全程**不需要**去找 API key、不需要在终端里手动输验证码。
2. **建记忆**：agent **问你从哪 build memory**（当前 repo / 指定文件夹 / Notion·Google Docs / 直接问你几个问题），然后把你的信息写进 agent 记忆。
3. **分享**：agent 生成一个 **`https://www.aicoo.io/a/<token>`** 链接——别人打开就能问你的 agent。
4. **（团队）邀请**：agent 给出**邀请链接** 或 **一段"复制即 onboarding"的 prompt**（含你的用户名），队友复制即可自动装 skill + 登录 + 连接你。

---

## 测试步骤（照做，勾对错）

| # | 操作 | 应该看到 | ✅/❌ |
|---|------|----------|------|
| 1 | 装 skill：`npx skills add Aicoo-Team/AICOO-Skills`（或 agent 自己装） | 安装成功 | |
| 2 | 对 agent 说"帮我 onboard aicoo" | agent **运行登录脚本**，回复里**有可点击登录链接**，浏览器弹出授权页 | |
| 3 | — | agent **没有**让你去"注册/输验证码/找 API key" | |
| 4 | 点链接 → 登录/注册 → Approve | 终端提示 **Signed in / 已登录** | |
| 5 | 跟着 agent build memory | agent **问你数据来源**，然后写入记忆 | |
| 6 | 让 agent"搜一下我的记忆" | 能搜到刚写进去的内容 | |
| 7 | 让 agent"分享我的 agent" | 返回一个 `aicoo.io/a/<token>` 链接 | |
| 8 | 浏览器打开该链接，问 agent 一个关于你的问题 | agent 用刚建的记忆回答 | |
| 9 | （团队）"邀请我的队友" | 给出**邀请链接** + **复制即 onboarding 的 prompt** | |

---

## 报 bug 请附上

- agent runtime（Claude Code / Codex / 其它）+ 本地还是云端
- 卡在第几步、agent 原话截图
- 期待 vs 实际

**已知边界**：① agent 在**云端沙箱**里可能收不到本地回调 → 应自动走 `--manual`（浏览器显示 code 贴回终端）；② 老用户（已登录+已授权过）第 4 步可能**秒过**，直接 Signed in，属正常。
