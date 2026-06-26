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
