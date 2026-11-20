import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PackageDraft = {
  packageId: string;
  guests: number;
  includedVarieties: number;
  packagePrice: number;
  extraVarieties: number;
  varieties: { id: string; name: string }[];
  withTreats: boolean;
  treats: { id: string; name: string }[];
  eventDate: string;
  total: number;
};

type PackageDraftState = {
  draft: PackageDraft | null;
  setDraft: (draft: PackageDraft) => void;
  clear: () => void;
};

export const usePackageDraft = create<PackageDraftState>()(
  persist(
    (set) => ({
      draft: null,
      setDraft: (draft) => set({ draft }),
      clear: () => set({ draft: null }),
    }),
    { name: "carisgold-package-draft" }
  )
);
