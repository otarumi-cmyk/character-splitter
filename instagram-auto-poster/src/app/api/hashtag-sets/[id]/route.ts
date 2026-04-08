import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, hashtags } = body;

    const existing = await prisma.hashtagSet.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json(
        { error: "Hashtag set not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (hashtags !== undefined) updateData.hashtags = JSON.stringify(hashtags);

    const hashtagSet = await prisma.hashtagSet.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(hashtagSet);
  } catch (error) {
    console.error("Failed to update hashtag set:", error);
    return NextResponse.json(
      { error: "Failed to update hashtag set" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.hashtagSet.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json(
        { error: "Hashtag set not found" },
        { status: 404 }
      );
    }

    await prisma.hashtagSet.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete hashtag set:", error);
    return NextResponse.json(
      { error: "Failed to delete hashtag set" },
      { status: 500 }
    );
  }
}
