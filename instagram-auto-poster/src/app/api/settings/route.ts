import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value])
    );
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: "settings array is required" },
        { status: 400 }
      );
    }

    await Promise.all(
      settings.map((setting: { key: string; value: string }) =>
        prisma.setting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value },
        })
      )
    );

    const allSettings = await prisma.setting.findMany();
    const settingsMap = Object.fromEntries(
      allSettings.map((s) => [s.key, s.value])
    );

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const entries = Object.entries(body).filter(
      ([, v]) => typeof v === "string"
    ) as [string, string][];

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    const allSettings = await prisma.setting.findMany();
    const settingsMap = Object.fromEntries(
      allSettings.map((s) => [s.key, s.value])
    );

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
