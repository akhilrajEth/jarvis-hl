import { AllocationFormat, AllocationItem } from "@/types";

export interface AddModalProps {
  format: AllocationFormat;
  allocation: AllocationItem;
  open: boolean;
  onClose: () => void;
}
