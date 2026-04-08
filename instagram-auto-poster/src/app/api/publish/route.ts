import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateSlideImage } from "@/lib/image-generator";
import { publishCarousel, publishSingleImage } from "@/lib/instagram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { slides: { orderBy: { slideOrder: "asc" } } },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch Instagram credentials from Settings
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "instagramAccessToken",
            "instagramAccountId",
            "imageHostingBaseUrl",
          ],
        },
      },
    });

    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value])
    );

    const accessToken = settingsMap.instagramAccessToken;
    const instagramAccountId = settingsMap.instagramAccountId;
    const imageHostingBaseUrl = settingsMap.imageHostingBaseUrl;

    if (!accessToken || !instagramAccountId) {
      return NextResponse.json(
        { error: "Instagram credentials not configured in settings" },
        { status: 400 }
      );
    }

    if (!imageHostingBaseUrl) {
      return NextResponse.json(
        {
          error:
            "Image hosting not configured. Set imageHostingBaseUrl in settings to enable publishing.",
        },
        { status: 400 }
      );
    }

    const config = { accessToken, instagramAccountId };

    // Generate images for all slides
    const imageUrls: string[] = [];
    for (const slide of post.slides) {
      const parsedContent =
        typeof slide.content === "string"
          ? JSON.parse(slide.content)
          : slide.content;

      await generateSlideImage({
        templateType: slide.templateType as "cover" | "content-list" | "cta",
        content: parsedContent,
      });

      // In production, upload to cloud storage and get the URL
      const imageUrl = `${imageHostingBaseUrl}/slides/${post.id}/${slide.slideOrder}.png`;
      imageUrls.push(imageUrl);
    }

    const caption = [post.caption, post.hashtags].filter(Boolean).join("\n\n");

    let instagramPostId: string;

    if (imageUrls.length === 1) {
      instagramPostId = await publishSingleImage(
        config,
        imageUrls[0],
        caption
      );
    } else {
      instagramPostId = await publishCarousel(config, imageUrls, caption);
    }

    // Update post status
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: "published",
        publishedAt: new Date(),
        instagramPostId,
      },
      include: { slides: true },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Failed to publish post:", error);
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
