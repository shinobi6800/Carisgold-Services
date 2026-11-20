"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";
import { usePackageDraft } from "@/store/package-draft";

export function ClearOnSuccess({ type }: { type: "juice" | "package" }) {
  const clearCart = useCart((s) => s.clear);
  const clearDraft = usePackageDraft((s) => s.clear);

  useEffect(() => {
    if (type === "juice") clearCart();
    else clearDraft();
  }, [type, clearCart, clearDraft]);

  return null;
}
