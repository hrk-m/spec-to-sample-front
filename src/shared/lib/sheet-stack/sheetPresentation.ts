import { sheetConstants } from "@/shared/ui";
import type { SheetEntry } from "./SheetStackContext";

export function getSheetWidth(sheets: SheetEntry[], index: number): string {
  const lastIndex = sheets.length - 1;
  const topSheet = sheets[lastIndex];

  if (index === lastIndex) {
    return sheetConstants.defaultWidth;
  }

  // 最上段が閉じ始めたら、直下のシートも同時に戻す
  if (topSheet?.closing && index === lastIndex - 1) {
    return sheetConstants.defaultWidth;
  }

  return sheetConstants.fullWidth;
}
