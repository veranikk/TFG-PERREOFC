/**
 * Provides shared backend infrastructure for mailer.
 * Utilities here are reused across features for configuration, clients, logging or validation.
 */

import nodemailer from 'nodemailer';
import { env } from './env.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await transporter.sendMail({
    from: `Perreo FC <${env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
