export interface LPAsset {
  name: string;
  address: string;
  image1: string;
  image2: string;
}

export type Asset =
  | { name: string; address: string; image: string; url?: string }
  | LPAsset;
import { AllocationFormat, AllocationItem } from "@/types";

export interface AddModalProps {
  format: AllocationFormat;
  allocation: AllocationItem;
  open: boolean;
  onClose: () => void;
}
