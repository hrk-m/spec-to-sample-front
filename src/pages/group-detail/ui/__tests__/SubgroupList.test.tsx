import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteSubgroup } from "@/pages/group-detail/api/delete-subgroup";
import type { SubgroupSummary } from "@/pages/group-detail/model/group-detail";
import { SubgroupList } from "@/pages/group-detail/ui/SubgroupList";

vi.mock("@/pages/group-detail/api/delete-subgroup", () => ({
  deleteSubgroup: vi.fn(),
}));

const mockDeleteSubgroup = deleteSubgroup as ReturnType<typeof vi.fn>;

const sampleSubgroups: SubgroupSummary[] = [
  { id: 2, name: "Frontend Team", description: "Frontend engineers", member_count: 5 },
  { id: 3, name: "Backend Team", description: "Backend engineers", member_count: 3 },
];

describe("SubgroupList", () => {
  // テスト #10: 正常系 — サブグループ一覧が描画される
  it("サブグループ一覧が描画される", () => {
    render(<SubgroupList groupId={1} subgroups={sampleSubgroups} error={null} refetch={vi.fn()} />);

    expect(screen.getByText("Frontend Team")).toBeInTheDocument();
    expect(screen.getByText("Backend Team")).toBeInTheDocument();
  });

  // テスト #11: 正常系 — 空リストの場合の表示
  it("空リストの場合に空状態メッセージが表示される", () => {
    render(<SubgroupList groupId={1} subgroups={[]} error={null} refetch={vi.fn()} />);

    expect(screen.getByText("サブグループはまだありません")).toBeInTheDocument();
  });

  describe("delete-subgroup 確認ダイアログ", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    // テスト #1: [Delete] 押下 → AlertDialog が開く
    it("[Delete]ボタン押下→AlertDialogが表示される", async () => {
      const user = userEvent.setup();

      render(
        <SubgroupList groupId={1} subgroups={sampleSubgroups} error={null} refetch={vi.fn()} />,
      );

      const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
      const firstButton = deleteButtons[0];
      if (!firstButton) throw new Error("Delete ボタンが見つかりません");
      await user.click(firstButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    // テスト #2: ダイアログの Delete 押下 → 204 成功 → ダイアログが閉じ、refetch が呼ばれる
    it("ダイアログのDeleteボタン押下→204成功→ダイアログが閉じrefetchが呼ばれる", async () => {
      const user = userEvent.setup();
      const refetch = vi.fn();
      mockDeleteSubgroup.mockResolvedValueOnce(undefined);

      render(
        <SubgroupList groupId={1} subgroups={sampleSubgroups} error={null} refetch={refetch} />,
      );

      // ダイアログを開く
      const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
      const firstButton = deleteButtons[0];
      if (!firstButton) throw new Error("Delete ボタンが見つかりません");
      await user.click(firstButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      // ダイアログ内の Delete ボタンをクリック
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeleteSubgroup).toHaveBeenCalledWith(1, 2);
        expect(refetch).toHaveBeenCalledOnce();
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    // テスト #3: ダイアログの Delete 押下 → 404 → エラーメッセージ表示、ダイアログは閉じない
    it("ダイアログのDeleteボタン押下→404→ダイアログ内にエラーメッセージが表示されダイアログは閉じない", async () => {
      const user = userEvent.setup();
      const refetch = vi.fn();
      const { HttpError } = await import("@/shared/api");
      mockDeleteSubgroup.mockRejectedValueOnce(new HttpError(404, "Not Found"));

      render(
        <SubgroupList groupId={1} subgroups={sampleSubgroups} error={null} refetch={refetch} />,
      );

      // ダイアログを開く
      const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
      const firstButton = deleteButtons[0];
      if (!firstButton) throw new Error("Delete ボタンが見つかりません");
      await user.click(firstButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      // ダイアログ内の Delete ボタンをクリック
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText("対象のサブグループ関係が見つかりませんでした"),
        ).toBeInTheDocument();
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });
    });

    // テスト #4: ダイアログの Delete 押下 → 500 → 汎用エラーメッセージ表示
    it("ダイアログのDeleteボタン押下→500→ダイアログ内に汎用エラーメッセージが表示される", async () => {
      const user = userEvent.setup();
      const refetch = vi.fn();
      const { HttpError } = await import("@/shared/api");
      mockDeleteSubgroup.mockRejectedValueOnce(new HttpError(500, "Internal Server Error"));

      render(
        <SubgroupList groupId={1} subgroups={sampleSubgroups} error={null} refetch={refetch} />,
      );

      // ダイアログを開く
      const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
      const firstButton = deleteButtons[0];
      if (!firstButton) throw new Error("Delete ボタンが見つかりません");
      await user.click(firstButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      // ダイアログ内の Delete ボタンをクリック
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText("サブグループの削除に失敗しました。しばらくしてから再度お試しください"),
        ).toBeInTheDocument();
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      expect(refetch).not.toHaveBeenCalled();
    });

    // テスト #5: ダイアログの Cancel 押下 → ダイアログが閉じ、API は呼ばれない
    it("ダイアログのCancelボタン押下→ダイアログが閉じAPIは呼ばれない", async () => {
      const user = userEvent.setup();
      const refetch = vi.fn();

      render(
        <SubgroupList groupId={1} subgroups={sampleSubgroups} error={null} refetch={refetch} />,
      );

      // ダイアログを開く
      const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
      const firstButton = deleteButtons[0];
      if (!firstButton) throw new Error("Delete ボタンが見つかりません");
      await user.click(firstButton);

      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      });

      // Cancel ボタンをクリック
      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });

      expect(mockDeleteSubgroup).not.toHaveBeenCalled();
      expect(refetch).not.toHaveBeenCalled();
    });
  });
});
