import type { CSSProperties, ReactNode } from "react";

/** 全ページ共通のコンテンツラッパー（全幅・左右パディングのみ） */
export function PageContainer({
  children,
  padding = "22px 24px 44px",
  style,
}: {
  children: ReactNode;
  padding?: CSSProperties["padding"];
  style?: CSSProperties;
}) {
  return <div style={{ width: "100%", padding, ...style }}>{children}</div>;
}
