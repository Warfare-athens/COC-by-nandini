"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_CATEGORIES, PRODUCT_TAXONOMY, OCCASIONS, taxonomyTag } from "@/lib/product-taxonomy";
import { POPULAR_PRODUCT_COLORS, getColorSwatch, detectColorFromName, serializeImageAltText, parseImageColorAndAlt } from "@/lib/colors";
import { showGlobalStatus } from "@/app/global-status";
import UniversalSelect from "./UniversalSelect";
import AdminGstPriceHelper from "./AdminGstPriceHelper";

type GeneratedFields = {
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  category: string;
  subcategory: string;
  occasions: string[];
  tags: string[];
  colors: string[];
  suggestedSizes: string[];
  material: string;
  careInstructions: string;
  styleNotes: string;
  seoTitle: string;
  seoDescription: string;
  searchKeywords: string[];
  imageAltTexts: string[];
};
type SizeInventory = { size: string; quantity: number };
const productDraftKey = "coc-admin-unfinished-product";

const emptyGenerated: GeneratedFields = {
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  category: "",
  subcategory: "",
  occasions: [],
  tags: [],
  colors: [],
  suggestedSizes: [],
  material: "",
  careInstructions: "",
  styleNotes: "",
  seoTitle: "",
  seoDescription: "",
  searchKeywords: [],
  imageAltTexts: [],
};

export const DEFAULT_SIZES_UP_TO_4XL = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

export default function AdminProductForm() {
  const [name, setName] = useState("");
  const [priceInr, setPriceInr] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [imageColors, setImageColors] = useState<Record<string, string>>({});
  const [generated, setGenerated] = useState<GeneratedFields>(emptyGenerated);
  const [sizeInventory, setSizeInventory] = useState<SizeInventory[]>(() =>
    DEFAULT_SIZES_UP_TO_4XL.map((size) => ({ size, quantity: 0 }))
  );
  const [aiGenerated, setAiGenerated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const saveMessageRef = useRef<HTMLDivElement>(null);
  const isSubmittedRef = useRef(false);
  const router = useRouter();

  const resetForm = () => {
    setName("");
    setPriceInr("");
    setTaxRate("");
    setImages([]);
    setPendingImages([]);
    setImageColors({});
    setGenerated(emptyGenerated);
    setSizeInventory(DEFAULT_SIZES_UP_TO_4XL.map((size) => ({ size, quantity: 0 })));
    setAiGenerated(false);
    setCompareAtPrice("");
    setCustomColor("");
    setIsBestSeller(false);
    setIsNewArrival(false);
    setIsFeatured(false);
    setError("");
    setStatusText("");
    setHasRestoredDraft(false);
    isSubmittedRef.current = false;
    try {
      localStorage.removeItem(productDraftKey);
    } catch {}
  };

  useEffect(() => {
    const restoreDraft = window.setTimeout(() => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem(productDraftKey) : null;
        if (raw) {
          const saved = JSON.parse(raw);
          const hasContent = Boolean(
            saved && (
              (typeof saved.name === "string" && saved.name.trim().length > 0) ||
              (typeof saved.priceInr === "string" && String(saved.priceInr).trim().length > 0) ||
              (Array.isArray(saved.images) && saved.images.length > 0) ||
              (saved.generated?.slug && String(saved.generated.slug).trim().length > 0)
            )
          );

          if (hasContent) {
            setName(saved.name || "");
            setPriceInr(saved.priceInr ? String(saved.priceInr) : "");
            setTaxRate(saved.taxRate || "");
            setImages(Array.isArray(saved.images) ? saved.images : []);
            if (saved.imageColors && typeof saved.imageColors === "object") {
              setImageColors(saved.imageColors);
            }
            setGenerated({ ...emptyGenerated, ...(saved.generated || {}) });
            setSizeInventory(
              Array.isArray(saved.sizeInventory) && saved.sizeInventory.length > 0
                ? saved.sizeInventory
                : DEFAULT_SIZES_UP_TO_4XL.map((size) => ({ size, quantity: 0 }))
            );
            setAiGenerated(Boolean(saved.aiGenerated));
            setCompareAtPrice(saved.compareAtPrice || "");
            setIsBestSeller(Boolean(saved.isBestSeller));
            setIsNewArrival(Boolean(saved.isNewArrival));
            setIsFeatured(Boolean(saved.isFeatured));
            setHasRestoredDraft(true);
          } else {
            localStorage.removeItem(productDraftKey);
          }
        }
      } catch {
        localStorage.removeItem(productDraftKey);
      } finally {
        setDraftReady(true);
      }
    }, 0);

    return () => window.clearTimeout(restoreDraft);
  }, []);

  const hasMeaningfulContent = Boolean(
    name.trim().length > 0 ||
    priceInr.trim().length > 0 ||
    images.length > 0 ||
    generated.slug.trim().length > 0 ||
    generated.description.trim().length > 0
  );

  useEffect(() => {
    if (!draftReady || isSubmittedRef.current) return;

    if (!hasMeaningfulContent) {
      try {
        localStorage.removeItem(productDraftKey);
      } catch {}
      return;
    }

    try {
      localStorage.setItem(
        productDraftKey,
        JSON.stringify({
          name,
          priceInr,
          taxRate,
          images,
          imageColors,
          generated,
          sizeInventory,
          aiGenerated,
          compareAtPrice,
          isBestSeller,
          isNewArrival,
          isFeatured,
          savedAt: Date.now(),
        })
      );
    } catch {}
  }, [
    draftReady,
    name,
    priceInr,
    taxRate,
    images,
    imageColors,
    generated,
    sizeInventory,
    aiGenerated,
    compareAtPrice,
    isBestSeller,
    isNewArrival,
    isFeatured,
    hasMeaningfulContent,
  ]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(busy ? "coc-loader-show" : "coc-loader-hide", {
      detail: busy ? { message: statusText || "Working on product" } : undefined,
    }));
  }, [busy, statusText]);

  const update = (field: keyof GeneratedFields, value: string | string[]) =>
    setGenerated((current) => ({ ...current, [field]: value }));

  const toggleColor = (colorToToggle: string) => {
    const trimmed = colorToToggle.trim();
    if (!trimmed) return;
    const exists = generated.colors.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      update(
        "colors",
        generated.colors.filter(
          (c) => c.toLowerCase() !== trimmed.toLowerCase()
        )
      );
    } else {
      update("colors", [...generated.colors, trimmed]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    update(
      "colors",
      generated.colors.filter(
        (c) => c.toLowerCase() !== colorToRemove.toLowerCase()
      )
    );
  };

  const upload = async (files: FileList) => {
    const selected = Array.from(files).slice(0, Math.max(0, 8 - images.length));
    if (!selected.length) return;
    const previews = selected.map((file) => URL.createObjectURL(file));
    setPendingImages(previews);
    setBusy(true);
    setError("");
    setStatusText(
      `Uploading ${selected.length} image${selected.length === 1 ? "" : "s"}…`,
    );
    const uploaded: string[] = [];
    const failures: string[] = [];
    try {
      for (const file of selected) {
        try {
          const form = new FormData();
          form.set("file", file);
          const response = await fetch("/api/admin/upload", {
            method: "POST",
            body: form,
          });
          const data = await response.json();
          if (response.status === 401) {
            window.location.href = "/admin/access";
            throw new Error("Admin session expired. Please sign in again.");
          }
          if (!response.ok) throw new Error(data.error);
          uploaded.push(data.url);
        } catch (uploadError) {
          failures.push(
            uploadError instanceof Error
              ? uploadError.message
              : "Upload failed.",
          );
        }
      }
      if (uploaded.length) setImages((current) => [...current, ...uploaded]);
      if (failures.length) setError(failures[0]);
      setStatusText(
        uploaded.length
          ? `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`
          : "",
      );
    } finally {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
      setPendingImages([]);
      setBusy(false);
    }
  };

  const fillManually = () => {
    setError("");
    const cleanName = name.trim();
    const lower = cleanName.toLowerCase();
    const slug = cleanName
      ? lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `product-${Date.now().toString(36)}`
      : `product-${Date.now().toString(36)}`;
    const prefix = cleanName ? (cleanName.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "PROD") : "PROD";
    const sku = `COC-${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    let category = "Top Wear";
    let subcategory = "";
    if (cleanName) {
      if (/\b(dress|gown|maxi|midi)\b/.test(lower)) {
        category = "Dresses";
      } else if (/\b(co-?ord|coord|set|suit)\b/.test(lower) && !/\b(kurta|anarkali|saree)\b/.test(lower)) {
        category = "Co-ord Sets";
      } else if (/\b(kurti|kurta|saree|sari|lehenga|anarkali|dupatta|ethnic)\b/.test(lower)) {
        category = "Indian";
        if (lower.includes("kurti")) subcategory = "Kurtis";
        else if (lower.includes("kurta")) subcategory = "Kurta Sets";
        else if (lower.includes("saree") || lower.includes("sari")) subcategory = "Sarees";
        else if (lower.includes("lehenga")) subcategory = "Lehenga Sets";
        else if (lower.includes("anarkali")) subcategory = "Anarkali Suits";
        else if (lower.includes("dupatta")) subcategory = "Dupattas";
      } else if (/\b(korean)\b/.test(lower)) {
        category = "Korean";
        if (lower.includes("dress")) subcategory = "Korean Dresses";
        else if (lower.includes("coord") || lower.includes("set")) subcategory = "Korean Co-ords";
        else if (lower.includes("skirt")) subcategory = "Pleated Skirts";
        else if (lower.includes("shirt")) subcategory = "Oversized Shirts";
        else subcategory = "Korean Tops";
      } else if (/\b(jean|denim|trouser|pant|cargo|palazzo|skirt|short)\b/.test(lower)) {
        category = "Bottom Wear";
        if (lower.includes("jean") || lower.includes("denim")) subcategory = "Jeans";
        else if (lower.includes("cargo")) subcategory = "Cargo Pants";
        else if (lower.includes("palazzo")) subcategory = "Palazzo Pants";
        else if (lower.includes("skirt")) subcategory = "Skirts";
        else if (lower.includes("short")) subcategory = "Shorts";
        else subcategory = "Trousers";
      } else if (/\b(top|shirt|t-?shirt|tee|crop|tank|bodysuit|blouse)\b/.test(lower)) {
        category = "Top Wear";
        if (lower.includes("t-shirt") || lower.includes("tee")) subcategory = "T-shirts";
        else if (lower.includes("crop")) subcategory = "Crop Tops";
        else if (lower.includes("tank")) subcategory = "Tank Tops";
        else if (lower.includes("bodysuit")) subcategory = "Bodysuits";
        else subcategory = "Shirts";
      } else if (/\b(bag|handbag|sunglass|glasses|jewel|earring|necklace|belt|scarf|hair)\b/.test(lower)) {
        category = "Accessories";
        if (lower.includes("sunglass") || lower.includes("glasses")) subcategory = "Sunglasses";
        else if (lower.includes("bag")) subcategory = "Handbags";
        else if (lower.includes("belt")) subcategory = "Belts";
        else if (lower.includes("scarf")) subcategory = "Scarves";
        else if (lower.includes("hair")) subcategory = "Hair Accessories";
        else subcategory = "Jewellery";
      }
    }

    const isApparel = category !== "Accessories";
    const sizes = isApparel ? DEFAULT_SIZES_UP_TO_4XL : ["One Size"];
    const detectedColors = cleanName ? detectColorFromName(cleanName) : [];

    setGenerated({
      slug,
      sku,
      shortDescription: cleanName ? `${cleanName} — handcrafted elegance by Carnival of Clothes.` : "",
      description: cleanName
        ? `Discover the ${cleanName} from Carnival of Clothes by Nandini. Designed for premium comfort and effortless style, this piece blends contemporary design with exquisite tailoring.\n\nCrafted with premium materials and finished with meticulous care at our Ahmedabad boutique studio.`
        : "Crafted with premium materials and finished with meticulous care at our Ahmedabad boutique studio.",
      category,
      subcategory,
      occasions: ["Everyday"],
      tags: [category.toLowerCase(), "carnival-edit", "trending"],
      colors: detectedColors.length ? detectedColors : ["Multi"],
      suggestedSizes: sizes,
      material: "Premium Quality Fabric",
      careInstructions: "Dry clean or gentle hand wash in cold water with mild detergent. Do not bleach. Dry in shade.",
      styleNotes: "Style with complementary footwear and minimalist accessories for an effortless look.",
      seoTitle: cleanName ? `${cleanName} | Carnival of Clothes by Nandini` : "Carnival of Clothes by Nandini",
      seoDescription: cleanName ? `Shop the ${cleanName} online at Carnival of Clothes. Premium women's fashion curated in Ahmedabad with pan-India delivery.` : "",
      searchKeywords: cleanName ? [cleanName.toLowerCase(), category.toLowerCase(), "carnival of clothes", "buy online"] : [category.toLowerCase(), "buy online"],
      imageAltTexts: cleanName ? [cleanName] : [],
    });

    setSizeInventory(
      sizes.map((size) => ({
        size,
        quantity: 0,
      }))
    );
    setAiGenerated(true);
    setStatusText(
      cleanName
        ? "Starter template loaded! You can now adjust categories, sizes, descriptions, and save."
        : "Manual editor enabled! Fill in product name, price, images, and details below."
    );
    showGlobalStatus("Form ready for manual editing", "info", 3000);
  };

  const generate = async () => {
    if (!name.trim() || !Number(priceInr))
      return setError("Enter the product name and price first.");
    setBusy(true);
    setError("");
    setStatusText("Analysing product and generating content…");
    try {
      const response = await fetch("/api/admin/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          name,
          priceInr: Number(priceInr),
          imageUrls: images,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const productData = { ...data.product };
      if (!productData.colors || productData.colors.length === 0) {
        const detected = detectColorFromName(name);
        if (detected.length > 0) {
          productData.colors = detected;
        }
      }
      setGenerated(productData);
      const isApparel = data.product.category !== "Accessories";
      const rawSizes = data.product.suggestedSizes || [];
      const hasStandardSizes = rawSizes.some((s: string) => ["XS", "S", "M", "L", "XL"].includes(s.toUpperCase()));
      const sizesToSet = (isApparel || hasStandardSizes)
        ? DEFAULT_SIZES_UP_TO_4XL
        : rawSizes.length > 0 ? rawSizes : DEFAULT_SIZES_UP_TO_4XL;

      setSizeInventory(
        sizesToSet.map((size: string) => ({
          size,
          quantity: 0,
        })),
      );
      setAiGenerated(true);

      if (data.fallbackUsed) {
        setStatusText(data.fallbackReason || "Starter template loaded! You can adjust details and save.");
        showGlobalStatus(data.fallbackReason || "AI limit reached; starter template loaded", "info", 6000);
      } else {
        setStatusText(
          "Product content generated. Review and edit before saving.",
        );
      }
    } catch (generationError) {
      // If AI fails, unlock the form with manual fallback so the user is never blocked!
      fillManually();
      const rawMsg = generationError instanceof Error ? generationError.message : "AI generation failed.";
      const isQuota = rawMsg.toLowerCase().includes("quota") || rawMsg.toLowerCase().includes("limit") || rawMsg.includes("429");
      const notice = isQuota
        ? "Gemini free quota is exhausted. We've auto-filled a smart starter template so you can continue adding your product!"
        : `${rawMsg} We've auto-filled a smart starter template so you can continue adding your product!`;
      setStatusText(notice);
      showGlobalStatus(notice, "info", 6000);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatusText("Saving product…");
    const form = new FormData(event.currentTarget);
    const cleanSizeInventory = sizeInventory.filter((item) => item.size.trim());
    const missing = [
      !name.trim() && "product name",
      !Number(priceInr) && "price",
      !(images[0] || form.get("heroImageUrl")) && "product image",
      !generated.slug && "URL slug",
      !generated.sku && "SKU",
      !generated.shortDescription && "short description",
      !generated.description && "full description",
      !generated.category && "category",
      !generated.occasions.length && "Everyday or Party Wear",
      !cleanSizeInventory.length && "at least one size",
      !cleanSizeInventory.some((item) => item.quantity > 0) && "stock quantity",
    ].filter(Boolean) as string[];
    if (missing.length) {
      const message = `Cannot publish yet. Add: ${missing.join(", ")}.`;
      setError(message);
      setStatusText("");
      showGlobalStatus(message, "error", 4500);
      requestAnimationFrame(() => saveMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setBusy(true);
    setStatusText("Saving and publishing product...");
    const body = {
      name,
      slug: generated.slug,
      sku: generated.sku,
      shortDescription: generated.shortDescription,
      description: generated.description,
      heroImageUrl: images[0] || form.get("heroImageUrl"),
      priceInr: Number(priceInr),
      taxRate: taxRate || (Number(priceInr) > 2500 ? "18.00" : "5.00"),
      compareAtPriceInr: compareAtPrice
        ? Number(compareAtPrice)
        : undefined,
      status: "active",
      isBestSeller,
      isNewArrival,
      isFeatured,
      sizes: cleanSizeInventory.map((item) => item.size.trim()),
      sizeInventory: cleanSizeInventory,
      images: images.map((url, index) => {
        const assignedColor = imageColors[url] || "";
        const baseAlt = generated.imageAltTexts[index] || generated.shortDescription || name;
        return {
          url,
          altText: serializeImageAltText(baseAlt, assignedColor),
        };
      }),
      material: generated.material,
      colors: generated.colors,
      careInstructions: generated.careInstructions,
      styleNotes: generated.styleNotes,
      tags: [
        ...generated.tags.filter((tag) => !/^(category|subcategory|occasion|color):/.test(tag)),
        taxonomyTag("category", generated.category),
        ...(generated.subcategory ? [taxonomyTag("subcategory", generated.subcategory)] : []),
        ...generated.occasions.map((value) => taxonomyTag("occasion", value)),
        ...generated.colors.map((color) => taxonomyTag("color", color)),
      ],
      seoTitle: generated.seoTitle,
      seoDescription: generated.seoDescription,
      searchKeywords: generated.searchKeywords,
      aiGenerated,
    };
    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      isSubmittedRef.current = true;
      try {
        localStorage.removeItem(productDraftKey);
      } catch {}

      showGlobalStatus("Product saved and published successfully", "success", 4000);
      resetForm();
      router.push("/admin/products");
      router.refresh();
    } catch (saveError) {
      const message = saveError instanceof Error
          ? saveError.message
          : "Unable to save product.";
      setError(message);
      showGlobalStatus(message, "error", 4500);
      requestAnimationFrame(() => saveMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      setBusy(false);
      setStatusText("");
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      {hasRestoredDraft && (
        <div className="admin-draft-banner">
          <div className="admin-draft-banner-content">
            <div className="admin-draft-banner-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              <strong>Unfinished draft restored</strong>
            </div>
            <p>
              An unsaved product draft from your previous session was recovered. You can continue editing or discard it to start fresh with a blank form.
            </p>
          </div>
          <div className="admin-draft-banner-actions">
            <button
              type="button"
              className="admin-button admin-button-secondary admin-btn-discard"
              onClick={() => {
                resetForm();
                showGlobalStatus("Draft discarded. Ready for a new product.", "info", 3000);
              }}
            >
              Discard draft & start fresh
            </button>
            <button
              type="button"
              className="admin-draft-keep-btn"
              onClick={() => setHasRestoredDraft(false)}
            >
              Keep editing draft
            </button>
          </div>
        </div>
      )}

      <div className="admin-panel admin-product-builder">
        <div className="admin-product-builder-head">
          <div>
            <h2>Product content & builder</h2>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--admin-text-muted)" }}>
              Generate with Gemini AI or enter details manually below.
            </p>
          </div>
          <div className="admin-builder-actions">
            <button
              type="button"
              className="admin-button"
              onClick={generate}
              disabled={busy}
              title="Analyse images and name with Gemini AI"
            >
              Generate with AI
            </button>
            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={fillManually}
              disabled={busy}
              title="Skip AI and fill product details manually"
            >
              Enter manually / Quick fill
            </button>
            {hasMeaningfulContent && (
              <button
                type="button"
                className="admin-button admin-button-secondary admin-btn-clear"
                onClick={() => {
                  if (window.confirm("Clear all fields and start a fresh product? Any unsaved edits will be discarded.")) {
                    resetForm();
                    showGlobalStatus("Form cleared. Ready for a new product.", "info", 3000);
                  }
                }}
                disabled={busy}
                title="Discard all changes and start with a blank form"
              >
                Start fresh / Clear
              </button>
            )}
          </div>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Product name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="admin-field" style={{ position: "relative" }}>
            <AdminGstPriceHelper
              price={priceInr}
              onApplyPrice={(newPrice, rate) => {
                setPriceInr(newPrice);
                if (rate > 0) setTaxRate(String(rate));
              }}
            />
            <input
              value={priceInr}
              onChange={(event) => setPriceInr(event.target.value)}
              type="number"
              min="1"
              required
              placeholder="e.g. 899"
            />
          </div>
          <div className="admin-field full">
            <label>Product images (up to 8)</label>
            <input
              id="product-image-upload"
              className="admin-file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                event.target.files && upload(event.target.files)
              }
            />
            <label className="admin-upload-zone" htmlFor="product-image-upload">
              <span className="admin-upload-icon" aria-hidden="true">
                ＋
              </span>
              <strong>
                {images.length ? "Add more images" : "Upload product images"}
              </strong>
              <small>PNG, JPG or WebP · Maximum 8 MB each</small>
              <span className="admin-upload-actions">
                <b>Browse files</b>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById("product-camera-upload")?.click();
                  }}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M4 7h3l1.5-2h7L17 7h3v12H4z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </svg>
                  Camera
                </button>
              </span>
            </label>
            <input
              id="product-camera-upload"
              className="admin-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) =>
                event.target.files && upload(event.target.files)
              }
            />
          </div>
        </div>
        {(images.length > 0 || pendingImages.length > 0) && (
          <div className="admin-image-grid">
            {images.map((url, index) => {
              const assigned = imageColors[url] || "";
              const swatch = assigned ? getColorSwatch(assigned) : null;
              return (
                <div className="admin-image-card" key={url}>
                  <div style={{ position: "relative" }}>
                    <img src={url} alt={`Uploaded product ${index + 1}`} />
                    {index === 0 && <small>HERO</small>}
                    {assigned && swatch && (
                      <span className="admin-image-color-pill">
                        <span
                          className="admin-image-color-dot"
                          style={{
                            background: swatch.bg,
                            border: swatch.border ? `1px solid ${swatch.border}` : "none",
                          }}
                        />
                        {assigned}
                      </span>
                    )}
                  </div>
                  <div className="admin-image-card-footer">
                    <div className="admin-image-color-selector">
                      <div className="admin-image-color-header">
                        <label>Colour</label>
                        <span className="admin-image-color-current" title={assigned || "All Colours (Shared)"}>
                          {assigned ? assigned : "All Colours"}
                        </span>
                      </div>
                      <div className="admin-image-color-swatches">
                        <button
                          type="button"
                          className={`admin-swatch-circle-btn ${!assigned ? "chosen" : ""}`}
                          onClick={() =>
                            setImageColors((prev) => ({
                              ...prev,
                              [url]: "",
                            }))
                          }
                          title="All Colours (Shared across all variants)"
                          aria-label="All Colours (Shared)"
                        >
                          <span className="admin-swatch-circle-disc admin-disc-all">
                            {!assigned ? (
                              <svg className="admin-swatch-check" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#733b36" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span className="admin-all-icon">∞</span>
                            )}
                          </span>
                          <span className="admin-swatch-tooltip">All Colours (Shared)</span>
                        </button>
                        {generated.colors.map((colorName) => {
                          const cSwatch = getColorSwatch(colorName);
                          const isChosen = (assigned || "").toLowerCase() === colorName.toLowerCase();
                          return (
                            <button
                              type="button"
                              key={colorName}
                              className={`admin-swatch-circle-btn ${isChosen ? "chosen" : ""}`}
                              onClick={() =>
                                setImageColors((prev) => ({
                                  ...prev,
                                  [url]: colorName,
                                }))
                              }
                              title={colorName}
                              aria-label={`Assign to ${colorName}`}
                            >
                              <span
                                className="admin-swatch-circle-disc"
                                style={{
                                  background: cSwatch.bg,
                                  border: cSwatch.border ? `1px solid ${cSwatch.border}` : "1px solid rgba(0,0,0,0.12)",
                                }}
                              >
                                {isChosen && (
                                  <svg className="admin-swatch-check" viewBox="0 0 12 12" fill="none">
                                    <path
                                      d="M2.5 6.2L4.8 8.5L9.5 3.5"
                                      stroke={cSwatch.isLight ? "#2a1c18" : "#ffffff"}
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                              <span className="admin-swatch-tooltip">{colorName}</span>
                            </button>
                          );
                        })}
                      </div>
                      {generated.colors.length === 0 && (
                        <p className="admin-image-no-colors">
                          Pick colours below to assign photos to specific shades.
                        </p>
                      )}
                    </div>
                    <div className="admin-image-card-actions">
                      <button
                        type="button"
                        className={index === 0 ? "active" : ""}
                        onClick={() => {
                          setImages((current) => [url, ...current.filter((u) => u !== url)]);
                        }}
                        title={index === 0 ? "Main cover photo" : "Make main cover photo"}
                      >
                        {index === 0 ? "Hero" : "Set Hero"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImages((current) => current.filter((item) => item !== url));
                          setImageColors((prev) => {
                            const next = { ...prev };
                            delete next[url];
                            return next;
                          });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {assigned && swatch && (
                    <span className="admin-image-color-pill">
                      <span
                        className="admin-image-color-dot"
                        style={{
                          background: swatch.bg,
                          border: swatch.border ? `1px solid ${swatch.border}` : "none",
                        }}
                      />
                      {assigned}
                    </span>
                  )}
                  {index === 0 && <small>HERO</small>}
                </div>
              );
            })}
            {pendingImages.map((url, index) => (
              <div className="admin-image-card is-uploading" key={url}>
                <img src={url} alt={`Uploading product ${index + 1}`} />
                <span>Uploading…</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {statusText && (
        <div className="admin-notice" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{statusText}</span>
          <button type="button" className="admin-notice-dismiss" onClick={() => setStatusText("")} aria-label="Dismiss notice">×</button>
        </div>
      )}
      {error && (
        <div className="admin-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{error}</span>
          <button type="button" className="admin-notice-dismiss" onClick={() => setError("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      {aiGenerated && (
        <div className="admin-generated-content">
          <div className="admin-section-title">Product details</div>
          <div className="admin-form-grid">
            <div className="admin-field">
              <label>URL slug</label>
              <input
                value={generated.slug}
                onChange={(event) => update("slug", event.target.value)}
                required
                pattern="[a-z0-9-]+"
              />
            </div>
            <div className="admin-field">
              <label>Base SKU</label>
              <input
                value={generated.sku}
                onChange={(event) => update("sku", event.target.value)}
                required
              />
            </div>
            <div className="admin-publish-ready">
              <strong>Publishes automatically</strong>
              <span>Complete the required details and it will appear in the shop immediately.</span>
            </div>
            <div className="admin-field">
              <label>Compare-at price</label>
              <input name="compareAtPriceInr" type="number" min="1" value={compareAtPrice} onChange={(event) => setCompareAtPrice(event.target.value)} />
            </div>
            <div className="admin-field full">
              <label>Short description</label>
              <input
                value={generated.shortDescription}
                maxLength={100}
                onChange={(event) =>
                  update("shortDescription", event.target.value)
                }
              />
            </div>
            <div className="admin-field full">
              <label>Full description</label>
              <textarea
                value={generated.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </div>
            <div className="admin-field"><label>Category</label><UniversalSelect value={generated.category} onChange={(event) => setGenerated((current) => ({ ...current, category: event.target.value, subcategory: "" }))} required><option value="">Select category</option>{PRODUCT_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</UniversalSelect></div>
            <div className="admin-field"><label>Subcategory</label><UniversalSelect value={generated.subcategory} onChange={(event) => update("subcategory", event.target.value)} disabled={!generated.category || !(PRODUCT_TAXONOMY[generated.category as keyof typeof PRODUCT_TAXONOMY]?.length)}><option value="">None</option>{generated.category && PRODUCT_TAXONOMY[generated.category as keyof typeof PRODUCT_TAXONOMY]?.map((value) => <option key={value}>{value}</option>)}</UniversalSelect></div>
            <div className="admin-field full"><label>Wear type</label><div className="admin-checks">{OCCASIONS.map((value) => <label key={value}><input type="checkbox" checked={generated.occasions.includes(value)} onChange={(event) => update("occasions", event.target.checked ? [...generated.occasions, value] : generated.occasions.filter((item) => item !== value))} />{value}</label>)}</div></div>
            <div className="admin-field">
              <label>Tags</label>
              <input
                value={generated.tags.join(", ")}
                onChange={(event) =>
                  update(
                    "tags",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
            <div className="admin-field full">
              <div className="admin-inline-heading">
                <label>Sizes and inventory</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#bb7068",
                      background: "#fbf0eb",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "1px solid #ebdcd0",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setSizeInventory(
                        DEFAULT_SIZES_UP_TO_4XL.map((size) => ({ size, quantity: 0 }))
                      )
                    }
                  >
                    + Load XS–4XL
                  </button>
                  <button type="button" onClick={() => setSizeInventory((current) => [...current, { size: "", quantity: 0 }])}>+ Add size</button>
                </div>
              </div>
              <div className="admin-compact-size-list">
                {sizeInventory.map((item, index) => (
                  <div className="admin-compact-size-row" key={index}>
                    <label><span>Size</span><input value={item.size} placeholder="XS" onChange={(event) => setSizeInventory((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, size: event.target.value } : row))} /></label>
                    <label><span>Quantity</span><span className="admin-quantity-stepper">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setSizeInventory((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Math.max(0, row.quantity - 1) } : row))}>−</button>
                      <input type="number" min="0" value={item.quantity} onChange={(event) => setSizeInventory((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Math.max(0, Number(event.target.value)) } : row))} />
                      <button type="button" aria-label="Increase quantity" onClick={() => setSizeInventory((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: row.quantity + 1 } : row))}>+</button>
                    </span></label>
                    <button type="button" className="admin-compact-remove" aria-label="Remove size" onClick={() => setSizeInventory((current) => current.filter((_, rowIndex) => rowIndex !== index))}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-field">
              <label>Material</label>
              <input
                value={generated.material}
                onChange={(event) => update("material", event.target.value)}
              />
            </div>
            <div className="admin-field full">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label style={{ margin: 0 }}>Colours & Shades</label>
                {name.trim() && (
                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "1px solid #ebdcd0",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "11px",
                      color: "#bb7068",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const detected = detectColorFromName(name);
                      if (detected.length) {
                        const merged = Array.from(new Set([...generated.colors, ...detected]));
                        update("colors", merged);
                        showGlobalStatus(`Detected: ${detected.join(", ")}`, "success", 3000);
                      } else {
                        showGlobalStatus("No known color found in product name", "info", 3000);
                      }
                    }}
                  >
                    Auto-detect from Title
                  </button>
                )}
              </div>

              <div className="admin-colors-container">
                <div className="admin-selected-colors">
                  {generated.colors.length > 0 ? (
                    generated.colors.map((color) => {
                      const swatch = getColorSwatch(color);
                      return (
                        <span key={color} className="admin-color-tag">
                          <span
                            className="admin-color-swatch-dot"
                            style={{
                              background: swatch.bg,
                              border: swatch.border ? `1px solid ${swatch.border}` : "none",
                            }}
                          />
                          {color}
                          <button
                            type="button"
                            onClick={() => removeColor(color)}
                            title={`Remove ${color}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="admin-no-colors-hint">
                      No colours selected. Pick from popular shades below or add a custom shade.
                    </span>
                  )}
                </div>

                <div className="admin-custom-color-row">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (customColor.trim()) {
                          toggleColor(customColor.trim());
                          setCustomColor("");
                        }
                      }
                    }}
                    placeholder="Add custom colour (e.g. Wine, Dusty Rose, Champagne, Rust)..."
                  />
                  <button
                    type="button"
                    className="admin-editor-action"
                    onClick={() => {
                      if (customColor.trim()) {
                        toggleColor(customColor.trim());
                        setCustomColor("");
                      }
                    }}
                  >
                    + Add Shade
                  </button>
                </div>

                <div className="admin-quick-colors">
                  <small>Quick Pick Boutique Shades</small>
                  <div className="admin-color-swatches-grid">
                    {POPULAR_PRODUCT_COLORS.map((item) => {
                      const swatch = getColorSwatch(item.name);
                      const isSelected = generated.colors.some(
                        (c) => c.toLowerCase() === item.name.toLowerCase()
                      );
                      return (
                        <button
                          key={item.name}
                          type="button"
                          className={`admin-swatch-circle-btn large ${isSelected ? "chosen" : ""}`}
                          onClick={() => toggleColor(item.name)}
                          title={item.name}
                          aria-label={`Toggle colour ${item.name}`}
                        >
                          <span
                            className="admin-swatch-circle-disc"
                            style={{
                              background: swatch.bg,
                              border: swatch.border ? `1px solid ${swatch.border}` : "1px solid rgba(0,0,0,0.12)",
                            }}
                          >
                            {isSelected && (
                              <svg className="admin-swatch-check" viewBox="0 0 12 12" fill="none">
                                <path
                                  d="M2.5 6.2L4.8 8.5L9.5 3.5"
                                  stroke={swatch.isLight ? "#2a1c18" : "#ffffff"}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="admin-swatch-tooltip">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-field full">
              <label>Care instructions</label>
              <textarea
                value={generated.careInstructions}
                onChange={(event) =>
                  update("careInstructions", event.target.value)
                }
              />
            </div>
            <div className="admin-field full">
              <label>Style notes</label>
              <textarea
                value={generated.styleNotes}
                onChange={(event) => update("styleNotes", event.target.value)}
              />
            </div>
            <div className="admin-field">
              <label>SEO title</label>
              <input
                value={generated.seoTitle}
                onChange={(event) => update("seoTitle", event.target.value)}
              />
            </div>
            <div className="admin-field">
              <label>SEO description</label>
              <input
                value={generated.seoDescription}
                onChange={(event) =>
                  update("seoDescription", event.target.value)
                }
              />
            </div>
            <div className="admin-field full">
              <label>Search keywords</label>
              <input
                value={generated.searchKeywords.join(", ")}
                onChange={(event) =>
                  update(
                    "searchKeywords",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
            {images.length === 0 && (
              <div className="admin-field full">
                <label>Hero image URL (fallback)</label>
                <input name="heroImageUrl" type="url" required />
              </div>
            )}
          </div>
          <div className="admin-checks">
            <label>
              <input name="isBestSeller" type="checkbox" checked={isBestSeller} onChange={(event) => setIsBestSeller(event.target.checked)} /> Best Seller
            </label>
            <label>
              <input name="isNewArrival" type="checkbox" checked={isNewArrival} onChange={(event) => setIsNewArrival(event.target.checked)} /> New Arrival
            </label>
            <label>
              <input name="isFeatured" type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} /> Featured
            </label>
          </div>
          <div ref={saveMessageRef} aria-live="assertive">
            {error && <div className="admin-error admin-save-error">{error}</div>}
          </div>
          <button className="admin-button" disabled={busy}>
            {busy ? "Working…" : "Save product"}
          </button>
        </div>
      )}
    </form>
  );
}
