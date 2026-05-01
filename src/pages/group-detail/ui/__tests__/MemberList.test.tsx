import { MockIntersectionObserver } from "@/test/setup";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as deleteGroupMembersModule from "@/pages/group-detail/api/delete-group-members";
import { fetchGroupMembers } from "@/pages/group-detail/api/fetch-group-members";
import type { MembersResponse } from "@/pages/group-detail/model/group-detail";
import { clearMemberListCache, FETCH_LIMIT } from "@/pages/group-detail/model/member-list";
import * as memberList from "@/pages/group-detail/model/member-list";
import { MemberList } from "@/pages/group-detail/ui/MemberList";

vi.mock("@/pages/group-detail/api/fetch-group-members", () => ({
  fetchGroupMembers: vi.fn(),
}));

vi.mock("@/pages/group-detail/api/delete-group-members", () => ({
  deleteGroupMembers: vi.fn(),
}));

const GROUP_ID = 1;

const mockMembersResponse: MembersResponse = {
  members: [
    {
      id: 1,
      uuid: "00000000-0000-0000-0000-000000000001",
      first_name: "Taro",
      last_name: "Yamada",
      source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
    },
    {
      id: 2,
      uuid: "00000000-0000-0000-0000-000000000002",
      first_name: "Hanako",
      last_name: "Sato",
      source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
    },
  ],
  total: 2,
};

describe("MemberList", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearMemberListCache();
    MockIntersectionObserver.reset();
  });

  it("ローディング中にスケルトンを表示する", () => {
    vi.mocked(fetchGroupMembers).mockReturnValue(new Promise(() => {}));

    render(<MemberList groupId={GROUP_ID} />);

    expect(screen.getByText("loading members...")).toBeInTheDocument();
  });

  it("メンバー一覧を表示する", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });
    expect(screen.getByText("Sato Hanako")).toBeInTheDocument();
  });

  it("列ヘッダー uuid と 姓名 が columnheader ロールで取得できる", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "uuid" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "姓名" })).toBeInTheDocument();
  });

  it("onRefetch 渡し時に 選択・uuid・姓名 の 3 列ヘッダーがすべて columnheader ロールで取得できる", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "uuid" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "姓名" })).toBeInTheDocument();
    // 選択列ヘッダーは aria-label="選択" を持つ <th> 要素として存在する
    const selectionHeader = document.querySelector('th[aria-label="選択"]');
    expect(selectionHeader).toBeInTheDocument();
  });

  it("アバターアイコン（イニシャル円形）が DOM に存在しない", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    // イニシャル（YT, SH）が DOM に存在しないことを確認
    expect(screen.queryByText("YT")).not.toBeInTheDocument();
    expect(screen.queryByText("SH")).not.toBeInTheDocument();
  });

  it("API エラー時にエラーメッセージを表示する", async () => {
    vi.mocked(fetchGroupMembers).mockRejectedValueOnce(new Error("500 Internal Server Error"));

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Error: 500 Internal Server Error")).toBeInTheDocument();
    });
  });

  it("メンバーが 0 人の場合は空メッセージを表示する", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce({ members: [], total: 0 });

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("No members found.")).toBeInTheDocument();
    });
  });

  it("ページネーション UI（Previous/Next ボタン・件数セレクタ）が存在しない", async () => {
    const manyMembers: MembersResponse = {
      members: Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
        first_name: `First${String(i + 1)}`,
        last_name: `Last${String(i + 1)}`,
        source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
      })),
      total: 50,
    };
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(manyMembers);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Last1 First1")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "20" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "50" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "100" })).not.toBeInTheDocument();
  });

  it("sentinel 要素が DOM に存在する", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId("member-sentinel")).toBeInTheDocument();
    });
  });

  it("fetch 後に cachedMembers の全件が表示される", async () => {
    const manyMembers: MembersResponse = {
      members: Array.from({ length: 55 }, (_, i) => ({
        id: i + 1,
        uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
        first_name: `First${String(i + 1)}`,
        last_name: `Last${String(i + 1)}`,
        source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
      })),
      total: 55,
    };
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(manyMembers);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Last1 First1")).toBeInTheDocument();
    });

    // DISPLAY_STEP 廃止後は全件即時表示される
    expect(screen.getByText("Last51 First51")).toBeInTheDocument();
    expect(screen.getByText("Last55 First55")).toBeInTheDocument();
  });

  it("再表示時はキャッシュを使ってスケルトンを出さない", async () => {
    vi.mocked(fetchGroupMembers)
      .mockResolvedValueOnce(mockMembersResponse)
      .mockReturnValueOnce(new Promise(() => {}));

    const { unmount } = render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    unmount();

    render(<MemberList groupId={GROUP_ID} />);

    expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    expect(screen.queryByText("loading members...")).not.toBeInTheDocument();
  });

  it("検索入力でメンバーを検索できる", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers)
      .mockResolvedValueOnce(mockMembersResponse)
      .mockResolvedValueOnce({
        members: [
          {
            id: 1,
            uuid: "00000000-0000-0000-0000-000000000001",
            first_name: "Taro",
            last_name: "Yamada",
            source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
          },
        ],
        total: 1,
      });

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search members");
    await user.clear(searchInput);
    await user.type(searchInput, "Yamada");

    await waitFor(() => {
      expect(vi.mocked(fetchGroupMembers)).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "Yamada" }),
      );
    });
  });

  it("sentinel が visible になったとき lastBatchSize === FETCH_LIMIT なら次 offset でフェッチする", async () => {
    const initialMembers = Array.from({ length: FETCH_LIMIT }, (_, i) => ({
      id: i + 1,
      uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
      first_name: `First${String(i + 1)}`,
      last_name: `Last${String(i + 1)}`,
      source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
    }));
    const additionalMembers = [
      {
        id: FETCH_LIMIT + 1,
        uuid: "00000000-0000-0000-0000-000000000099",
        first_name: "Extra",
        last_name: "Member",
        source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
      },
    ];

    vi.mocked(fetchGroupMembers)
      .mockResolvedValueOnce({ members: initialMembers, total: FETCH_LIMIT + 1 })
      .mockResolvedValueOnce({ members: additionalMembers, total: FETCH_LIMIT + 1 });

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Last1 First1")).toBeInTheDocument();
    });

    // Trigger sentinel: lastBatchSize === FETCH_LIMIT → doFetchMore fires
    act(() => {
      MockIntersectionObserver.triggerAll([
        { isIntersecting: true, target: document.createElement("div") },
      ]);
    });

    await waitFor(() => {
      expect(vi.mocked(fetchGroupMembers)).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: GROUP_ID, offset: FETCH_LIMIT }),
      );
    });
  });

  it("onMemberClick が渡されたときメンバー行クリックで呼ばれる", async () => {
    const user = userEvent.setup();
    const onMemberClick = vi.fn();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onMemberClick={onMemberClick} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Yamada Taro"));

    expect(onMemberClick).toHaveBeenCalledTimes(1);
    expect(onMemberClick).toHaveBeenCalledWith({
      id: 1,
      uuid: "00000000-0000-0000-0000-000000000001",
      first_name: "Taro",
      last_name: "Yamada",
      source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
    });
  });

  it("追加フェッチ失敗時にリスト末尾にエラーメッセージが表示され、既存アイテムは維持される", async () => {
    const initialMembers = Array.from({ length: FETCH_LIMIT }, (_, i) => ({
      id: i + 1,
      uuid: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
      first_name: `First${String(i + 1)}`,
      last_name: `Last${String(i + 1)}`,
      source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
    }));

    vi.mocked(fetchGroupMembers)
      .mockResolvedValueOnce({ members: initialMembers, total: FETCH_LIMIT + 10 })
      .mockRejectedValueOnce(new Error("500 Internal Server Error"));

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Last1 First1")).toBeInTheDocument();
    });

    // Trigger sentinel: lastBatchSize === FETCH_LIMIT → doFetchMore fires and fails
    act(() => {
      MockIntersectionObserver.triggerAll([
        { isIntersecting: true, target: document.createElement("div") },
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText(/500 Internal Server Error/)).toBeInTheDocument();
    });

    // Existing items are still in DOM
    expect(screen.getByText("Last1 First1")).toBeInTheDocument();
  });

  it("検索で 0 件のとき ページネーション UI が存在しない", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse).mockResolvedValueOnce({
      members: [],
      total: 31,
    });

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search members");
    await user.clear(searchInput);
    await user.type(searchInput, "nonexistent");

    await waitFor(() => {
      expect(screen.getByText("No members found.")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
  });

  it("検索入力がデバウンスされ、最後の入力から 300ms 後にフェッチが発火する", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers)
      .mockResolvedValueOnce(mockMembersResponse)
      .mockResolvedValueOnce({
        members: [
          {
            id: 1,
            uuid: "00000000-0000-0000-0000-000000000001",
            first_name: "Taro",
            last_name: "Yamada",
            source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
          },
        ],
        total: 1,
      });

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const initialCallCount = vi.mocked(fetchGroupMembers).mock.calls.length;

    const searchInput = screen.getByPlaceholderText("Search members");
    await user.type(searchInput, "Yamada");

    // デバウンス後にフェッチが発火する（300ms 後）
    await waitFor(() => {
      expect(vi.mocked(fetchGroupMembers).mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    // 文字ごとに個別フェッチされるのではなく、デバウンス後にまとめて 1 回だけ発火する
    const searchCalls = vi.mocked(fetchGroupMembers).mock.calls.slice(initialCallCount);
    expect(searchCalls).toHaveLength(1);
    expect(vi.mocked(fetchGroupMembers)).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Yamada" }),
    );
  });
});

describe("MemberList - 全選択ヘッダーチェックボックス", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearMemberListCache();
    MockIntersectionObserver.reset();
  });

  it("全未選択時: ヘッダー checkbox が unchecked", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const headerCheckbox = screen.getByTestId("header-checkbox") as HTMLInputElement;
    expect(headerCheckbox.checked).toBe(false);
    expect(headerCheckbox.indeterminate).toBe(false);
  });

  it("全選択時: ヘッダー checkbox が checked", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    // 全メンバーを個別チェック（Radix UI Checkbox は aria-checked で状態確認）
    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    await Promise.all(memberCheckboxes.map((checkbox) => user.click(checkbox)));

    const headerCheckbox = screen.getByTestId("header-checkbox") as HTMLInputElement;
    expect(headerCheckbox.checked).toBe(true);
    expect(headerCheckbox.indeterminate).toBe(false);
  });

  it("一部選択時: ヘッダー checkbox が indeterminate=true", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    // 最初の 1 件だけチェック
    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    await user.click(memberCheckboxes[0] as Element);

    const headerCheckbox = screen.getByTestId("header-checkbox") as HTMLInputElement;
    expect(headerCheckbox.indeterminate).toBe(true);
  });

  it("全未選択→ヘッダークリック: 全行 checked", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const headerCheckbox = screen.getByTestId("header-checkbox");
    await user.click(headerCheckbox);

    // Radix UI Checkbox の checked 状態は aria-checked 属性で確認
    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    for (const checkbox of memberCheckboxes) {
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    }
  });

  it("全選択→ヘッダークリック: 全行 unchecked", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const headerCheckbox = screen.getByTestId("header-checkbox");

    // まず全選択
    await user.click(headerCheckbox);

    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    for (const checkbox of memberCheckboxes) {
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    }

    // ヘッダーをもう一度クリックで全解除
    await user.click(headerCheckbox);

    for (const checkbox of memberCheckboxes) {
      expect(checkbox).toHaveAttribute("aria-checked", "false");
    }
  });

  it("indeterminate→ヘッダークリック: 全行 checked", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    // 最初の 1 件だけチェックして indeterminate にする
    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    await user.click(memberCheckboxes[0] as Element);

    const headerCheckbox = screen.getByTestId("header-checkbox") as HTMLInputElement;
    expect(headerCheckbox.indeterminate).toBe(true);

    // ヘッダークリックで全選択
    await user.click(headerCheckbox);

    for (const checkbox of memberCheckboxes) {
      expect(checkbox).toHaveAttribute("aria-checked", "true");
    }
  });

  it("メンバー 0 件: ヘッダー checkbox が disabled=true", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce({ members: [], total: 0 });

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("No members found.")).toBeInTheDocument();
    });

    const headerCheckbox = screen.getByTestId("header-checkbox") as HTMLInputElement;
    expect(headerCheckbox.disabled).toBe(true);
  });
});

describe("MemberList - メンバー削除", () => {
  let clearCacheSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    clearMemberListCache();
    MockIntersectionObserver.reset();
    clearCacheSpy = vi.spyOn(memberList, "clearMemberListCache");
  });

  afterEach(() => {
    clearCacheSpy.mockRestore();
  });

  it("0 件チェック時は削除ボタンが disabled、1 件以上で enabled になる", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "削除" });
    expect(deleteButton).toBeDisabled();

    const firstMemberCheckbox = screen.getAllByTestId("member-checkbox")[0] as Element;
    await user.click(firstMemberCheckbox);

    expect(deleteButton).not.toBeDisabled();
  });

  it("削除ボタン押下で確認ダイアログが開く", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const firstMemberCheckbox = screen.getAllByTestId("member-checkbox")[0] as Element;
    await user.click(firstMemberCheckbox);

    const deleteButton = screen.getByRole("button", { name: "削除" });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/選択した.*名をグループから削除しますか/)).toBeInTheDocument();
    });
  });

  it("削除成功後に clearMemberListCache と onRefetch が呼ばれ、チェック状態がリセットされる", async () => {
    const user = userEvent.setup();
    const onRefetch = vi.fn();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);
    vi.mocked(deleteGroupMembersModule.deleteGroupMembers).mockResolvedValueOnce(undefined);
    // clearMemberListCache() 後の再フェッチ用モック
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={onRefetch} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const firstMemberCheckbox = screen.getAllByTestId("member-checkbox")[0] as Element;
    await user.click(firstMemberCheckbox);

    const deleteButton = screen.getByRole("button", { name: "削除" });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: "削除する" });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(clearCacheSpy).toHaveBeenCalled();
      expect(onRefetch).toHaveBeenCalled();
    });

    // チェック状態がリセットされ削除ボタンが再び disabled になる
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "削除" })).toBeDisabled();
    });
  });

  it("キャンセルでダイアログが閉じ、チェック状態が維持される", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const firstMemberCheckbox = screen.getAllByTestId("member-checkbox")[0] as Element;
    await user.click(firstMemberCheckbox);

    const deleteButton = screen.getByRole("button", { name: "削除" });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText(/選択した.*名をグループから削除しますか/)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/選択した.*名をグループから削除しますか/)).not.toBeInTheDocument();
    });

    // 削除ボタンはまだ enabled（チェック状態が維持されている）
    expect(screen.getByRole("button", { name: "削除" })).not.toBeDisabled();
  });

  it("4xx/5xx エラー時にエラーメッセージを表示する", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);
    vi.mocked(deleteGroupMembersModule.deleteGroupMembers).mockRejectedValueOnce(
      new Error("500 Internal Server Error"),
    );

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    const firstMemberCheckbox = screen.getAllByTestId("member-checkbox")[0] as Element;
    await user.click(firstMemberCheckbox);

    const deleteButton = screen.getByRole("button", { name: "削除" });
    await user.click(deleteButton);

    const confirmButton = screen.getByRole("button", { name: "削除する" });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText("Error: 500 Internal Server Error")).toBeInTheDocument();
    });
  });
});

// PRD #24-#32: 所属元列 / チェックボックス制御 / 全選択判定
describe("MemberList - 所属元列・子孫メンバー制御", () => {
  const DESCENDANT_GROUP_ID = 99;

  // groupId=1 の直属メンバー2名 + 子孫グループ(id=99)のメンバー1名
  const mixedMembersResponse: MembersResponse = {
    members: [
      {
        id: 1,
        uuid: "00000000-0000-0000-0000-000000000001",
        first_name: "Taro",
        last_name: "Yamada",
        source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
      },
      {
        id: 2,
        uuid: "00000000-0000-0000-0000-000000000002",
        first_name: "Hanako",
        last_name: "Sato",
        source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
      },
      {
        id: 3,
        uuid: "00000000-0000-0000-0000-000000000003",
        first_name: "Jiro",
        last_name: "Tanaka",
        source_groups: [{ group_id: DESCENDANT_GROUP_ID, group_name: "Frontend Team" }],
      },
    ],
    total: 3,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    clearMemberListCache();
    MockIntersectionObserver.reset();
  });

  // #24: 「所属元」列ヘッダーが存在する
  it("#24: 「所属元」列ヘッダーが columnheader ロールで取得できる", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    expect(screen.getByRole("columnheader", { name: "所属元" })).toBeInTheDocument();
  });

  // #25: source_groups に groupId が含まれるとき「自グループ」を表示
  it("#25: source_groups に groupId が含まれる行は「自グループ」と表示される", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    // 直属メンバーの行には「自グループ」が表示される
    const selfGroupCells = screen.getAllByText("自グループ");
    expect(selfGroupCells.length).toBeGreaterThan(0);
  });

  // #26: source_groups に groupId が含まれない行は group_name を表示
  it("#26: source_groups に groupId が含まれない行は group_name を表示する", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mixedMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Tanaka Jiro")).toBeInTheDocument();
    });

    expect(screen.getByText("Frontend Team")).toBeInTheDocument();
  });

  // #27: チェックボックスは親直属行のみ表示、子孫行はセルを空にする
  it("#27: 親直属行のみチェックボックスが表示され、子孫行はチェックボックスなし", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mixedMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Tanaka Jiro")).toBeInTheDocument();
    });

    // 親直属 2 名分のチェックボックスのみ表示される
    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    expect(memberCheckboxes).toHaveLength(2);
  });

  // #28: 親直属メンバークリックで onMemberClick が source_groups を含む UserSummary で呼ばれる
  it("#28: 親直属メンバー行クリックで onMemberClick が source_groups を含む UserSummary で呼ばれる", async () => {
    const user = userEvent.setup();
    const onMemberClick = vi.fn();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mixedMembersResponse);

    render(<MemberList groupId={GROUP_ID} onMemberClick={onMemberClick} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Yamada Taro"));

    expect(onMemberClick).toHaveBeenCalledTimes(1);
    expect(onMemberClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        source_groups: [{ group_id: GROUP_ID, group_name: "Engineering" }],
      }),
    );
  });

  // #29: 子孫由来行クリックで onMemberClick が呼ばれない
  it("#29: 子孫由来メンバー行クリックで onMemberClick が呼ばれない", async () => {
    const user = userEvent.setup();
    const onMemberClick = vi.fn();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mixedMembersResponse);

    render(<MemberList groupId={GROUP_ID} onMemberClick={onMemberClick} />);

    await waitFor(() => {
      expect(screen.getByText("Tanaka Jiro")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Tanaka Jiro"));

    expect(onMemberClick).not.toHaveBeenCalled();
  });

  // #30: 全選択チェックボックスは親直属メンバー数基準で判定される
  it("#30: 全選択チェックボックスは親直属メンバー数（子孫除く）基準で checked になる", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mixedMembersResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Tanaka Jiro")).toBeInTheDocument();
    });

    // 親直属 2 名のチェックボックスをすべてチェック
    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    expect(memberCheckboxes).toHaveLength(2);
    await Promise.all(memberCheckboxes.map((checkbox) => user.click(checkbox)));

    // 全選択状態（親直属 2 名 === selectedIds.size 2）
    const headerCheckbox = screen.getByTestId("header-checkbox") as HTMLInputElement;
    expect(headerCheckbox.checked).toBe(true);
    expect(headerCheckbox.indeterminate).toBe(false);
  });

  // #31: スケルトン行が新しい列数に追従する
  it("#31: ローディング中のスケルトン行が 4 列構成で正しく描画される", () => {
    vi.mocked(fetchGroupMembers).mockReturnValue(new Promise(() => {}));

    render(<MemberList groupId={GROUP_ID} />);

    expect(screen.getByText("loading members...")).toBeInTheDocument();
    // colSpan が 3（チェックボックスなし）になっていることを確認
    const loadingCell = screen.getByText("loading members...").closest("td");
    expect(loadingCell).toHaveAttribute("colspan", "3");
  });

  // #31b: onRefetch あり（チェックボックス列が有効）のスケルトン行は colSpan=4
  it("#31b: onRefetch が渡された場合のスケルトン行は colSpan=4 で描画される", () => {
    vi.mocked(fetchGroupMembers).mockReturnValue(new Promise(() => {}));

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    expect(screen.getByText("loading members...")).toBeInTheDocument();
    // colSpan が 4（チェックボックス列あり）になっていることを確認
    const loadingCell = screen.getByText("loading members...").closest("td");
    expect(loadingCell).toHaveAttribute("colspan", "4");
  });

  // #32: 既存テストが新型 UserSummary で通る（backward compatibility）
  it("#32: 既存テストが新型 UserSummary（source_groups フィールドあり）で全 pass する", async () => {
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(mockMembersResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
    });

    expect(screen.getByText("Sato Hanako")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "uuid" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "姓名" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "所属元" })).toBeInTheDocument();
  });

  // 複数所属元を持つユーザーのテスト
  it("複数 source_groups を持つメンバーの所属元が「自グループ, Group 029」と表示される", async () => {
    const multiSourceResponse: MembersResponse = {
      members: [
        {
          id: 1,
          uuid: "00000000-0000-0000-0000-000000000001",
          first_name: "Hana",
          last_name: "Inoue",
          source_groups: [
            { group_id: GROUP_ID, group_name: "Group 030" },
            { group_id: 29, group_name: "Group 029" },
          ],
        },
      ],
      total: 1,
    };
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(multiSourceResponse);

    render(<MemberList groupId={GROUP_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Inoue Hana")).toBeInTheDocument();
    });

    // 所属元に「自グループ, Group 029」が表示される
    expect(screen.getByText("自グループ, Group 029")).toBeInTheDocument();
  });

  it("複数 source_groups を持ち groupId が含まれるメンバーはチェックボックスが表示される", async () => {
    const multiSourceResponse: MembersResponse = {
      members: [
        {
          id: 1,
          uuid: "00000000-0000-0000-0000-000000000001",
          first_name: "Hana",
          last_name: "Inoue",
          source_groups: [
            { group_id: GROUP_ID, group_name: "Group 030" },
            { group_id: 29, group_name: "Group 029" },
          ],
        },
      ],
      total: 1,
    };
    vi.mocked(fetchGroupMembers).mockResolvedValueOnce(multiSourceResponse);

    render(<MemberList groupId={GROUP_ID} onRefetch={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Inoue Hana")).toBeInTheDocument();
    });

    // source_groups に groupId=GROUP_ID が含まれるため isDirect=true → チェックボックス表示
    const memberCheckboxes = screen.getAllByTestId("member-checkbox");
    expect(memberCheckboxes).toHaveLength(1);
  });
});
