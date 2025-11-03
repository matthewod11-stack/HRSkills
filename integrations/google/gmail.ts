import { google } from 'googleapis';
import { googleClient } from './client';
import { EmailParams } from './types';

const gmail = google.gmail({ version: 'v1', auth: googleClient.getAuth() });

export async function sendEmail(params: EmailParams) {
  const recipients = Array.isArray(params.to) ? params.to.join(',') : params.to;

  const message = [
    `From: ${params.from || process.env.GOOGLE_ADMIN_EMAIL}`,
    `To: ${recipients}`,
    `Subject: ${params.subject}`,
    `Content-Type: text/${params.html ? 'html' : 'plain'}; charset=utf-8`,
    '',
    params.body
  ].join('\n');

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
}
