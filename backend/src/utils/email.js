const nodemailer = require('nodemailer');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `Tasky <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};

const sendDueDateReminder = async (user, task) => {
  const dueStr = new Date(task.dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  await sendEmail({
    to: user.email,
    subject: `Reminder: "${task.title}" is due soon`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border-radius:8px;border:1px solid #e5e7eb">
        <h2 style="color:#6366f1">Tasky Reminder</h2>
        <p>Hi ${user.name},</p>
        <p>This is a reminder that your task <strong>"${task.title}"</strong> is due on <strong>${dueStr}</strong>.</p>
        <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:0"><strong>Priority:</strong> ${task.priority}</p>
          <p style="margin:4px 0"><strong>Category:</strong> ${task.category}</p>
          <p style="margin:0"><strong>Status:</strong> ${task.status}</p>
        </div>
        <p>Stay on top of it! Head over to Tasky to get it done.</p>
        <a href="${process.env.CLIENT_URL}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:8px">Open Tasky</a>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendDueDateReminder };
