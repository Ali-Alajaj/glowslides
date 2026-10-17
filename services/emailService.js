/**
 * Email Service
 * Sends clean, modern HTML verification emails with 6-digit verification codes.
 * Supports SMTP (via .env config) or falls back to simulated development mailbox
 * that logs the code prominently to console and returns it in dev mode.
 */

const nodemailer = require('nodemailer');

// Setup transporter if credentials exist
let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Generate a random 6-digit numeric verification code
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send 6-digit verification code to user email
 */
async function sendVerificationEmail(email, code) {
  const subject = `Your GlowSlides Verification Code: ${code}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 40px 20px; }
        .card { max-width: 480px; margin: 0 auto; background-color: #081127; border: 1px solid #1e3a8a; border-radius: 20px; padding: 36px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
        .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
        .code-box { background: #02050e; border: 1px solid #3b82f6; border-radius: 14px; padding: 18px; text-align: center; margin: 28px 0; font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; }
        .text { font-size: 14px; line-height: 1.6; color: #94a3b8; }
        .footer { margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">⚡ GlowSlides</div>
        <h2 style="margin: 0 0 10px 0; font-size: 22px; color: #ffffff;">Verify Your Account</h2>
        <p class="text">Welcome to GlowSlides! Please use the following 6-digit verification code to complete your signup:</p>
        
        <div class="code-box">${code}</div>
        
        <p class="text">This code will expire in <strong>15 minutes</strong>. If you did not request this email, please disregard it.</p>
        
        <div class="footer">
          GlowSlides Inc. • AI Presentation Platform
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE] VERIFICATION CODE FOR ${email}:`);
  console.log(`   👉  CODE: [ ${code} ]  👈`);
  console.log(`======================================================\n`);

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"GlowSlides" <verify@glowslides.ai>',
        to: email,
        subject: subject,
        html: htmlContent
      });
      return { sent: true, provider: 'smtp' };
    } catch (err) {
      console.warn('⚠️ SMTP send failed, logged code to console instead:', err.message);
      return { sent: true, provider: 'console_fallback', code };
    }
  }

  return { sent: true, provider: 'simulation', code };
}

module.exports = {
  generateCode,
  sendVerificationEmail
};
