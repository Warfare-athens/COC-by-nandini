import { NextResponse } from "next/server";
import { z } from "zod";
import { commerceConfigured, getSupabaseAdmin } from "@/db";
const schema=z.object({email:z.string().email(),source:z.string().max(80).optional()});
export async function POST(request:Request){if(!commerceConfigured())return NextResponse.json({error:"Subscriptions unavailable"},{status:503});try{const input=schema.parse(await request.json());const{error}=await getSupabaseAdmin().from("newsletter_subscribers").upsert({email:input.email.toLowerCase(),status:"subscribed",source:input.source||"website",subscribed_at:new Date().toISOString(),unsubscribed_at:null,updated_at:new Date().toISOString()},{onConflict:"email"});if(error)throw error;return NextResponse.json({ok:true})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unable to subscribe"},{status:400})}}
