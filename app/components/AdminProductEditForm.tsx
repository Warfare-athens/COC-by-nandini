"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_CATEGORIES, PRODUCT_TAXONOMY, OCCASIONS, publicTags, tagValue, taxonomyTag } from "@/lib/product-taxonomy";

type Variant = {
  id?: string;
  sku: string;
  title: string;
  size: string | null;
  color: string | null;
  price_inr: number | null;
  compare_at_price_inr: number | null;
  inventory_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
};
type ProductImage = {
  id?: string;
  url: string;
  alt_text: string | null;
  is_hero: boolean;
  sort_order: number;
};
type ProductEdit = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  status: string;
  short_description: string | null;
  description: string | null;
  brand: string;
  hero_image_url: string;
  price_inr: number;
  compare_at_price_inr: number | null;
  cost_inr: number | null;
  tax_rate: string;
  hsn_code: string | null;
  weight_grams: number | null;
  material: string | null;
  care_instructions: string | null;
  style_notes: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  search_keywords: string | null;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_featured: boolean;
  product_variants: Variant[];
  product_images: ProductImage[];
};

const text = (form: FormData, key: string) =>
  String(form.get(key) || "").trim() || null;
const number = (form: FormData, key: string) => {
  const value = form.get(key);
  return value === "" || value === null ? null : Number(value);
};

export default function AdminProductEditForm({
  product,
}: {
  product: ProductEdit;
}) {
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>(
    product.product_variants || [],
  );
  const [images, setImages] = useState<ProductImage[]>(
    product.product_images?.length
      ? product.product_images
      : [
          {
            url: product.hero_image_url,
            alt_text: product.name,
            is_hero: true,
            sort_order: 0,
          },
        ],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [category, setCategory] = useState(tagValue(product.tags, "category"));
  const [subcategory, setSubcategory] = useState(tagValue(product.tags, "subcategory"));
  const [occasions, setOccasions] = useState<string[]>(
    OCCASIONS.filter((value) => (product.tags || []).includes(taxonomyTag("occasion", value))),
  );

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number | boolean | null,
  ) =>
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant,
      ),
    );
  const updateVariantSize = (index: number, value: string) =>
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              size: value,
              title: value ? `Size ${value}` : "Size",
              sku: variant.id
                ? variant.sku
                : `${product.sku || "SKU"}-${value.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`,
            }
          : variant,
      ),
    );
  const addVariant = () =>
    setVariants((current) => [
      ...current,
      {
        sku: `${product.sku || "SKU"}-${current.length + 1}`,
        title: "New variant",
        size: "",
        color: "",
        price_inr: null,
        compare_at_price_inr: null,
        inventory_quantity: 0,
        low_stock_threshold: 3,
        is_active: true,
      },
    ]);
  const removeVariant = (index: number) =>
    setVariants((current) =>
      current.filter((_, variantIndex) => variantIndex !== index),
    );
  const changeQuantity = (index: number, amount: number) =>
    setVariants((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              inventory_quantity: Math.max(
                0,
                variant.inventory_quantity + amount,
              ),
            }
          : variant,
      ),
    );
  const setHero = (index: number) =>
    setImages((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        is_hero: imageIndex === index,
      })),
    );
  const removeImage = (index: number) =>
    setImages((current) => {
      const next = current
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({ ...image, sort_order: imageIndex }));
      if (next.length && !next.some((image) => image.is_hero))
        next[0].is_hero = true;
      return next;
    });
  const uploadImages = async (files: FileList) => {
    setBusy(true);
    setError("");
    setNotice("Uploading images…");
    try {
      const uploaded: ProductImage[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/admin/upload", {
          method: "POST",
          body: form,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        uploaded.push({
          url: data.url,
          alt_text: product.name,
          is_hero: images.length === 0 && uploaded.length === 0,
          sort_order: images.length + uploaded.length,
        });
      }
      setImages((current) => [...current, ...uploaded]);
      setNotice(
        `${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`,
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("Saving changes…");
    const form = new FormData(event.currentTarget);
    const hero = images.find((image) => image.is_hero) || images[0];
    const body = {
      name: text(form, "name"),
      slug: text(form, "slug"),
      sku: text(form, "sku"),
      status: form.get("status"),
      short_description: text(form, "short_description"),
      description: text(form, "description"),
      brand: text(form, "brand"),
      hero_image_url: hero?.url || product.hero_image_url,
      price_inr: Number(form.get("price_inr")),
      compare_at_price_inr: number(form, "compare_at_price_inr"),
      cost_inr: number(form, "cost_inr"),
      tax_rate: String(form.get("tax_rate") || "0"),
      hsn_code: text(form, "hsn_code"),
      weight_grams: number(form, "weight_grams"),
      material: text(form, "material"),
      care_instructions: text(form, "care_instructions"),
      style_notes: text(form, "style_notes"),
      tags: [
        ...String(form.get("tags") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
        ...(category ? [taxonomyTag("category", category)] : []),
        ...(subcategory ? [taxonomyTag("subcategory", subcategory)] : []),
        ...occasions.map((value) => taxonomyTag("occasion", value)),
      ],
      seo_title: text(form, "seo_title"),
      seo_description: text(form, "seo_description"),
      search_keywords: text(form, "search_keywords"),
      is_best_seller: form.get("is_best_seller") === "on",
      is_new_arrival: form.get("is_new_arrival") === "on",
      is_featured: form.get("is_featured") === "on",
      variants: variants.map((variant) => ({
        ...variant,
        size: variant.size || null,
        color: variant.color || null,
        price_inr: variant.price_inr || null,
        compare_at_price_inr: variant.compare_at_price_inr || null,
      })),
      images: images.map((image, index) => ({ ...image, sort_order: index })),
    };
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNotice("Product updated.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save product.",
      );
      setNotice("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-form admin-product-editor" onSubmit={submit}>
      <section className="admin-editor-section">
        <div className="admin-editor-title">
          <h2>Basic information</h2>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field full">
            <label>Product name</label>
            <input name="name" defaultValue={product.name} required />
          </div>
          <div className="admin-field">
            <label>URL slug</label>
            <input
              name="slug"
              defaultValue={product.slug}
              pattern="[a-z0-9-]+"
              required
            />
          </div>
          <div className="admin-field">
            <label>Base SKU</label>
            <input name="sku" defaultValue={product.sku} required />
          </div>
          <div className="admin-field">
            <label>Brand</label>
            <input name="brand" defaultValue={product.brand} required />
          </div>
          <div className="admin-field">
            <label>Status</label>
            <select name="status" defaultValue={product.status}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="admin-field full">
            <label>Short description</label>
            <input
              name="short_description"
              defaultValue={product.short_description || ""}
            />
          </div>
          <div className="admin-field full">
            <label>Full description</label>
            <textarea
              name="description"
              defaultValue={product.description || ""}
            />
          </div>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-title">
          <h2>Pricing and tax</h2>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field"><label>Category</label><select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory(""); }}><option value="">Select category</option>{PRODUCT_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="admin-field"><label>Subcategory</label><select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} disabled={!category || !PRODUCT_TAXONOMY[category as keyof typeof PRODUCT_TAXONOMY]?.length}><option value="">None</option>{category && PRODUCT_TAXONOMY[category as keyof typeof PRODUCT_TAXONOMY]?.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="admin-field full"><label>Wear type</label><div className="admin-checks">{OCCASIONS.map((value) => <label key={value}><input type="checkbox" checked={occasions.includes(value)} onChange={(event) => setOccasions((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))} />{value}</label>)}</div></div>
          <div className="admin-field">
            <label>Selling price</label>
            <input
              name="price_inr"
              type="number"
              min="1"
              defaultValue={product.price_inr}
              required
            />
          </div>
          <div className="admin-field">
            <label>Compare-at price</label>
            <input
              name="compare_at_price_inr"
              type="number"
              min="1"
              defaultValue={product.compare_at_price_inr || ""}
            />
          </div>
          <div className="admin-field">
            <label>Cost price</label>
            <input
              name="cost_inr"
              type="number"
              min="0"
              defaultValue={product.cost_inr || ""}
            />
          </div>
          <div className="admin-field">
            <label>Tax rate (%)</label>
            <input
              name="tax_rate"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product.tax_rate || "0"}
            />
          </div>
          <div className="admin-field">
            <label>HSN code</label>
            <input name="hsn_code" defaultValue={product.hsn_code || ""} />
          </div>
          <div className="admin-field">
            <label>Weight (grams)</label>
            <input
              name="weight_grams"
              type="number"
              min="0"
              defaultValue={product.weight_grams || ""}
            />
          </div>
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-title">
          <h2>Images</h2>
          <label className="admin-editor-action">
            Add images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) =>
                event.target.files && uploadImages(event.target.files)
              }
            />
          </label>
        </div>
        <div className="admin-edit-image-grid">
          {images.map((image, index) => (
            <article className="admin-edit-image" key={image.id || image.url}>
              <img src={image.url} alt={image.alt_text || product.name} />
              <input
                value={image.alt_text || ""}
                onChange={(event) =>
                  setImages((current) =>
                    current.map((item, imageIndex) =>
                      imageIndex === index
                        ? { ...item, alt_text: event.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Alt text"
              />
              <div>
                <button
                  type="button"
                  className={image.is_hero ? "active" : ""}
                  onClick={() => setHero(index)}
                >
                  {image.is_hero ? "Hero image" : "Set as hero"}
                </button>
                <button type="button" onClick={() => removeImage(index)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-title">
          <h2>Variants and inventory</h2>
          <button
            type="button"
            className="admin-editor-action"
            onClick={addVariant}
          >
            Add size
          </button>
        </div>
        <div className="admin-compact-size-list">
          {variants.map((variant, index) => (
            <div className="admin-compact-size-row" key={variant.id || index}>
              <label>
                <span>Size</span>
                <input
                  value={variant.size || ""}
                  onChange={(event) =>
                    updateVariantSize(index, event.target.value)
                  }
                  placeholder="XS"
                />
              </label>
              <label>
                <span>Quantity</span>
                <span className="admin-quantity-stepper">
                  <button type="button" onClick={() => changeQuantity(index, -1)} aria-label="Decrease quantity">−</button>
                  <input
                    type="number"
                    min="0"
                    value={variant.inventory_quantity}
                    onChange={(event) =>
                      updateVariant(index, "inventory_quantity", Math.max(0, Number(event.target.value)))
                    }
                  />
                  <button type="button" onClick={() => changeQuantity(index, 1)} aria-label="Increase quantity">+</button>
                </span>
              </label>
              <button type="button" className="admin-compact-remove" onClick={() => removeVariant(index)} aria-label="Remove size">×</button>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-editor-section">
        <div className="admin-editor-title">
          <h2>Product details</h2>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>Material</label>
            <input name="material" defaultValue={product.material || ""} />
          </div>
          <div className="admin-field">
            <label>Tags</label>
            <input name="tags" defaultValue={publicTags(product.tags).join(", ")} />
          </div>
          <div className="admin-field full">
            <label>Care instructions</label>
            <textarea
              name="care_instructions"
              defaultValue={product.care_instructions || ""}
            />
          </div>
          <div className="admin-field full">
            <label>Style notes</label>
            <textarea
              name="style_notes"
              defaultValue={product.style_notes || ""}
            />
          </div>
        </div>
      </section>
      <section className="admin-editor-section">
        <div className="admin-editor-title">
          <h2>Search and SEO</h2>
        </div>
        <div className="admin-form-grid">
          <div className="admin-field">
            <label>SEO title</label>
            <input name="seo_title" defaultValue={product.seo_title || ""} />
          </div>
          <div className="admin-field">
            <label>Search keywords</label>
            <input
              name="search_keywords"
              defaultValue={product.search_keywords || ""}
            />
          </div>
          <div className="admin-field full">
            <label>SEO description</label>
            <textarea
              name="seo_description"
              defaultValue={product.seo_description || ""}
            />
          </div>
        </div>
      </section>
      <section className="admin-editor-section">
        <div className="admin-editor-title">
          <h2>Storefront placement</h2>
        </div>
        <div className="admin-checks">
          <label>
            <input
              name="is_best_seller"
              type="checkbox"
              defaultChecked={product.is_best_seller}
            />{" "}
            Best Seller
          </label>
          <label>
            <input
              name="is_new_arrival"
              type="checkbox"
              defaultChecked={product.is_new_arrival}
            />{" "}
            New Arrival
          </label>
          <label>
            <input
              name="is_featured"
              type="checkbox"
              defaultChecked={product.is_featured}
            />{" "}
            Featured
          </label>
        </div>
      </section>
      {notice && <div className="admin-notice">{notice}</div>}
      {error && <div className="admin-error">{error}</div>}
      <div className="admin-editor-save">
        <button className="admin-button" disabled={busy}>
          {busy ? "Saving…" : "Save all changes"}
        </button>
        <a href={`/product/${product.slug}`} target="_blank">
          View product
        </a>
      </div>
    </form>
  );
}
