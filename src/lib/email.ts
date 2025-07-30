import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
	process.env.EMAIL_FROM || "Danbing <noreply@transactional.danbing.ai>";

// Shared email template wrapper
const emailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Danbing</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header with logo and mascot -->
    <div style="background: linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 20px 20px;">
      <div style="display: inline-block;">
        <img src="https://static.danbing.ai/danbing.png" alt="Danbing Mascot" style="width: 60px; height: 60px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); vertical-align: middle; margin-right: 16px;">
        <div style="display: inline-block; vertical-align: middle;">
          <span style="font-size: 32px; font-weight: bold; color: #ffffff; letter-spacing: -0.5px;">Danbing</span>
          <span style="font-size: 14px; font-weight: 600; color: #f7cc48; background-color: rgba(247,204,72,0.2); padding: 4px 12px; border-radius: 20px; margin-left: 8px; vertical-align: middle;">AI</span>
        </div>
      </div>
    </div>
    
    <!-- Content area -->
    <div style="padding: 40px 40px 20px 40px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 30px 40px; margin-top: 40px; border-top: 1px solid #e9ecef;">
      <div style="text-align: center; margin-bottom: 20px;">
        <a href="${process.env.NEXTAUTH_URL}" style="color: #6c757d; text-decoration: none; font-size: 14px; margin: 0 10px;">Home</a>
        <span style="color: #dee2e6;">•</span>
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="color: #6c757d; text-decoration: none; font-size: 14px; margin: 0 10px;">Dashboard</a>
        <span style="color: #dee2e6;">•</span>
        <a href="${process.env.NEXTAUTH_URL}/help" style="color: #6c757d; text-decoration: none; font-size: 14px; margin: 0 10px;">Help</a>
      </div>
      
      <div style="text-align: center; color: #6c757d; font-size: 12px; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">
          © 2024 Danbing. Master Traditional Chinese with AI-powered learning.
        </p>
        <p style="margin: 0;">
          You're receiving this email because you signed up for Danbing.
          <br>
          <a href="${process.env.NEXTAUTH_URL}/settings/notifications" style="color: #6c757d; text-decoration: underline;">Manage email preferences</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export async function sendWelcomeEmail(email: string, name: string) {
	try {
		const data = await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: "Welcome to Danbing! 🎉",
			html: emailTemplate(`
				<h1 style="color: #0d1117; font-size: 28px; margin: 0 0 16px 0;">Welcome to Danbing, ${name}! 👋</h1>
				
				<p style="font-size: 16px; color: #495057; line-height: 1.6; margin: 0 0 24px 0;">
					We're thrilled to have you join our AI-powered Traditional Chinese learning community! 
					Get ready to master Chinese characters with our innovative flash card system.
				</p>
				
				<div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
					<h2 style="color: #0d1117; font-size: 20px; margin: 0 0 16px 0;">🚀 Here's how to get started:</h2>
					<ul style="font-size: 16px; color: #495057; line-height: 1.8; margin: 0; padding-left: 20px;">
						<li style="margin-bottom: 8px;">📚 <strong>Import your first deck</strong> - Upload CSV files with Chinese characters</li>
						<li style="margin-bottom: 8px;">✨ <strong>AI enrichment</strong> - Watch as we add images, audio, and meanings automatically</li>
						<li style="margin-bottom: 8px;">🎯 <strong>Start learning</strong> - Use our science-based flash card sessions</li>
						<li style="margin-bottom: 8px;">📊 <strong>Track progress</strong> - Monitor your learning with detailed analytics</li>
					</ul>
				</div>
				
				<div style="text-align: center; margin: 32px 0;">
					<a href="${process.env.NEXTAUTH_URL}/dashboard" 
					   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f7cc48 0%, #f59e0b 100%); 
							  color: #0d1117; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;
							  box-shadow: 0 4px 12px rgba(247, 204, 72, 0.3); transition: all 0.3s;">
						Start Learning Now
					</a>
				</div>
				
				<div style="background-color: #e8f4fd; border-left: 4px solid #0066ff; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
					<p style="margin: 0; font-size: 14px; color: #0066ff;">
						<strong>💡 Pro tip:</strong> Start with our pre-made "Common Characters" deck to get familiar with the system!
					</p>
				</div>
			`),
		});

		return { success: true, data };
	} catch (error) {
		console.error("Failed to send welcome email:", error);
		return { success: false, error };
	}
}

export async function sendVerificationEmail(email: string, token: string) {
	const verifyUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

	try {
		const data = await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: "Verify your Danbing account 📧",
			html: emailTemplate(`
				<h1 style="color: #0d1117; font-size: 28px; margin: 0 0 16px 0;">Verify your email address</h1>
				
				<p style="font-size: 16px; color: #495057; line-height: 1.6; margin: 0 0 24px 0;">
					Thanks for signing up for Danbing! Please confirm your email address to get started with your Chinese learning journey.
				</p>
				
				<div style="text-align: center; margin: 32px 0;">
					<a href="${verifyUrl}" 
					   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0066ff 0%, #0052cc 100%); 
							  color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;
							  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);">
						Verify Email Address
					</a>
				</div>
				
				<div style="background-color: #fff3cd; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
					<p style="margin: 0 0 8px 0; font-size: 14px; color: #856404;">
						<strong>⏰ This link expires in 24 hours</strong>
					</p>
					<p style="margin: 0; font-size: 14px; color: #856404;">
						If the button doesn't work, copy and paste this link into your browser:
					</p>
					<p style="margin: 8px 0 0 0; font-size: 12px; color: #0066ff; word-break: break-all;">
						${verifyUrl}
					</p>
				</div>
				
				<p style="font-size: 14px; color: #6c757d; margin: 24px 0 0 0;">
					If you didn't create an account with Danbing, you can safely ignore this email.
				</p>
			`),
		});

		return { success: true, data };
	} catch (error) {
		console.error("Failed to send verification email:", error);
		return { success: false, error };
	}
}

export async function sendPasswordResetEmail(email: string, token: string) {
	const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

	try {
		const data = await resend.emails.send({
			from: FROM_EMAIL,
			to: email,
			subject: "Reset your Danbing password 🔐",
			html: emailTemplate(`
				<h1 style="color: #0d1117; font-size: 28px; margin: 0 0 16px 0;">Reset your password</h1>
				
				<p style="font-size: 16px; color: #495057; line-height: 1.6; margin: 0 0 24px 0;">
					We received a request to reset your Danbing account password. Click the button below to create a new password.
				</p>
				
				<div style="text-align: center; margin: 32px 0;">
					<a href="${resetUrl}" 
					   style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
							  color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;
							  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
						Reset Password
					</a>
				</div>
				
				<div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
					<p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;">
						<strong>⚠️ This link expires in 1 hour</strong>
					</p>
					<p style="margin: 0; font-size: 14px; color: #991b1b;">
						For security reasons, password reset links expire quickly.
					</p>
				</div>
				
				<div style="background-color: #f8f9fa; padding: 16px; margin: 24px 0; border-radius: 8px;">
					<p style="margin: 0 0 8px 0; font-size: 14px; color: #495057;">
						<strong>🛡️ Security tip:</strong>
					</p>
					<p style="margin: 0; font-size: 14px; color: #6c757d;">
						If you didn't request this password reset, please ignore this email. Your password won't be changed unless you click the link above and create a new one.
					</p>
				</div>
				
				<p style="font-size: 12px; color: #6c757d; margin: 24px 0 0 0;">
					If the button doesn't work, copy and paste this link: <span style="color: #0066ff; word-break: break-all;">${resetUrl}</span>
				</p>
			`),
		});

		return { success: true, data };
	} catch (error) {
		console.error("Failed to send password reset email:", error);
		return { success: false, error };
	}
}
