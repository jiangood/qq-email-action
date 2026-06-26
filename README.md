# Send File to QQ Email

A GitHub Action to send files as email attachments via QQ邮箱 SMTP.

## Usage

```yaml
- name: Send file to QQ Email
  uses: your-org/send-file-to-qq-email@v1
  with:
    file-path: 'output/*.pdf'
    recipient-email: 'recipient@qq.com'
    sender-email: 'yourname@qq.com'
    subject: 'Report'
  env:
    QQMAIL_AUTH_CODE: ${{ secrets.QQMAIL_AUTH_CODE }}
```

## Inputs

| Name | Required | Description |
|------|----------|-------------|
| `file-path` | Yes | File path or glob pattern |
| `recipient-email` | Yes | Recipient email address |
| `sender-email` | Yes | Sender QQ email address |
| `subject` | No | Email subject (default: "File Attachment") |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `QQMAIL_AUTH_CODE` | QQ邮箱 SMTP 授权码 |

## How to Get QQ Mail Auth Code

1. Log in to QQ Mail
2. Go to Settings → Account → POP3/SMTP Service
3. Enable SMTP and generate an authorization code
4. Add the code as a GitHub secret named `QQMAIL_AUTH_CODE`

## Development

```bash
npm install
npm test
npm run build
```
