import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { showFlashDemo } = await req.json();

    if (typeof showFlashDemo !== "boolean") {
      return NextResponse.json(
        { error: "showFlashDemo must be a boolean" },
        { status: 400 }
      );
    }

    // Update user settings
    const settings = await prisma.userSettings.update({
      where: { userId: session.user.id },
      data: { showFlashDemo },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating flash demo setting:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { showFlashDemo: true },
    });

    return NextResponse.json({ 
      showFlashDemo: settings?.showFlashDemo ?? true 
    });
  } catch (error) {
    console.error("Error fetching flash demo setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}