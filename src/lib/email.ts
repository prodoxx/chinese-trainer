import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "Chinese Learning App <onboarding@resend.dev>";

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Chinese Learning App!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome, ${name}!</h1>
          <p style="font-size: 16px; color: #666;">
            We're excited to have you join our Chinese learning community!
          </p>
          <p style="font-size: 16px; color: #666;">
            Here's what you can do to get started:
          </p>
          <ul style="font-size: 16px; color: #666;">
            <li>Upload your first deck of Chinese characters</li>
            <li>Start your first flash card session</li>
            <li>Track your progress with our analytics</li>
          </ul>
          <a href="${process.env.NEXTAUTH_URL}/dashboard" 
             style="display: inline-block; padding: 12px 24px; background-color: #0066ff; 
                    color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Get Started
          </a>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
      `,
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
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify your email</h1>
          <p style="font-size: 16px; color: #666;">
            Please click the button below to verify your email address.
          </p>
          <a href="${verifyUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #0066ff; 
                    color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Verify Email
          </a>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          <p style="font-size: 14px; color: #999;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
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
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Reset your password</h1>
          <p style="font-size: 16px; color: #666;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #0066ff; 
                    color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Reset Password
          </a>
          <p style="font-size: 14px; color: #999; margin-top: 30px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="font-size: 14px; color: #999;">
            This link will expire in 1 hour.
          </p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
}