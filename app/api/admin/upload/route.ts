import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { uploadProductImage } from "@/lib/cloudinary";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 8_000_000) {
      return NextResponse.json({ error: "Choose an image smaller than 8MB." }, { status: 400 });
    }
    const uploaded = await uploadProductImage(file);
    return NextResponse.json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
