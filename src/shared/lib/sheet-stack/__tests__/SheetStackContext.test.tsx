import type { ReactNode } from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SheetStackProvider, useSheetStack } from "@/shared/lib/sheet-stack";

function wrapper({ children }: { children: ReactNode }) {
  return <SheetStackProvider>{children}</SheetStackProvider>;
}

function StackProbe() {
  const { openSheet } = useSheetStack();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          openSheet({
            id: "sheet-1",
            content: <div>Sheet 1</div>,
          })
        }
      >
        Open Sheet 1
      </button>
      <button
        type="button"
        onClick={() =>
          openSheet({
            id: "sheet-2",
            content: <div>Sheet 2</div>,
          })
        }
      >
        Open Sheet 2
      </button>
    </>
  );
}

describe("SheetStackContext", () => {
  it("openSheet でスタックに 1 枚追加される", () => {
    const { result } = renderHook(() => useSheetStack(), { wrapper });

    act(() => {
      result.current.openSheet({
        id: "test-sheet",
        content: <div>Test</div>,
      });
    });

    expect(result.current.sheets).toHaveLength(1);
    const [firstSheet] = result.current.sheets;
    expect(firstSheet?.id).toBe("test-sheet");
  });

  it("closeSheet で最後のシートに closing フラグが設定される", () => {
    const { result } = renderHook(() => useSheetStack(), { wrapper });

    act(() => {
      result.current.openSheet({
        id: "sheet-1",
        content: <div>Sheet 1</div>,
      });
      result.current.openSheet({
        id: "sheet-2",
        content: <div>Sheet 2</div>,
      });
    });

    expect(result.current.sheets).toHaveLength(2);

    act(() => {
      result.current.closeSheet();
    });

    // closeSheet marks the last sheet as closing, does not remove it
    expect(result.current.sheets).toHaveLength(2);
    const [firstSheet, lastSheet] = result.current.sheets;
    expect(lastSheet?.closing).toBe(true);
    expect(firstSheet?.closing).toBeUndefined();
  });

  it("removeSheet で指定 ID のシートがスタックから削除される", () => {
    const { result } = renderHook(() => useSheetStack(), { wrapper });

    act(() => {
      result.current.openSheet({
        id: "sheet-1",
        content: <div>Sheet 1</div>,
      });
      result.current.openSheet({
        id: "sheet-2",
        content: <div>Sheet 2</div>,
      });
    });

    expect(result.current.sheets).toHaveLength(2);

    act(() => {
      result.current.removeSheet("sheet-2");
    });

    expect(result.current.sheets).toHaveLength(1);
    const [remainingSheet] = result.current.sheets;
    expect(remainingSheet?.id).toBe("sheet-1");
  });

  it("closeSheet → removeSheet の 2 段階でシートが削除される", () => {
    const { result } = renderHook(() => useSheetStack(), { wrapper });

    act(() => {
      result.current.openSheet({
        id: "sheet-1",
        content: <div>Sheet 1</div>,
      });
    });

    act(() => {
      result.current.closeSheet();
    });

    // Still in DOM with closing flag
    expect(result.current.sheets).toHaveLength(1);
    const [closingSheet] = result.current.sheets;
    expect(closingSheet?.closing).toBe(true);

    act(() => {
      result.current.removeSheet("sheet-1");
    });

    // Now actually removed
    expect(result.current.sheets).toHaveLength(0);
  });

  it("removeSheet 時に entry の onClose が 1 回だけ発火する", () => {
    const { result } = renderHook(() => useSheetStack(), { wrapper });
    const onClose = vi.fn();

    act(() => {
      result.current.openSheet({
        id: "sheet-with-callback",
        content: <div>Sheet</div>,
        onClose,
      });
    });

    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      result.current.removeSheet("sheet-with-callback");
    });

    expect(result.current.sheets).toHaveLength(0);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closeAll 時に全シートの onClose が発火する", () => {
    const { result } = renderHook(() => useSheetStack(), { wrapper });
    const onClose1 = vi.fn();
    const onClose2 = vi.fn();

    act(() => {
      result.current.openSheet({
        id: "sheet-1",
        content: <div>Sheet 1</div>,
        onClose: onClose1,
      });
      result.current.openSheet({
        id: "sheet-2",
        content: <div>Sheet 2</div>,
        onClose: onClose2,
      });
    });

    act(() => {
      result.current.closeAll();
    });

    expect(result.current.sheets).toHaveLength(0);
    expect(onClose1).toHaveBeenCalledOnce();
    expect(onClose2).toHaveBeenCalledOnce();
  });

  it("ネストしたときは背面シートが 100vw、最前面シートが 90vw で描画される", () => {
    render(
      <SheetStackProvider>
        <StackProbe />
      </SheetStackProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Sheet 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Sheet 2" }));

    const dialogs = screen.getAllByRole("dialog");
    const [backgroundDialog, foregroundDialog] = dialogs;

    expect(dialogs).toHaveLength(2);
    expect(backgroundDialog?.style.width).toBe("100vw");
    expect(foregroundDialog?.style.width).toBe("90vw");
  });

  it("最上段のシートを閉じ始めると直下のシートも同時に 90vw に戻る", () => {
    render(
      <SheetStackProvider>
        <StackProbe />
      </SheetStackProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Sheet 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Sheet 2" }));

    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    const closeButton = closeButtons[1] ?? closeButtons[0];
    if (!closeButton) {
      throw new Error("Close button not found");
    }
    fireEvent.click(closeButton);

    const dialogs = screen.getAllByRole("dialog");
    const [backgroundDialog, foregroundDialog] = dialogs;

    expect(dialogs).toHaveLength(2);
    expect(backgroundDialog?.style.width).toBe("90vw");
    expect(foregroundDialog?.style.width).toBe("90vw");
  });
});
