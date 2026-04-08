import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlideImage } from "@/lib/image-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId, slides: rawSlides } = body;

    let slides: { slideOrder: number; templateType: "cover" | "content-list" | "cta"; content: string; styles?: Record<string, string> }[];

    if (postId) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { slides: true },
      });

      if (!post) {
        return NextResponse.json(
          { error: "Post not found" },
          { status: 404 }
        );
      }

      slides = post.slides.map((s) => ({
        slideOrder: s.slideOrder,
        templateType: s.templateType as "cover" | "content-list" | "cta",
        content: s.content,
      }));
    } else if (rawSlides && Array.isArray(rawSlides)) {
      slides = rawSlides;
    } else {
      return NextResponse.json(
        { error: "postId or slides array is required" },
        { status: 400 }
      );
    }

    const images = await Promise.all(
      slides.map(async (slide) => {
        const parsedContent = typeof slide.content === "string" ? JSON.parse(slide.content) : slide.content;
        const imageBuffer = await generateSlideImage({
          templateType: slide.templateType as "cover" | "content-list" | "cta",
          content: parsedContent,
          styles: slide.styles,
        });
        const base64 = Buffer.from(imageBuffer).toString("base64");
        return {
          slideOrder: slide.slideOrder,
          base64,
        };
      })
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to generate carousel images:", error);
    return NextResponse.json(
      { error: "Failed to generate carousel images" },
      { status: 500 }
    );
  }
}
