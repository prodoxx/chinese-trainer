import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import mongoose from "mongoose";

// Common confusable character mappings for Traditional Chinese
const CONFUSABLE_CHARACTERS: Record<string, string[]> = {
  // Similar looking characters
  '大': ['太', '犬', '天'],
  '太': ['大', '犬', '夫'],
  '天': ['大', '夫', '无'],
  '人': ['入', '八', '个'],
  '入': ['人', '八', '个'],
  '八': ['人', '入', '儿'],
  '土': ['士', '王', '工'],
  '士': ['土', '王', '工'],
  '王': ['土', '士', '玉'],
  '工': ['土', '士', '王'],
  '已': ['己', '巳', '乙'],
  '己': ['已', '巳', '乙'],
  '巳': ['已', '己', '乙'],
  '日': ['曰', '目', '白'],
  '曰': ['日', '目', '白'],
  '目': ['日', '曰', '自'],
  '白': ['日', '百', '自'],
  '百': ['白', '佰', '日'],
  '千': ['干', '于', '千'],
  '干': ['千', '于', '王'],
  '于': ['千', '干', '子'],
  '木': ['本', '末', '未'],
  '本': ['木', '末', '未'],
  '末': ['木', '本', '未'],
  '未': ['木', '本', '末'],
  '刀': ['力', '刃', '切'],
  '力': ['刀', '九', '刃'],
  '九': ['力', '丸', '几'],
  '几': ['九', '儿', '凡'],
  '儿': ['几', '八', '元'],
  '元': ['儿', '无', '天'],
  '无': ['元', '天', '夫'],
  '夫': ['天', '无', '失'],
  '失': ['夫', '矢', '大'],
  '矢': ['失', '知', '大'],
  
  // Similar pronunciation or meaning
  '是': ['事', '時', '視'],
  '事': ['是', '時', '使'],
  '時': ['是', '事', '使'],
  '的': ['地', '得', '底'],
  '地': ['的', '得', '底'],
  '得': ['的', '地', '德'],
  '在': ['再', '才', '存'],
  '再': ['在', '才', '又'],
  '才': ['在', '再', '材'],
  '和': ['合', '何', '河'],
  '合': ['和', '何', '含'],
  '何': ['和', '合', '河'],
  '那': ['哪', '拿', '邦'],
  '哪': ['那', '拿', '呢'],
  '拿': ['那', '哪', '拳'],
  '想': ['相', '向', '像'],
  '相': ['想', '向', '像'],
  '向': ['想', '相', '尚'],
  '像': ['想', '相', '象'],
  '看': ['看', '著', '睛'],
  '著': ['看', '着', '者'],
  '说': ['話', '講', '語'],
  '話': ['说', '講', '話'],
  '講': ['说', '話', '講'],
  
  // Component-based confusion
  '清': ['青', '情', '晴'],
  '青': ['清', '情', '晴'],
  '情': ['清', '青', '晴'],
  '晴': ['清', '青', '情'],
  '請': ['青', '情', '清'],
  '洋': ['海', '汪', '洲'],
  '海': ['洋', '每', '梅'],
  '每': ['海', '梅', '母'],
  '梅': ['海', '每', '莓'],
  '往': ['住', '注', '主'],
  '住': ['往', '注', '主'],
  '注': ['往', '住', '主'],
  '主': ['往', '住', '注'],
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { characters, limit = 3 } = await req.json();

    if (!characters || !Array.isArray(characters)) {
      return NextResponse.json(
        { error: "Characters array is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }
    
    const confusableMap = new Map<string, Set<string>>();

    // For each character, find confusable ones
    for (const char of characters) {
      const confusables = CONFUSABLE_CHARACTERS[char] || [];
      
      if (confusables.length > 0) {
        // Get random confusables up to the limit
        const shuffled = [...confusables].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, limit);
        confusableMap.set(char, new Set(selected));
      } else {
        // If no predefined confusables, find visually similar characters from database
        // This could be enhanced with stroke analysis or component analysis
        const similarCards = await db.collection('cards').find({
          hanzi: { $ne: char },
          // Look for characters with similar components or radicals
          $or: [
            { semanticCategory: { $exists: true } },
            { pinyin: { $exists: true } }
          ]
        }).limit(limit * 2).toArray();

        if (similarCards.length > 0) {
          const selected = similarCards
            .map(card => card.hanzi)
            .filter(h => h && h !== char)
            .slice(0, limit);
          confusableMap.set(char, new Set(selected));
        }
      }
    }

    // Convert to response format
    const result: Record<string, string[]> = {};
    confusableMap.forEach((confusables, char) => {
      result[char] = Array.from(confusables);
    });

    return NextResponse.json({ confusables: result });
  } catch (error) {
    console.error("Error fetching confused characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch confused characters" },
      { status: 500 }
    );
  }
}