import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const hashtagSets = await prisma.hashtagSet.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(hashtagSets);
  } catch (error) {
    console.error("Failed to fetch hashtag sets:", error);
    return NextResponse.json(
      { error: "Failed to fetch hashtag sets" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, hashtags } = body;

    if (!name || !hashtags || !Array.isArray(hashtags)) {
      return NextResponse.json(
        { error: "name and hashtags array are required" },
        { status: 400 }
      );
    }

    const hashtagSet = await prisma.hashtagSet.create({
      data: {
        name,
        hashtags: JSON.stringify(hashtags),
      },
    });

    return NextResponse.json(hashtagSet, { status: 201 });
  } catch (error) {
    console.error("Failed to create hashtag set:", error);
    return NextResponse.json(
      { error: "Failed to create hashtag set" },
      { status: 500 }
    );
  }
}
