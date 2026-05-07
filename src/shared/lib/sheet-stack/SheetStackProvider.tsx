import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import { Sheet } from "@/shared/ui";
import { getSheetWidth } from "./sheetPresentation";
import { SheetStackContext, type SheetEntry } from "./SheetStackContext";

const BASE_Z_INDEX = 100;

export function SheetStackProvider({ children }: { children: ReactNode }) {
  const [sheets, setSheets] = useState<SheetEntry[]>([]);
  const onCloseMapRef = useRef<Map<string, () => void>>(new Map());

  const openSheet = useCallback((entry: SheetEntry) => {
    if (entry.onClose) {
      onCloseMapRef.current.set(entry.id, entry.onClose);
    }
    setSheets((prev) => [...prev, entry]);
  }, []);

  const closeSheet = useCallback(() => {
    setSheets((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((sheet, index) =>
        index === prev.length - 1 ? { ...sheet, closing: true } : sheet,
      );
    });
  }, []);

  const removeSheet = useCallback((id: string) => {
    const onClose = onCloseMapRef.current.get(id);
    onCloseMapRef.current.delete(id);
    setSheets((prev) => prev.filter((sheet) => sheet.id !== id));
    onClose?.();
  }, []);

  const closeAll = useCallback(() => {
    const callbacks = Array.from(onCloseMapRef.current.values());
    onCloseMapRef.current.clear();
    setSheets([]);
    callbacks.forEach((cb) => cb());
  }, []);

  const value = useMemo(
    () => ({ sheets, openSheet, closeSheet, removeSheet, closeAll }),
    [sheets, openSheet, closeSheet, removeSheet, closeAll],
  );

  return (
    <SheetStackContext.Provider value={value}>
      {children}
      {sheets.map((sheet, index) => (
        <Sheet
          key={sheet.id}
          onClose={closeSheet}
          onRemove={() => removeSheet(sheet.id)}
          closing={sheet.closing ?? false}
          isTopMost={index === sheets.length - 1 && !sheet.closing}
          zIndex={BASE_Z_INDEX + index * 2}
          width={getSheetWidth(sheets, index)}
        >
          {sheet.content}
        </Sheet>
      ))}
    </SheetStackContext.Provider>
  );
}
