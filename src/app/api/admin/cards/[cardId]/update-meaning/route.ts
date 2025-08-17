import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Card from "@/lib/db/models/Card";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meaning } = await req.json();

    if (!meaning || typeof meaning !== "string") {
      return NextResponse.json(
        { error: "Invalid meaning provided" },
        { status: 400 }
      );
    }

    // Await params before using them
    const { cardId } = await params;

    await connectDB();

    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      { 
        meaning: meaning.trim(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedCard) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      card: {
        _id: updatedCard._id,
        hanzi: updatedCard.hanzi,
        pinyin: updatedCard.pinyin,
        meaning: updatedCard.meaning,
      },
    });
  } catch (error) {
    console.error("Error updating card meaning:", error);
    return NextResponse.json(
      { error: "Failed to update meaning" },
      { status: 500 }
    );
  }
}