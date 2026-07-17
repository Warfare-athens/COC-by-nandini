import { NextResponse } from "next/server";
import { storefrontSettings } from "@/lib/commerce";
export async function GET() { return NextResponse.json(await storefrontSettings()); }
