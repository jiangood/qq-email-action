const core = require('@actions/core');
const glob = require('@actions/glob');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

async function run() {
  try {
    const filePath = core.getInput('file-path', { required: true });
    const recipientEmail = core.getInput('recipient-email', { required: true });
    const senderEmail = core.getInput('sender-email', { required: true });
    const subject = core.getInput('subject') || 'File Attachment';
    const authCode = process.env.QQMAIL_AUTH_CODE;

    const globber = await glob.create(filePath);
    const files = await globber.glob();

    if (files.length === 0) {
      core.setFailed(`No files matched: ${filePath}`);
      return;
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

    for (const file of files) {
      const fileName = path.basename(file);
      const fileContent = fs.readFileSync(file);

      await transporter.sendMail({
        from: senderEmail,
        to: recipientEmail,
        subject: subject,
        attachments: [
          {
            filename: fileName,
            content: fileContent,
          },
        ],
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

if (require.main === module) {
  run();
}

module.exports = run;
