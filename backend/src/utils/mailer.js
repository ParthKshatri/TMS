/**
 * Transactional email service using Brevo REST API (HTTPS).
 * Designed for environments where SMTP ports are blocked (e.g. Render free tier).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Escapes characters for HTML output to prevent injection attacks.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates email address format.
 */
function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_REGEX.test(email.trim());
}

/**
 * Sends a transactional email using Brevo's v3 HTTP API.
 * Never throws an uncaught error and never leaks sensitive data.
 *
 * @param {Object} params
 * @param {string|{email: string, name?: string}} params.to - Recipient email or object
 * @param {string} params.subject - Subject line
 * @param {string} params.html - HTML email content
 * @param {string} [params.text] - Plaintext email content
 * @returns {Promise<{success: boolean, status?: number, reason?: string}>}
 */
async function sendMail({ to, subject, html, text }) {
  const recipientEmail = typeof to === 'string' ? to.trim() : to?.email?.trim();
  const recipientName = typeof to === 'object' ? to?.name?.trim() : undefined;

  if (!isValidEmail(recipientEmail)) {
    console.warn(`[Mailer] Skipping email: invalid or missing recipient email address (${recipientEmail || 'empty'}).`);
    return { success: false, reason: 'invalid_recipient_email' };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn(`[Mailer] Skipping email to ${recipientEmail}: BREVO_API_KEY is not configured.`);
    return { success: false, reason: 'missing_api_key' };
  }

  const senderEmail = process.env.MAIL_SENDER_EMAIL || 'noreply@tms.local';
  const senderName = process.env.MAIL_SENDER_NAME || 'Task Management System';

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: recipientEmail,
        ...(recipientName ? { name: recipientName } : {})
      }
    ],
    subject: subject || 'Notification',
    htmlContent: html || '<p></p>',
    textContent: text || ''
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error(`[Mailer] Failed to send email to ${recipientEmail}: Brevo API returned status ${response.status}`);
      return { success: false, status: response.status };
    }

    return { success: true };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'Request timed out' : err.message;
    console.error(`[Mailer] Failed to send email to ${recipientEmail}: ${reason}`);
    return { success: false, reason };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sends login credentials email to a newly created employee.
 *
 * @param {Object} params
 * @param {string} params.name - Employee full name
 * @param {string} params.email - Employee login email
 * @param {string} params.password - Plaintext password (in-memory only)
 */
async function sendCredentialsEmail({ name, email, password }) {
  const loginUrl = process.env.APP_LOGIN_URL || `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/login`;
  const recipientName = name || 'Employee';
  const safeName = escapeHtml(recipientName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const safeLoginUrl = escapeHtml(loginUrl);

  const subject = 'Your Account Credentials - Task Management System';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <tr>
      <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Task Management System</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #0f172a;">Welcome, ${safeName}</h2>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
          An administrator has created your employee account. You can log in using the credentials below:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin-bottom: 24px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size: 14px;">
            <tr>
              <td width="90" style="color: #64748b; font-weight: 500;">Email:</td>
              <td style="color: #0f172a; font-weight: 600;">${safeEmail}</td>
            </tr>
            <tr>
              <td width="90" style="color: #64748b; font-weight: 500;">Password:</td>
              <td style="color: #0f172a; font-family: monospace; font-size: 15px; font-weight: 600;">${safePassword}</td>
            </tr>
          </table>
        </div>

        <p style="margin: 0 0 24px; font-size: 13px; line-height: 1.5; color: #64748b;">
          Please store your credentials securely. Passwords are set and maintained by administrators.
        </p>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${safeLoginUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">Log In to Your Account</a>
        </div>

        <p style="margin: 0; font-size: 12px; color: #94a3b8; word-break: break-all;">
          Or copy and paste this link in your browser: <br/>${safeLoginUrl}
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
        This is an automated notification. Please do not reply directly to this email.
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const text = `
Welcome to Task Management System, ${recipientName}!

An administrator has created your employee account. Here are your login credentials:

Email: ${email}
Password: ${password}
Login URL: ${loginUrl}

Please store your credentials securely. Passwords are set and maintained by administrators.

--
This is an automated notification from Task Management System.
`.trim();

  return sendMail({
    to: { email, name: recipientName },
    subject,
    html,
    text
  });
}

/**
 * Sends task assignment notification email to an assigned employee.
 *
 * @param {Object} params
 * @param {Object} params.task - The created task document
 * @param {string} params.assigneeName - Name of the assignee
 * @param {string} params.assigneeEmail - Email of the assignee
 * @param {string} [params.assignedByName] - Name of the user who assigned the task
 */
async function sendTaskAssignmentEmail({ task, assigneeName, assigneeEmail, assignedByName }) {
  const loginUrl = process.env.APP_LOGIN_URL || `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/login`;
  const recipientName = assigneeName || 'Team Member';
  const assigner = assignedByName || 'Administrator';
  const dueDateStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'None';

  const safeRecipientName = escapeHtml(recipientName);
  const safeAssigner = escapeHtml(assigner);
  const safeTitle = escapeHtml(task.title);
  const safeDescription = escapeHtml(task.description && task.description.length > 300
    ? `${task.description.slice(0, 300)}...`
    : task.description || '');
  const safeDueDate = escapeHtml(dueDateStr);
  const safeLoginUrl = escapeHtml(loginUrl);

  const subject = `New Task Assigned: ${task.title}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <tr>
      <td style="background-color: #0f172a; padding: 24px 32px; text-align: left;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Task Management System</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #0f172a;">Hello, ${safeRecipientName}</h2>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
          You have been assigned a new task by <strong>${safeAssigner}</strong>:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; font-size: 16px; color: #0f172a;">${safeTitle}</h3>
          <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.5; color: #334155; white-space: pre-line;">${safeDescription}</p>
          <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            <tr>
              <td width="90" style="color: #64748b; font-weight: 500;">Due Date:</td>
              <td style="color: #0f172a; font-weight: 600;">${safeDueDate}</td>
            </tr>
            <tr>
              <td width="90" style="color: #64748b; font-weight: 500;">Assigned By:</td>
              <td style="color: #0f172a; font-weight: 600;">${safeAssigner}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${safeLoginUrl}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">View Task in TMS</a>
        </div>

        <p style="margin: 0; font-size: 12px; color: #94a3b8; word-break: break-all;">
          Or copy and paste this link in your browser: <br/>${safeLoginUrl}
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
        This is an automated notification. Please do not reply directly to this email.
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const text = `
Hello ${recipientName},

You have been assigned a new task by ${assigner}:

Title: ${task.title}
Description:
${task.description && task.description.length > 300 ? `${task.description.slice(0, 300)}...` : task.description || ''}

Due Date: ${dueDateStr}
Assigned By: ${assigner}
Login URL: ${loginUrl}

--
This is an automated notification from Task Management System.
`.trim();

  return sendMail({
    to: { email: assigneeEmail, name: recipientName },
    subject,
    html,
    text
  });
}

module.exports = {
  sendMail,
  sendCredentialsEmail,
  sendTaskAssignmentEmail,
  escapeHtml
};
