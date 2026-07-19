"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_CATEGORIES, PRODUCT_TAXONOMY, OCCASIONS, taxonomyTag } from "@/lib/product-taxonomy";
import { showGlobalStatus } from "@/app/global-status";

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

export default function AdminProductForm() {
  const [name, setName] = useState("");
  const [priceInr, setPriceInr] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [generated, setGenerated] = useState<GeneratedFields>(emptyGenerated);
  const [sizeInventory, setSizeInventory] = useState<SizeInventory[]>([]);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const saveMessageRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(productDraftKey) || "null");
      if (saved) {
        setName(saved.name || "");
        setPriceInr(saved.priceInr || "");
        setImages(Array.isArray(saved.images) ? saved.images : []);
        setGenerated({ ...emptyGenerated, ...(saved.generated || {}) });
        setSizeInventory(Array.isArray(saved.sizeInventory) ? saved.sizeInventory : []);
        setAiGenerated(Boolean(saved.aiGenerated));
        setCompareAtPrice(saved.compareAtPrice || "");
        setIsBestSeller(Boolean(saved.isBestSeller));
        setIsNewArrival(Boolean(saved.isNewArrival));
        setIsFeatured(Boolean(saved.isFeatured));
        setStatusText("Unfinished product restored automatically.");
      }
    } catch {
      localStorage.removeItem(productDraftKey);
    } finally {
      setDraftReady(true);
    }
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    localStorage.setItem(productDraftKey, JSON.stringify({
      name, priceInr, images, generated, sizeInventory, aiGenerated,
      compareAtPrice, isBestSeller, isNewArrival, isFeatured,
    }));
  }, [draftReady, name, priceInr, images, generated, sizeInventory, aiGenerated, compareAtPrice, isBestSeller, isNewArrival, isFeatured]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(busy ? "coc-loader-show" : "coc-loader-hide", {
      detail: busy ? { message: statusText || "Working on product" } : undefined,
    }));
  }, [busy, statusText]);

  const update = (field: keyof GeneratedFields, value: string | string[]) =>
    setGenerated((current) => ({ ...current, [field]: value }));

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

  const generate = async () => {
    if (!name.trim() || !Number(priceInr))
      return setError("Enter the product name and price first.");
    setBusy(true);
    setError("");
    setStatusText("Gemini is analysing the product and images…");
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
      setGenerated(data.product);
      setSizeInventory(
        (data.product.suggestedSizes || []).map((size: string) => ({
          size,
          quantity: 0,
        })),
      );
      setAiGenerated(true);
      setStatusText(
        "Product content generated. Review and edit before saving.",
      );
    } catch (generationError) {
      setStatusText("");
      setError(
        generationError instanceof DOMException && generationError.name === "TimeoutError"
          ? "AI generation took too long. Please tap Generate with AI again."
          : generationError instanceof Error
          ? generationError.message
          : "AI generation failed.",
      );
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
      compareAtPriceInr: compareAtPrice
        ? Number(compareAtPrice)
        : undefined,
      status: "active",
      isBestSeller,
      isNewArrival,
      isFeatured,
      sizes: cleanSizeInventory.map((item) => item.size.trim()),
      sizeInventory: cleanSizeInventory,
      images: images.map((url, index) => ({
        url,
        altText:
          generated.imageAltTexts[index] || generated.shortDescription || name,
      })),
      material: generated.material,
      careInstructions: generated.careInstructions,
      styleNotes: generated.styleNotes,
      tags: [
        ...generated.tags.filter((tag) => !/^(category|subcategory|occasion):/.test(tag)),
        taxonomyTag("category", generated.category),
        ...(generated.subcategory ? [taxonomyTag("subcategory", generated.subcategory)] : []),
        ...generated.occasions.map((value) => taxonomyTag("occasion", value)),
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
      localStorage.removeItem(productDraftKey);
      showGlobalStatus("Product saved and published successfully", "success");
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
      <div className="admin-panel admin-product-builder">
        <div className="admin-product-builder-head">
          <h2>AI product builder</h2>
          <button
            type="button"
            className="admin-button"
            onClick={generate}
            disabled={busy}
          >
            Generate with AI
          </button>
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
          <div className="admin-field">
            <label>Price (INR)</label>
            <input
              value={priceInr}
              onChange={(event) => setPriceInr(event.target.value)}
              type="number"
              min="1"
              required
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
            {images.map((url, index) => (
              <div className="admin-image-card" key={url}>
                <img src={url} alt={`Uploaded product ${index + 1}`} />
                <button
                  type="button"
                  onClick={() =>
                    setImages((current) =>
                      current.filter((item) => item !== url),
                    )
                  }
                >
                  Remove
                </button>
                {index === 0 && <small>HERO</small>}
              </div>
            ))}
            {pendingImages.map((url, index) => (
              <div className="admin-image-card is-uploading" key={url}>
                <img src={url} alt={`Uploading product ${index + 1}`} />
                <span>Uploading…</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {statusText && <div className="admin-notice">{statusText}</div>}
      {error && <div className="admin-error">{error}</div>}

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
            <div className="admin-field"><label>Category</label><select value={generated.category} onChange={(event) => setGenerated((current) => ({ ...current, category: event.target.value, subcategory: "" }))} required><option value="">Select category</option>{PRODUCT_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></div>
            <div className="admin-field"><label>Subcategory</label><select value={generated.subcategory} onChange={(event) => update("subcategory", event.target.value)} disabled={!generated.category || !(PRODUCT_TAXONOMY[generated.category as keyof typeof PRODUCT_TAXONOMY]?.length)}><option value="">None</option>{generated.category && PRODUCT_TAXONOMY[generated.category as keyof typeof PRODUCT_TAXONOMY]?.map((value) => <option key={value}>{value}</option>)}</select></div>
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
                <button type="button" onClick={() => setSizeInventory((current) => [...current, { size: "", quantity: 0 }])}>+ Add size</button>
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
            <div className="admin-field">
              <label>Colours</label>
              <input
                value={generated.colors.join(", ")}
                onChange={(event) =>
                  update(
                    "colors",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  )
                }
              />
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
