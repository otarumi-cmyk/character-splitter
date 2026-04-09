import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.canvasTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch canvas templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch canvas templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, canvasData, slideType, slotMap } = body;

    if (!name || !canvasData) {
      return NextResponse.json(
        { error: "name and canvasData are required" },
        { status: 400 }
      );
    }

    const template = await prisma.canvasTemplate.create({
      data: {
        name,
        category: category || "general",
        slideType: slideType || null,
        slotMap: slotMap ? (typeof slotMap === "string" ? slotMap : JSON.stringify(slotMap)) : null,
        canvasData:
          typeof canvasData === "string"
            ? canvasData
            : JSON.stringify(canvasData),
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Failed to create canvas template:", error);
    return NextResponse.json(
      { error: "Failed to create canvas template" },
      { status: 500 }
    );
  }
}
