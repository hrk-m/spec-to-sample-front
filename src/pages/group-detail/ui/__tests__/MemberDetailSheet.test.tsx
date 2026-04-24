import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MemberDetailSheet } from "@/pages/group-detail/ui/MemberDetailSheet";

describe("MemberDetailSheet", () => {
  it("メンバー名（姓・名）が表示される", () => {
    render(
      <MemberDetailSheet
        member={{
          id: 1,
          uuid: "00000000-0000-0000-0000-000000000001",
          first_name: "Taro",
          last_name: "Yamada",
        }}
      />,
    );

    expect(screen.getByText("Yamada Taro")).toBeInTheDocument();
  });

  it("プレースホルダーメッセージが表示される", () => {
    render(
      <MemberDetailSheet
        member={{
          id: 1,
          uuid: "00000000-0000-0000-0000-000000000001",
          first_name: "Taro",
          last_name: "Yamada",
        }}
      />,
    );

    expect(screen.getByText("詳細は今後追加予定")).toBeInTheDocument();
  });
});
