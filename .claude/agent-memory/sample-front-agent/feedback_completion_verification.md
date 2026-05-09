---
name: 完了確認は make check && make build で行う
description: make test だけでは typecheck が含まれず、TS2345エラーを見逃す。必ず make check && make build まで実行してから完了報告する
type: feedback
---

make test だけ pass しても完了と報告してはいけない。必ず `make check && make build` を実行して全チェックが green になるまで完了としない。

**Why:** make check には typecheck (tsc --noEmit) + lint + format + test が含まれる。make test だけ実行した場合、TypeScript 型エラー (TS2345 等) を見逃す。実際にキャッシュ削除リファクタリングで `refetch: () => void` を戻り値型に追加した後、mockReturnValue に `refetch` を含めない mock が多数あり typecheck が赤のまま「make test pass」と誤報告した。

**How to apply:** 実装完了報告の直前に必ず `make check 2>&1 | tail -20 && make build 2>&1 | tail -10` を実行し、その出力を報告に含める。make check の途中で format エラーが出た場合は `bunx prettier --write <files>` で即座に修正してから再実行する。
