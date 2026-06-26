# QQ Email Action Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift core functionality from "send files to QQ email" to "send QQ email with optional attachments", adding `body` and `body-type` inputs.

**Architecture:** Single-file action (`src/main.js`) using `@actions/core` for I/O, `nodemailer` for SMTP, `@actions/glob` for optional file matching. All matched files attach to one email.

**Tech Stack:** Node.js 20, GitHub Actions, nodemailer, Jest

---

### Task 1: Update action.yml

**Files:**
- Modify: `action.yml`

- [ ] **Step 1: Add `body` and `body-type` inputs, make `file-path` optional**

```yaml
name: 'QQ Email Action'
description: 'Send email via QQ邮箱 SMTP with optional attachments'
author: 'Your Org'
branding:
  icon: 'mail'
  color: 'blue'
inputs:
  recipient-email:
    description: 'Recipient email address'
    required: true
  sender-email:
    description: 'Sender QQ email address'
    required: true
  subject:
    description: 'Email subject'
    required: false
    default: 'QQ Email'
  body:
    description: 'Email body content (text or HTML)'
    required: false
  body-type:
    description: 'Body content type: text or html'
    required: false
    default: 'text'
  file-path:
    description: 'File path or glob pattern for attachments (e.g., output/*.pdf)'
    required: false
runs:
  using: 'node20'
  main: 'dist/index.js'
```

- [ ] **Step 2: Commit**

```bash
git add action.yml
git commit -m "feat: add body/body-type inputs, make file-path optional"
```

---

### Task 2: Update src/main.js

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Rewrite main.js with new logic**

`src/main.js`:
```js
const core = require('@actions/core');
const glob = require('@actions/glob');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

async function run() {
  try {
    const recipientEmail = core.getInput('recipient-email', { required: true });
    const senderEmail = core.getInput('sender-email', { required: true });
    const subject = core.getInput('subject') || 'QQ Email';
    const body = core.getInput('body');
    const bodyType = core.getInput('body-type') || 'text';
    const filePath = core.getInput('file-path');

    if (!body && !filePath) {
      core.setFailed('At least one of body or file-path must be provided');
      return;
    }

    const authCode = process.env.QQMAIL_AUTH_CODE;

    const mailOptions = {
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
    };

    if (body) {
      if (bodyType === 'html') {
        mailOptions.html = body;
      } else {
        mailOptions.text = body;
      }
    }

    if (filePath) {
      const globber = await glob.create(filePath);
      const files = await globber.glob();

      if (files.length === 0) {
        core.setFailed(`No files matched: ${filePath}`);
        return;
      }

      mailOptions.attachments = files.map((file) => ({
        filename: path.basename(file),
        content: fs.readFileSync(file),
      }));
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: senderEmail,
        pass: authCode,
      },
    });

    await transporter.sendMail(mailOptions);
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (require.main === module) {
  run();
}

module.exports = run;
```

- [ ] **Step 2: Commit**

```bash
git add src/main.js
git commit -m "feat: rewrite send logic — body first, optional attachments in single email"
```

---

### Task 3: Update Tests

**Files:**
- Modify: `src/__tests__/main.test.js`

- [ ] **Step 1: Rewrite tests for new behavior**

`src/__tests__/main.test.js`:
```js
const core = require('@actions/core');
const glob = require('@actions/glob');
const nodemailer = require('nodemailer');
const fs = require('fs');

jest.mock('@actions/core');
jest.mock('@actions/glob');
jest.mock('nodemailer');

describe('qq-email-action', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    process.env.QQMAIL_AUTH_CODE = 'test-auth-code';
  });

  it('should fail when neither body nor file-path is provided', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Test',
        'body': '',
        'body-type': 'text',
        'file-path': '',
      };
      return inputs[name];
    });

    await require('../main')();

    expect(core.setFailed).toHaveBeenCalledWith(
      'At least one of body or file-path must be provided'
    );
  });

  it('should send email with body as text by default', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Test',
        'body': 'Hello World',
        'body-type': 'text',
        'file-path': '',
      };
      return inputs[name];
    });

    const sendMailMock = jest.fn().mockResolvedValue({ accepted: ['to@qq.com'] });
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await require('../main')();

    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'from@qq.com',
      to: 'to@qq.com',
      subject: 'Test',
      text: 'Hello World',
    });
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: { user: 'from@qq.com', pass: 'test-auth-code' },
    });
  });

  it('should send email with HTML body', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'HTML Test',
        'body': '<h1>Title</h1>',
        'body-type': 'html',
        'file-path': '',
      };
      return inputs[name];
    });

    const sendMailMock = jest.fn().mockResolvedValue({ accepted: ['to@qq.com'] });
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await require('../main')();

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<h1>Title</h1>',
        text: undefined,
      })
    );
  });

  it('should send email with body and attachments', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'With Attachments',
        'body': 'Check attachments',
        'body-type': 'text',
        'file-path': 'reports/*.pdf',
      };
      return inputs[name];
    });

    glob.create.mockResolvedValue({
      glob: jest.fn().mockResolvedValue(['reports/a.pdf', 'reports/b.pdf']),
    });
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('fake'));
    const sendMailMock = jest.fn().mockResolvedValue({ accepted: ['to@qq.com'] });
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await require('../main')();

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'Check attachments',
        attachments: [
          { filename: 'a.pdf', content: Buffer.from('fake') },
          { filename: 'b.pdf', content: Buffer.from('fake') },
        ],
      })
    );
  });

  it('should send email with attachments only (no body)', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Files Only',
        'body': '',
        'body-type': 'text',
        'file-path': 'reports/*.pdf',
      };
      return inputs[name];
    });

    glob.create.mockResolvedValue({
      glob: jest.fn().mockResolvedValue(['reports/report1.pdf']),
    });
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('content'));
    const sendMailMock = jest.fn().mockResolvedValue({ accepted: ['to@qq.com'] });
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await require('../main')();

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [{ filename: 'report1.pdf', content: Buffer.from('content') }],
      })
    );
  });

  it('should fail when no files match glob pattern', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Test',
        'body': '',
        'body-type': 'text',
        'file-path': 'nonexistent/*.pdf',
      };
      return inputs[name];
    });
    glob.create.mockResolvedValue({ glob: jest.fn().mockResolvedValue([]) });

    await require('../main')();

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('No files matched')
    );
  });

  it('should fail when sendMail throws', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Test',
        'body': 'hello',
        'body-type': 'text',
        'file-path': '',
      };
      return inputs[name];
    });

    const sendMailMock = jest.fn().mockRejectedValue(new Error('SMTP error'));
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await require('../main')();

    expect(core.setFailed).toHaveBeenCalledWith('SMTP error');
  });
});
```

- [ ] **Step 2: Run tests to verify**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/main.test.js
git commit -m "test: update tests for new send-email-first design"
```

---

### Task 4: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Rewrite README to reflect new design**

`README.md`:
```markdown
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

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README for new send-email-first design"
```

---

### Task 5: Build and Verify

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All 6 tests pass

- [ ] **Step 2: Build distribution bundle**

Run: `npm run build`
Expected: `dist/index.js` generated successfully
