import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.canvasTemplate.findUnique({
      where: { id: parseInt(id) },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Canvas template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to fetch canvas template:", error);
    return NextResponse.json(
      { error: "Failed to fetch canvas template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, canvasData } = body;

    const existing = await prisma.canvasTemplate.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Canvas template not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (canvasData !== undefined) {
      updateData.canvasData =
        typeof canvasData === "string"
          ? canvasData
          : JSON.stringify(canvasData);
    }

    const template = await prisma.canvasTemplate.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to update canvas template:", error);
    return NextResponse.json(
      { error: "Failed to update canvas template" },
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

    const existing = await prisma.canvasTemplate.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Canvas template not found" },
        { status: 404 }
      );
    }

    await prisma.canvasTemplate.delete({ where: { id: parseInt(id) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete canvas template:", error);
    return NextResponse.json(
      { error: "Failed to delete canvas template" },
      { status: 500 }
    );
  }
}
