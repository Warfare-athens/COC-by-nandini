import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const [k, ...v] = l.split("=");
      return [k.trim(), v.join("=").trim()];
    })
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const storefrontProducts = [
  {
    name: "Rose Pink Blazer Co-ord",
    slug: "rose-pink-co-ord-set",
    price_inr: 4999,
    compare_at_price_inr: 6499,
    hero_image_url: "/rose-pink-coord.png",
    short_description: "Tailored blush pink blazer co-ord with relaxed trousers and polished finish.",
    description: "The Rose Pink Blazer Co-ord features structured tailoring crafted in premium crepe, offering effortless sophistication from boardroom presentations to weekend celebrations.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: true,
    is_new_arrival: true,
    material: "Premium Lightweight Crepe",
    care_instructions: "Dry clean only. Store on a contoured hanger.",
    style_notes: "Pair with pointed heels and a structured leather mini bag.",
    tags: ["Co-ords", "Everyday", "Trending", "Blazer"],
    sizes: ["XS", "S", "M", "L", "XL"],
    sku_prefix: "COC-PK-CRD",
  },
  {
    name: "Ivory Power Suit Co-ord",
    slug: "ivory-double-breasted-co-ord-set",
    price_inr: 5499,
    compare_at_price_inr: 6999,
    hero_image_url: "/ivory-coord.png",
    short_description: "Double-breasted ivory power suit with sharp lapels and straight trousers.",
    description: "Impeccably tailored ivory power suit co-ord featuring double-breasted button closures, structured shoulders, and high-waist tailored straight-leg trousers.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: true,
    is_new_arrival: true,
    material: "Structured Poly-Viscose Blend",
    care_instructions: "Dry clean recommended. Low steam iron on reverse.",
    style_notes: "Elevate with minimalist gold jewelry and nude heels.",
    tags: ["Co-ords", "Party Wear", "Trending", "Power Suit"],
    sizes: ["XS", "S", "M", "L", "XL"],
    sku_prefix: "COC-IV-SUIT",
  },
  {
    name: "Midnight One-Shoulder Maxi",
    slug: "black-one-shoulder-maxi-dress",
    price_inr: 4499,
    compare_at_price_inr: 5999,
    hero_image_url: "/midnight-maxi-dress.png",
    short_description: "Asymmetric one-shoulder draped black maxi dress with side slit.",
    description: "Exquisite draped silhouette with an asymmetric one-shoulder design and subtle leg slit, designed for high-glamour evening affairs and cocktail parties.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: true,
    is_new_arrival: true,
    material: "Fluid Satin Crepe",
    care_instructions: "Dry clean only. Cool iron on reverse.",
    style_notes: "Style with strappy black stilettos and statement earrings.",
    tags: ["Dresses", "Party Wear", "Evening", "Maxi"],
    sizes: ["XS", "S", "M", "L", "XL"],
    sku_prefix: "COC-MD-MAXI",
  },
  {
    name: "Classic Leather Shoulder Bag",
    slug: "classic-leather-shoulder-bag",
    price_inr: 2999,
    compare_at_price_inr: 3999,
    hero_image_url: "/classic-leather-bag.png",
    short_description: "Handcrafted tan leather shoulder bag with polished gold hardware.",
    description: "Versatile, timeless tan leather shoulder bag featuring custom gold-tone hardware, secure magnetic closure, and thoughtfully partitioned interior pockets.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: false,
    is_new_arrival: false,
    material: "Genuine Full-Grain Leather",
    care_instructions: "Wipe with a soft damp cloth. Condition periodically with leather balm.",
    style_notes: "Complements both everyday denim edits and formal tailored suiting.",
    tags: ["Accessories", "Everyday", "Handbags"],
    sizes: ["One Size"],
    sku_prefix: "COC-ACC-BAG",
  },
  {
    name: "Oversized Denim Streetwear Set",
    slug: "oversized-denim-streetwear-set",
    price_inr: 5899,
    compare_at_price_inr: 7299,
    hero_image_url: "/streetwear-denim-set.jpg",
    short_description: "Medium wash oversized denim jacket with relaxed wide-leg jeans.",
    description: "Contemporary Korean street style 2-piece denim set featuring drop shoulders, customized metal buttons, and matching baggy cargo-inspired trousers.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: false,
    is_new_arrival: true,
    material: "100% Cotton Raw-Dyed Denim",
    care_instructions: "Machine wash cold inside out with similar colors.",
    style_notes: "Pair with chunky white trainers and a minimalist rib crop top.",
    tags: ["Everyday", "Trending", "Korean", "Denim"],
    sizes: ["S", "M", "L", "XL"],
    sku_prefix: "COC-DNM-SET",
  },
  {
    name: "Minimalist Cotton Dress",
    slug: "minimalist-cotton-dress",
    price_inr: 3999,
    compare_at_price_inr: 4999,
    hero_image_url: "/minimalist-cotton-dress.jpg",
    short_description: "Breathable sand beige linen-cotton midi dress with tie waist.",
    description: "An everyday wardrobe hero crafted from pure breathable cotton-linen weave, complete with side pockets and an adjustable cinch belt.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: false,
    is_new_arrival: false,
    material: "Cotton Linen Blend",
    care_instructions: "Gentle machine wash or hand wash in cold water.",
    style_notes: "Style with leather slide sandals and a woven straw tote.",
    tags: ["Dresses", "Everyday", "Linen"],
    sizes: ["S", "M", "L", "XL"],
    sku_prefix: "COC-DR-COT",
  },
  {
    name: "Wide-leg Linen Trousers",
    slug: "wide-leg-linen-trousers",
    price_inr: 3499,
    compare_at_price_inr: 4299,
    hero_image_url: "/wide-leg-trousers.png",
    short_description: "High-waisted flared linen trousers with relaxed drape.",
    description: "Effortlessly breezy wide-leg trousers designed with front pleats, elasticated back waistband, and functional slash pockets.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: false,
    is_new_arrival: false,
    material: "100% Pure Washed Linen",
    care_instructions: "Hand wash or gentle cycle. Hang dry in shade.",
    style_notes: "Pair with tucked-in knit tees or crisp oversized poplin shirts.",
    tags: ["Bottom Wear", "Everyday", "Linen"],
    sizes: ["S", "M", "L", "XL"],
    sku_prefix: "COC-BTM-LIN",
  },
  {
    name: "Cocktail Party Dress",
    slug: "cocktail-party-dress",
    price_inr: 6299,
    compare_at_price_inr: 7999,
    hero_image_url: "/cocktail-dress.png",
    short_description: "Midnight satin cowl-neck cocktail dress with tailored contouring.",
    description: "A showstopping party silhouette cut on the bias from liquid satin that drapes fluidly along the contours of your silhouette.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: false,
    is_new_arrival: true,
    material: "Silk Touch Satin",
    care_instructions: "Dry clean only. Steam iron gently.",
    style_notes: "Accompany with metallic sandals and a sleek box clutch.",
    tags: ["Party Wear", "Dresses", "Cocktail"],
    sizes: ["S", "M", "L", "XL"],
    sku_prefix: "COC-DR-CKT",
  },
  {
    name: "Black Oval sunglass",
    slug: "black-oval-sunglasses",
    price_inr: 899,
    compare_at_price_inr: 1499,
    hero_image_url: "/black-oval-sunglasses.png",
    short_description: "Retro oval sunglasses with acetate frames and UV400 lenses.",
    description: "90s-inspired oval sunglasses featuring lightweight durable acetate frames and 100% UV400 protected tinted lenses.",
    brand: "Carnival of Clothes",
    status: "active",
    is_featured: false,
    is_new_arrival: false,
    material: "Bio-Acetate & Polycarbonate Lenses",
    care_instructions: "Clean with microfiber cloth. Store in the protective hard case.",
    style_notes: "The finishing touch for clean streetwear or resort vacation aesthetics.",
    tags: ["Accessories", "Everyday", "Eyewear"],
    sizes: ["One Size"],
    sku_prefix: "COC-ACC-SUN",
  },
];

async function seed() {
  console.log("Seeding storefront products into Supabase...");
  for (const item of storefrontProducts) {
    const { sizes, sku_prefix, ...productData } = item;

    // Check if product already exists by name
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("name", productData.name)
      .maybeSingle();

    let productId = existing?.id;

    if (!productId) {
      const { data: inserted, error: insertError } = await supabase
        .from("products")
        .insert({
          ...productData,
          sku: `${sku_prefix}-BASE`,
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`Error inserting ${productData.name}:`, insertError);
        continue;
      }
      productId = inserted.id;
      console.log(`+ Created product: ${productData.name} (id: ${productId})`);
    } else {
      // Update existing
      const { error: updateError } = await supabase
        .from("products")
        .update(productData)
        .eq("id", productId);
      if (updateError) {
        console.error(`Error updating ${productData.name}:`, updateError);
      } else {
        console.log(`~ Updated product: ${productData.name} (id: ${productId})`);
      }
    }

    // Now upsert size variants
    for (const size of sizes) {
      const variantSku = `${sku_prefix}-${size.toUpperCase().replace(/\s+/g, "")}`;
      const { data: existingVariant } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId)
        .eq("size", size)
        .maybeSingle();

      if (!existingVariant) {
        const { error: variantError } = await supabase
          .from("product_variants")
          .insert({
            product_id: productId,
            sku: variantSku,
            title: size === "One Size" ? "Standard Size" : `Size ${size}`,
            size: size,
            price_inr: productData.price_inr,
            compare_at_price_inr: productData.compare_at_price_inr,
            inventory_quantity: 25,
            low_stock_threshold: 3,
            is_active: true,
          });
        if (variantError) {
          console.error(`Error creating variant ${size} for ${productData.name}:`, variantError);
        } else {
          console.log(`  + Added variant: ${size} (${variantSku})`);
        }
      } else {
        await supabase
          .from("product_variants")
          .update({
            inventory_quantity: 25,
            is_active: true,
            price_inr: productData.price_inr,
          })
          .eq("id", existingVariant.id);
        console.log(`  ~ Synced variant: ${size}`);
      }
    }
  }

  // Also verify store settings
  const { data: settings } = await supabase.from("store_settings").select("key, value");
  const settingsMap = Object.fromEntries((settings || []).map((s) => [s.key, s.value]));

  const requiredSettings = [
    { key: "free_shipping_threshold", value: 2999 },
    { key: "shipping_charge", value: 149 },
    { key: "cod_enabled", value: true },
    { key: "store_name", value: "Carnival of Clothes by Nandini" },
  ];

  for (const req of requiredSettings) {
    if (settingsMap[req.key] === undefined) {
      await supabase.from("store_settings").insert(req);
      console.log(`+ Added store setting: ${req.key} = ${req.value}`);
    }
  }

  console.log("Storefront product synchronization complete!");
}

seed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
