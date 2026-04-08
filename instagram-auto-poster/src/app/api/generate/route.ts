import { NextResponse } from "next/server";
import { generateSlideImage } from "@/lib/image-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateType, content, styles } = body;

    if (!templateType || !content) {
      return NextResponse.json(
        { error: "templateType and content are required" },
        { status: 400 }
      );
    }

    const imageBuffer = await generateSlideImage({ templateType, content, styles });

    return new Response(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": imageBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to generate image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
