const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // bypass certificate issues if any
      },
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP configuration error:', error);
      } else {
        console.log('SMTP server is ready to send emails');
      }
    });
  }

  async sendInvitationEmail({ email, name, companyName, invitationLink, role }) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: email,
        subject: `Invitation to join ${companyName} - Expense Management System`,
        html: this.getInvitationEmailTemplate({ name, companyName, invitationLink, role }),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Invitation email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending invitation email:', error);
      // Enhanced error logging
      console.error('Failed email details:', { email, name, companyName, invitationLink, role });
      return { success: false, error: error.message };
    }
  }

  getInvitationEmailTemplate({ name, companyName, invitationLink, role }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join ${companyName}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 20px; }
          .container { background-color: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .company-name { color: #6b7280; font-size: 16px; }
          .content { margin-bottom: 30px; }
          .welcome-text { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .role-badge { display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; margin: 10px 0; text-transform: capitalize; }
          .cta-button { display: inline-block; background-color: #2563eb; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; transition: background-color 0.3s; }
          .cta-button:hover { background-color: #1d4ed8; }
          .features { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .features h3 { margin-top: 0; color: #1f2937; }
          .features ul { margin: 0; padding-left: 20px; }
          .features li { margin-bottom: 8px; color: #4b5563; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6b7280; font-size: 14px; }
          .security-note { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💰 Expense Manager</div>
            <div class="company-name">${companyName}</div>
          </div>  
          <div class="content">
            <h1 class="welcome-text">Welcome to the team, ${name}!</h1>
            <p>You've been invited to join <strong>${companyName}</strong> as a <span class="role-badge">${role}</span>.</p>
            <p>This platform will help you manage your business expenses efficiently.</p>
            <div class="features">
              <h3>What you can do:</h3>
              <ul>
                <li>Submit expense reports with receipt uploads</li>
                <li>Track your expense history and status</li>
                <li>View real-time expense analytics</li>
                <li>Collaborate with your team on approvals</li>
                <li>Access mobile-friendly interface</li>
              </ul>
            </div>
            <div style="text-align:center;">
              <a href="${invitationLink}" class="cta-button">Accept Invitation & Set Password</a>
            </div>
            <div class="security-note">
              🔒 This invitation link is secure and expires in 7 days.
            </div>
            <p>If you have any questions, contact your administrator.</p>
          </div>
          <div class="footer">
            This invitation was sent by ${companyName} Expense Management System. If you didn't expect this invitation, ignore this email.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendPasswordResetEmail({ to, name, resetLink }) {
    try {
      const mailOptions = {
        from: `"Expense Management System" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Password Reset - Expense Management System',
        html: this.getPasswordResetEmailTemplate({ name, resetLink }),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  getPasswordResetEmailTemplate({ name, resetLink }) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; color: #333; margin: 0; padding: 20px; }
          .container { background-color: #fff; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .cta-button { display: inline-block; background-color: #dc2626; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .security-note { background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 15px; margin: 20px 0; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">💰 Expense Manager</div>
          </div>
          <div class="content">
            <h1>Password Reset Request</h1>
            <p>Hello ${name},</p>
            <p>We received a request to reset your password.</p>
            <div style="text-align:center;">
              <a href="${resetLink}" class="cta-button">Reset Password</a>
            </div>
            <div class="security-note">
              🔒 This link expires in 1 hour. If you didn't request this reset, ignore this email.
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280;">${resetLink}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
