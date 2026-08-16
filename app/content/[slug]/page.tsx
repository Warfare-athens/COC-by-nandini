import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CustomerPage from "@/app/components/CustomerPage";
import { commerceConfigured, getSupabaseAdmin } from "@/db";

async function entry(slug:string){if(!commerceConfigured())return null;const{data}=await getSupabaseAdmin().from("content_entries").select("title,slug,type,summary,body,image_url,seo_title,seo_description,updated_at").eq("slug",slug).eq("status","published").maybeSingle();return data}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params;const item=await entry(slug);if(!item)return{};return{title:item.seo_title||item.title,description:item.seo_description||item.summary,alternates:{canonical:`/content/${item.slug}`}}}
export default async function ContentPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const item=await entry(slug);if(!item)notFound();return <CustomerPage eyebrow={String(item.type).toUpperCase()} title={item.title} intro={item.summary||"Carnival of Clothes"}>{item.image_url&&<img src={item.image_url} alt={item.title} style={{width:"100%",maxHeight:620,objectFit:"cover",borderRadius:18}}/>}<article style={{whiteSpace:"pre-wrap",lineHeight:1.9}}>{item.body}</article></CustomerPage>}
