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
