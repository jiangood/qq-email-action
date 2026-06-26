const core = require('@actions/core');
const glob = require('@actions/glob');
const nodemailer = require('nodemailer');
const fs = require('fs');

jest.mock('@actions/core');
jest.mock('@actions/glob');
jest.mock('nodemailer');

describe('send-file-to-qq-email', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should fail when no files match the glob pattern', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'file-path': 'nonexistent/*.pdf',
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Test',
      };
      return inputs[name];
    });
    glob.create.mockResolvedValue({ glob: jest.fn().mockResolvedValue([]) });

    await require('../main')();

    expect(core.setFailed).toHaveBeenCalledWith(
      expect.stringContaining('No files matched')
    );
  });

  it('should send email when files match', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'file-path': 'reports/*.pdf',
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Test Subject',
      };
      return inputs[name];
    });
    glob.create.mockResolvedValue({
      glob: jest.fn().mockResolvedValue(['reports/report1.pdf']),
    });

    const sendMailMock = jest.fn().mockResolvedValue({ accepted: ['to@qq.com'] });
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('fake content'));
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await require('../main')();

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: 'from@qq.com',
        pass: undefined,
      },
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'from@qq.com',
        to: 'to@qq.com',
        subject: 'Test Subject',
      })
    );
  });

  it('should fail when sendMail throws', async () => {
    core.getInput.mockImplementation((name) => {
      const inputs = {
        'file-path': 'reports/*.pdf',
        'recipient-email': 'to@qq.com',
        'sender-email': 'from@qq.com',
        'subject': 'Test',
      };
      return inputs[name];
    });
    glob.create.mockResolvedValue({
      glob: jest.fn().mockResolvedValue(['reports/report1.pdf']),
    });
    jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('fake content'));

    const sendMailMock = jest.fn().mockRejectedValue(new Error('SMTP error'));
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

    await require('../main')();

    expect(core.setFailed).toHaveBeenCalledWith('SMTP error');
  });
});
