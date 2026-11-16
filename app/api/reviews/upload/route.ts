import { NextResponse } from "next/server";
import { cloudinaryConfigured, uploadReviewImage } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!cloudinaryConfigured()) return NextResponse.json({ error: "Photo uploads are temporarily unavailable." }, { status: 503 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json({ error: "Choose a JPG, PNG or WebP image." }, { status: 400 });
    }
    if (file.size > 8_000_000) return NextResponse.json({ error: "Choose an image smaller than 8MB." }, { status: 400 });
    const uploaded = await uploadReviewImage(file);
    return NextResponse.json({ url: uploaded.secure_url }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Photo upload failed." }, { status: 400 });
  }
}
