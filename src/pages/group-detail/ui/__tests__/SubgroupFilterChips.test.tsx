import type { SubgroupSummary } from "@/entities/group";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SubgroupFilterChips } from "@/pages/group-detail/ui/SubgroupFilterChips";

const sampleSubgroups: SubgroupSummary[] = [
  { id: 2, name: "Frontend Team", description: "Frontend engineers", member_count: 5 },
  { id: 3, name: "Backend Team", description: "Backend engineers", member_count: 3 },
];

describe("SubgroupFilterChips", () => {
  it("チップ一覧が表示される", () => {
    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2, 3])}
        onToggle={vi.fn()}
        onManageClick={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Frontend Team")).toBeInTheDocument();
    expect(screen.getByLabelText("Backend Team")).toBeInTheDocument();
  });

  it("サブグループ名とメンバー数が表示される", () => {
    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2, 3])}
        onToggle={vi.fn()}
        onManageClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Frontend Team")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Backend Team")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("ON 状態のチップは aria-pressed=true になる", () => {
    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2, 3])}
        onToggle={vi.fn()}
        onManageClick={vi.fn()}
      />,
    );

    const frontendChip = screen.getByLabelText("Frontend Team");
    const backendChip = screen.getByLabelText("Backend Team");
    expect(frontendChip).toHaveAttribute("aria-pressed", "true");
    expect(backendChip).toHaveAttribute("aria-pressed", "true");
  });

  it("OFF 状態のチップは aria-pressed=false になる", () => {
    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2])}
        onToggle={vi.fn()}
        onManageClick={vi.fn()}
      />,
    );

    const backendChip = screen.getByLabelText("Backend Team");
    expect(backendChip).toHaveAttribute("aria-pressed", "false");
  });

  it("チップをクリックすると onToggle コールバックが該当 ID と次の checked 状態で呼ばれる", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2, 3])}
        onToggle={onToggle}
        onManageClick={vi.fn()}
      />,
    );

    // ON 状態のチップをクリック → 次の状態は false（チェック OFF）
    await user.click(screen.getByLabelText("Frontend Team"));
    expect(onToggle).toHaveBeenCalledWith(2, false);
  });

  it("「サブグループ管理」ボタンが常に表示される", () => {
    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2, 3])}
        onToggle={vi.fn()}
        onManageClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "サブグループ管理" })).toBeInTheDocument();
  });

  it("「サブグループ管理」ボタンクリックで onManageClick が呼ばれる", async () => {
    const user = userEvent.setup();
    const onManageClick = vi.fn();

    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2, 3])}
        onToggle={vi.fn()}
        onManageClick={onManageClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "サブグループ管理" }));
    expect(onManageClick).toHaveBeenCalledOnce();
  });

  it("subgroups が空の場合はチップが表示されず「サブグループ管理」ボタンのみ表示される", () => {
    render(
      <SubgroupFilterChips
        subgroups={[]}
        selectedSubgroupIds={new Set()}
        onToggle={vi.fn()}
        onManageClick={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Frontend Team")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "サブグループ管理" })).toBeInTheDocument();
    // チップ行コンテナが DOM に存在しないことを確認
    expect(screen.queryByTestId("chip-row")).not.toBeInTheDocument();
  });

  // PRD #45: 全サブグループがデフォルト selected 状態で表示される
  it("全サブグループのチップがデフォルトで selected（aria-pressed=true）状態で表示される", () => {
    const allIds = new Set(sampleSubgroups.map((sg) => sg.id));

    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={allIds}
        onToggle={vi.fn()}
        onManageClick={vi.fn()}
      />,
    );

    const frontendChip = screen.getByLabelText("Frontend Team");
    const backendChip = screen.getByLabelText("Backend Team");
    expect(frontendChip).toHaveAttribute("aria-pressed", "true");
    expect(backendChip).toHaveAttribute("aria-pressed", "true");
  });

  // PRD #46: チェックを外すと onToggle が (id, false) で呼ばれる
  it("ON 状態のチップをクリックすると onToggle が (id, false) で呼ばれる", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const subgroupWithId28: SubgroupSummary[] = [
      { id: 28, name: "Mobile Team", description: "Mobile engineers", member_count: 4 },
    ];

    render(
      <SubgroupFilterChips
        subgroups={subgroupWithId28}
        selectedSubgroupIds={new Set([28])}
        onToggle={onToggle}
        onManageClick={vi.fn()}
      />,
    );

    // ON 状態（checked = true）をクリック → onToggle(28, false) が呼ばれる
    await user.click(screen.getByLabelText("Mobile Team"));
    expect(onToggle).toHaveBeenCalledWith(28, false);
  });

  // OFF 状態をクリックすると onToggle が (id, true) で呼ばれる
  it("OFF 状態のチップをクリックすると onToggle が (id, true) で呼ばれる", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <SubgroupFilterChips
        subgroups={sampleSubgroups}
        selectedSubgroupIds={new Set([2])}
        onToggle={onToggle}
        onManageClick={vi.fn()}
      />,
    );

    // Backend Team は OFF 状態（id=3 が selectedSubgroupIds にない）
    await user.click(screen.getByLabelText("Backend Team"));
    expect(onToggle).toHaveBeenCalledWith(3, true);
  });
});
