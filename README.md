# Send File to QQ Email

通过 QQ邮箱 SMTP 发送文件附件的 GitHub Action。

## 使用示例

```yaml
- name: 发送报告到 QQ 邮箱
  uses: jiangood/send-file-to-qq-email@v1
  with:
    file-path: 'output/*.pdf'
    recipient-email: 'boss@qq.com'
    sender-email: 'me@qq.com'
    subject: '每日报告'
  env:
    QQMAIL_AUTH_CODE: ${{ secrets.QQMAIL_AUTH_CODE }}
```

## 输入参数

| 参数 | 必填 | 说明 |
|------|------|------|
| `file-path` | 是 | 文件路径或 glob 通配符（如 `output/*.pdf`） |
| `recipient-email` | 是 | 收件人邮箱 |
| `sender-email` | 是 | 发件人 QQ 邮箱 |
| `subject` | 否 | 邮件主题，默认 `File Attachment` |

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

- 支持通配符匹配多个文件，每个文件单独发送一封邮件
- 无匹配文件时 Action 会标记失败
- SMTP 固定使用 `smtp.qq.com:465`，SSL 加密
- 文件大小受 QQ 邮箱限制（约 25MB）

## 本地开发

```bash
npm install
npm test        # 运行测试
npm run build   # ncc 打包到 dist/
```
