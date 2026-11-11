import type { CartProduct } from "@/components/CartProvider";

type ProductLike = CartProduct & { subcategory: string };

/** Reduz o produto do banco aos campos usados nos cartões e na sacola. */
export const toCard = (p: ProductLike): ProductLike => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  priceCents: p.priceCents,
  imageUrl: p.imageUrl,
  categorySlug: p.categorySlug,
  subcategory: p.subcategory,
});
