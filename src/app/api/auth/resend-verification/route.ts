import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

// Simple in-memory rate limiting (consider Redis for production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 3; // Max 3 requests per 15 minutes

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check rate limit
    const now = Date.now();
    const rateLimit = rateLimitMap.get(email);
    
    if (rateLimit) {
      if (now < rateLimit.resetTime) {
        if (rateLimit.count >= MAX_REQUESTS) {
          const minutesRemaining = Math.ceil((rateLimit.resetTime - now) / 60000);
          return NextResponse.json(
            { error: `Too many requests. Please try again in ${minutesRemaining} minutes.` },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        // Reset the rate limit window
        rateLimit.count = 1;
        rateLimit.resetTime = now + RATE_LIMIT_WINDOW;
      }
    } else {
      rateLimitMap.set(email, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      );
    }

    // Check for existing token and delete if exists
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email
    const result = await sendVerificationEmail(email, token);

    if (!result.success) {
      console.error("Failed to send verification email:", result.error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "If an account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}