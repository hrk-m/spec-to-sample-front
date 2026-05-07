---
inclusion: always
---

# Product

## 目的

`sample-front`
は spec-to-dev-workflow プロジェクトにおけるフロントエンドのサンプル実装です。バックエンド API（`sample-api`）と連携し、仕様駆動開発のワークフローを実証します。

## コア機能

- グループ一覧表示（検索・無限スクロール付き、`/api/v1/groups`
  エンドポイント）。クライアントキャッシュ戦略（100 件単位取得 → クライアント側でキャッシュ）と IntersectionObserver による自動追加取得を備える。検索入力は 300ms デバウンスし、検索中は "No
  groups found" の空状態表示に対応
- グループ作成（ダイアログ形式、`POST /api/v1/groups`
  エンドポイント）。名前バリデーション（必須・100 文字以内）付き。作成成功時はグループ詳細画面へ自動遷移
- グループ詳細表示（グループ情報 + 統合メンバー一覧、`/api/v1/groups/:id` +
  `/api/v1/groups/:id/members`
  エンドポイント）。グループ詳細ヘッダー直下にサブグループフィルタ用のチップ行（`SubgroupFilterChips`）が並び、各チップはサブグループ名 + メンバー数バッジ +
  `aria-pressed` で ON/OFF を表現する。チップ右端には「サブグループ管理」ボタンを配置し、押下で
  `SubgroupManagementSheet` を開く。メンバー一覧は uuid
  / 姓名 / 所属元 の 3 列（複数選択削除を有効にする場合は □選択 を加えた 4 列）を表示し、直接メンバー・サブグループ経由の間接メンバーを統合表示する。「所属元」列は
  `source_groups` の内容を `buildSourceLabel`
  で整形し、直接所属は「自グループ」を先頭に・サブグループ経由はサブグループ名を列挙する。チップで OFF にしたサブグループのメンバーは API クエリ
  `exclude_group_ids` で除外し、`自グループを除外` チェックボックスをオンにすると当該グループ自身も
  `exclude_group_ids`
  に含めて直接メンバーを除外する。フィルタは 300ms デバウンスしてから API へ反映し、ヘッダーの件数表示は API レスポンスの
  `total` を用い、重複メンバー数は `重複 X件`
  として併記する。メンバー一覧は IntersectionObserver による無限スクロール（`shared/lib/use-infinite-list`
  ベース）と 300ms デバウンス検索を備える
- グループ編集（ダイアログ形式、`PUT /api/v1/groups/:id`
  エンドポイント）。名前バリデーション（必須・100 文字以内）付き。編集成功時はグループ詳細を再取得して表示を更新
- グループ削除（確認ダイアログ形式、`DELETE /api/v1/groups/:id` エンドポイント）。Radix UI
  `AlertDialog` による削除確認 UI。削除成功時はトップページ（`/`）へ自動遷移
- メンバー追加（Sheet 形式、`POST /api/v1/groups/:id/members`
  エンドポイント）。グループ詳細画面の「メンバー追加」ボタンから `AddMemberSheet`
  をシートで開き、`GET /api/v1/groups/:id/non-members`
  で取得した未所属ユーザーをチェックボックスで複数選択して一括追加する。`AddMemberSheet` は
  `useNonMemberList` + `useAddGroupMembers`
  を内蔵し、検索（300ms デバウンス）・IntersectionObserver 無限スクロールを備える（`shared/lib/use-infinite-list`
  ベース。グローバルキャッシュは持たないため、シート開閉のたびに最新の非メンバー一覧が自動取得される）。ヘッダー行にネイティブ
  `<input type="checkbox">` による全選択チェックボックスを配置し、`useRef<HTMLInputElement>` +
  `useEffect` で `indeterminate` 状態を管理する。追加実行ボタンのラベルは「一括追加」。追加成功時は
  `closeSheet()` のみ呼び出し、親側は `useGroupDetail` / `useMemberList` に渡す `enabled`
  フラグがシート閉鎖で再び `true`
  になることで自動的に再フェッチされる。409 競合エラーは「選択したユーザーはすでにメンバーです」と表示する
- サブグループ追加（Sheet 形式、`POST /api/v1/groups/:id/subgroups`
  エンドポイント）。`SubgroupManagementSheet` ヘッダーの「＋追加」ボタンから `AddSubgroupSheet`
  を子シートとして開き、`useSearchableGroupList`
  経由で全グループ一覧を取得（`GET /api/v1/groups`、ページネーションなし）してラジオ選択（単一選択）で追加する。現在のグループ自身および既に直接の子グループになっているものは一覧から除外する。検索入力は 300ms デバウンス付き（IntersectionObserver による無限スクロールは持たない）。追加実行ボタンのラベルは「追加」で、検索フィールドの直下・グループ一覧の前に配置する。追加成功時は子シートを閉じ、親の
  `SubgroupManagementSheet` 側で `useGroupDetail.refetch`
  を呼んでグループ詳細を再取得する。409 競合エラーは「すでに追加済みです」と表示する
- サブグループ管理 / サブグループ削除（`DELETE /api/v1/groups/:id/subgroups/:childId`
  エンドポイント）。`SubgroupManagementSheet`
  を開くとサブグループ一覧をカード形式で表示する（サブグループ名・説明・メンバー数
  `{member_count} members`）。各行の「削除」ボタンをクリックすると `DeleteSubgroupDialog`（Radix UI
  `AlertDialog`）が確認ダイアログを表示し、確認後に `useDeleteSubgroup`
  フックが API を呼び出して成功時はダイアログを閉じ `useGroupDetail.refetch`
  でグループ詳細を更新する。サブグループが 0 件のときは「サブグループはまだありません」を表示する。404 エラーは「対象のサブグループ関係が見つかりませんでした」、その他エラーは汎用エラーメッセージを表示し、ダイアログは閉じない
- メンバー削除（`DELETE /api/v1/groups/:id/members`
  エンドポイント）。メンバー一覧のチェックボックスで複数選択し、「削除」ボタン（`onRefetch`
  prop が渡された場合のみ表示）から Radix UI `AlertDialog`
  による確認ダイアログを経て一括削除する。チェックボックスと名前クリックは直接メンバー（`source_groups`
  に当該グループ自身が含まれるメンバー）のみ有効で、サブグループ経由の間接メンバーはチェックボックスなし・選択不可。ヘッダー行の全選択チェックボックス（ネイティブ
  `<input type="checkbox">`）で直接メンバー全件選択・全件解除が可能で、一部選択時は `indeterminate`
  状態を `useRef` + `useEffect` で表現する。削除成功時は `useDeleteGroupMembers` の戻り値を見て
  `onRefetch()` を呼び、グループ詳細とメンバー一覧を更新する（`useMemberList`
  はグローバルキャッシュを持たず `useInfiniteList` の `refetch`
  で再取得）。エラー時は確認ダイアログ内にエラーメッセージを表示する
- ユーザー一覧表示（検索・無限スクロール付き、`GET /api/v1/users`
  エンドポイント）。クライアントキャッシュ戦略（100 件単位取得 → クライアント側でキャッシュ）と IntersectionObserver による自動追加取得を備える。検索入力は 300ms デバウンスし、ユーザー名の部分一致検索に対応する。テーブル行をクリックすると
  `/users/:id` へ遷移する
- ユーザー詳細表示（`GET /api/v1/users/:id` エンドポイント）。ID / UUID
  / 姓名を情報カードに表示する。404 時は「ユーザーが見つかりません」、その他エラーはエラーカードを表示。ローディング中はスケルトン UI を表示する。「戻る」ボタンで
  `/users` へ遷移
- App Shell パターン（Header + Sidebar によるナビゲーション）。サイドバー開閉時は
  `react-remove-scroll-bar`
  でスクロールバーを非表示にし、ヘッダーの padding-right で幅のズレを補正。Sidebar の "Groups" ボタンは
  `/`、"Users" ボタンは `/users` へ遷移する（`onNavigate(path)`
  prop 経由）。Header 右端のアカウントボタン（`FaCircleUser` アイコン）は `DropdownMenu`
  でログインユーザーの UUID・氏名を表示する
- 認証ガード（`ProtectedRoute`）: `GET /api/v1/me` を呼び出してセッション確認。401 は
  `reason="unauthenticated"` で `/service-unavailable` へリダイレクト、その他のエラーは
  `reason="api_unavailable"` でリダイレクト。認証済みユーザー情報（`id`, `uuid`, `firstName`,
  `lastName`）は `shared/auth` の `AuthContext` に保存される
- サービス利用不可画面（`ServiceUnavailablePage`）: `/service-unavailable` ルート。マウント時に
  `GET /api/v1/me` を再試行し、成功すれば `/` へリダイレクト。失敗時はメンテナンス中メッセージを表示
- react-router v7 によるクライアントサイドルーティング（`/`, `/groups`, `/groups/:id`, `/users`,
  `/users/:id`, `/service-unavailable`）
- サーバーサイド API プロキシ（Bun サーバーが `/api/*` リクエストをバックエンドに中継）
- Feature-Sliced Design に沿ったスケーラブルなフロントエンド構造のデモ

## 価値

- スペックから実装へのワークフローを具体的に示す参照実装
- FSD v2.1 のアーキテクチャパターンを実際のコードで体験できる
