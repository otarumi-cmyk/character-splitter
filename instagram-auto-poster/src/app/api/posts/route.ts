import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: { slides: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, caption, hashtags, slides } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        title,
        caption: caption ?? "",
        hashtags: hashtags ?? "",
        slides: {
          create: (slides ?? []).map(
            (slide: {
              slideOrder: number;
              templateType: string;
              content: string;
            }) => ({
              slideOrder: slide.slideOrder,
              templateType: slide.templateType,
              content: slide.content,
            })
          ),
        },
      },
      include: { slides: true },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
