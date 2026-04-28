import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SubgroupSummary } from "@/pages/group-detail/model/group-detail";
import { SubgroupList } from "@/pages/group-detail/ui/SubgroupList";

const sampleSubgroups: SubgroupSummary[] = [
  { id: 2, name: "Frontend Team", description: "Frontend engineers", member_count: 5 },
  { id: 3, name: "Backend Team", description: "Backend engineers", member_count: 3 },
];

describe("SubgroupList", () => {
  // テスト #10: 正常系 — サブグループ一覧が描画される
  it("サブグループ一覧が描画される", () => {
    render(<SubgroupList subgroups={sampleSubgroups} error={null} onDelete={vi.fn()} />);

    expect(screen.getByText("Frontend Team")).toBeInTheDocument();
    expect(screen.getByText("Backend Team")).toBeInTheDocument();
  });

  // テスト #11: 正常系 — 空リストの場合の表示
  it("空リストの場合に空状態メッセージが表示される", () => {
    render(<SubgroupList subgroups={[]} error={null} onDelete={vi.fn()} />);

    expect(screen.getByText("サブグループはまだありません")).toBeInTheDocument();
  });

  // テスト #12: 分岐条件 — 削除ボタン押下でコールバックが呼ばれる
  it("削除ボタン押下でonDeleteが正しいidで呼ばれる", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<SubgroupList subgroups={sampleSubgroups} error={null} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole("button", { name: /削除/ });
    const firstButton = deleteButtons[0];
    if (!firstButton) throw new Error("削除ボタンが見つかりません");
    await user.click(firstButton);

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledWith(2);
  });
});
