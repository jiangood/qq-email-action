# QQ Email Action

通过 QQ邮箱 SMTP 发送邮件（支持纯文本、HTML 及附件）的 GitHub Action。

## 使用示例

### 纯文本邮件

```yaml
- name: 发送通知
  uses: jiangood/qq-email-action@v1
  with:
    recipient-email: 'boss@qq.com'
    sender-email: 'me@qq.com'
    subject: '构建完成'
    body: '项目已成功构建。'
  env:
    QQMAIL_AUTH_CODE: ${{ secrets.QQMAIL_AUTH_CODE }}
```

### HTML 邮件带附件

```yaml
- name: 发送报告
  uses: jiangood/qq-email-action@v1
  with:
    recipient-email: 'boss@qq.com'
    sender-email: 'me@qq.com'
    subject: '每日报告'
    body: '<h1>报告摘要</h1><p>详见附件</p>'
    body-type: 'html'
    file-path: 'output/*.pdf'
  env:
    QQMAIL_AUTH_CODE: ${{ secrets.QQMAIL_AUTH_CODE }}
```

## 输入参数

| 参数 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `recipient-email` | 是 | 收件人邮箱 | — |
| `sender-email` | 是 | 发件人 QQ 邮箱 | — |
| `subject` | 否 | 邮件主题 | `QQ Email` |
| `body` | 否 | 邮件正文（纯文本或 HTML） | — |
| `body-type` | 否 | 正文类型：`text` 或 `html` | `text` |
| `file-path` | 否 | 附件路径或 glob 通配符 | — |

> `body` 和 `file-path` 至少提供一个，否则 Action 会标记失败。

## 环境变量

| 变量 | 说明 |
|------|------|
| `QQMAIL_AUTH_CODE` | QQ邮箱 SMTP 授权码 |

## 获取 QQ 邮箱授权码

1. 登录 QQ 邮箱
2. 进入 **设置 → 账户 → POP3/SMTP 服务**
3. 开启 SMTP 服务，生成授权码
4. 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加 `QQMAIL_AUTH_CODE`

## 行为说明

- 如果提供 `file-path`，所有匹配的文件作为**同一封邮件**的多个附件发送
- 无匹配文件时 Action 会标记失败
- SMTP 固定使用 `smtp.qq.com:465`，SSL 加密
- 文件大小受 QQ 邮箱限制（约 25MB）

## 本地开发

```bash
npm install
npm test        # 运行测试
npm run build   # ncc 打包到 dist/
```
