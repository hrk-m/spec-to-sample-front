---
inclusion: always
---

# Structure

## Feature-Sliced Design v2.1

`src/`
配下は FSD レイヤーで構成される。レイヤーの依存方向は上から下のみ（下位レイヤーは上位を参照しない）。

```
src/
  index.ts      ← Bun エントリーポイント（サーバー起動 + /api/* プロキシ）
  index.html    ← HTML テンプレート
  app/          ← アプリ初期化・ルーティング・グローバルスタイル・React マウント
    routes/     ← ルート固有のレイアウトコンポーネント
  pages/        ← ルート単位のページコンポーネント
  widgets/      ← 独立した UI ブロック（Header・Sidebar 等）
  entities/     ← ドメインエンティティ（型定義・Pure モデル）
  shared/       ← インフラ（API クライアント・設定・UI キット・テーマ・ライブラリ）
    lib/        ← 汎用ロジック（sheet-stack 等）
  test/         ← テストセットアップ
```

## 各レイヤーのパターン

### `app/`

- `index.tsx` — React DOM のマウント（`StrictMode` + `createRoot` + `render`）。Radix UI
  `Theme`（`appearance="light"`, `accentColor="gray"`, `grayColor="slate"`,
  `radius="large"`）でアプリ全体をラップ。HMR 対応（`import.meta.hot` による root の再利用）
- `App.tsx` — ルートコンポーネント。`AuthProvider` で全体をラップし、その内側に App
  Shell パターン（`Header` + `Sidebar` + `RouterProvider`）を配置。`AuthProvider` を
  `RouterProvider` より外側に配置することで、`Header` ウィジェットが `useAuth()`
  でユーザー情報を参照できる。Sidebar 開閉時に
  `RemoveScrollBar`（`react-remove-scroll-bar`）でスクロールバーを非表示化
- `router.tsx` — `createBrowserRouter` によるルート定義。最上位の `Layout` コンポーネントが
  `SheetStackProvider` でアプリ全体をラップ（`AuthProvider` は `App.tsx` 側に移動済み）。
  `/service-unavailable` は認証ガード外に配置。認証が必要なルートは `ProtectedRoute`
  でラップされ、その内側で `GroupNavigationLayout` が `/`・`/groups`・`/groups/:id`・`/users`
  のルーティングを制御し、`/users/:id` は `UserDetailPage` を直接レンダリングする。各ルートの
  `element` は空フラグメント（実際の描画は Layout コンポーネントが担う）
- `routes/ProtectedRoute.tsx` — 認証ガードコンポーネント。`GET /api/v1/me`
  でセッション確認し、認証済みなら子をレンダリング。未認証・API 障害時は `location.state.reason`
  を付与して `/service-unavailable` へリダイレクト
- `routes/GroupNavigationLayout.tsx`
  — シートナビゲーションのルーティングロジック。`useMatch("/users")` にマッチする場合は `UsersPage`
  を返す。`useMatch("/groups/:id")` にマッチかつ `location.state.presentation === "sheet"` の場合は
  `HomePage` を `inert` 属性で背面に残しつつ `GroupDetailSheet`
  をシートで表示。それ以外は通常のフルページ遷移（`GroupDetailPage` または
  `HomePage`）。子シート（メンバー詳細）が開いている場合はグループ詳細シートを `fullWidth`
  に拡大して同時クローズアニメーションに対応する。ルート切り替え時（`routeKey` の変更）に
  `closeAll()` でシートスタックをリセットする。`GroupDetailRouteSheet`
  は ↔ ボタン（`TbArrowsHorizontal` アイコン）を `headerActions` として `Sheet` に渡し、クリック時に
  `navigate('/groups/:id', { replace: true })` を呼び出してフルページ表示に切り替える
- `styles/index.css` — グローバルスタイル。CSS 変数 `--header-height: 52px` の定義、Radix
  Dialog のオーバーレイ z-index 調整（`.rt-BaseDialogOverlay { z-index: 200 }`）、スクロールバー非表示時のヘッダー幅補正（`--removed-body-scroll-bar-size`）、`prefers-reduced-motion`
  でアニメーション・トランジション無効化を含む

### `pages/<page-name>/`

- `index.ts` — Public API（barrel export）。**外部からは必ずここを経由してインポートする**
- `ui/<Component>.tsx` — ページコンポーネント本体
- `ui/__tests__/` — UI コンポーネントのテスト
- `api/` — ページ固有の API 通信ロジック（必要に応じて配置）
- `model/` — ページ固有の型定義・ドメインモデル・カスタムフック（必要に応じて配置）
- `model/__tests__/` — モデル層のテスト（カスタムフック等）

**現在のページスライス:**

| スライス              | 状態                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home`                | 実装済み（`HomePage` + `GroupList` + `CreateGroupDialog` コンポーネント、`api/fetch-groups.ts`、`api/create-group.ts`、`model/group.ts`（`CreateGroupRequest` / `CreateGroupResponse` の create API 用型のみ。`Group` 型本体は `@/entities/group`）、`model/group-list.ts`（`useGroupList` フック・`FETCH_LIMIT` 定数（100）を export。`useGroupList` は `groupCountLabel`（グループ件数ラベル）・`sentinelRef`（IntersectionObserver 用センチネル要素）・`refetch`（`refetchKey` をインクリメントして再フェッチ）も返す。グローバル Map キャッシュは持たず、コンポーネント state に閉じる）、`model/useCreateGroup.ts`（`useCreateGroup` フック）、`GroupList.styles.ts`（テーブル用スタイル定数: `tableRoot`, `tableHeader`, `tableHeaderCell`, `tableHeaderCellId`, `tableRow`, `tableRowLast`, `tableCellId`, `tableCellName`, `tableCellDescription`, `tableCellCount`, `skeletonCell`, `skeletonLine` 等）、`CreateGroupDialog.styles.ts`、テスト）。`GroupList` はネイティブ `<table>` で ID / グループ名 / 説明 / メンバー数 の 4 列を表示し、アバターアイコンは使用しない。ローディング中はスケルトン行（5 行）を表示し、空状態は `groupCountLabel` の "No groups found" で表現する。`HomePage` は `refetchTrigger`（`number`）prop を受け取り、変更時に `useGroupList` の `refetch` を呼ぶ（`GroupNavigationLayout` がシート閉鎖時にこの値をインクリメントする）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `users`               | 実装済み（`UsersPage` + `UserList` + `UserDetailPage` コンポーネントを 1 スライスに集約。`User` 型は `@/entities/user` に集約済み。`api/fetch-users.ts`、`api/fetch-user.ts`（`GET /api/v1/users/:id`。404 は `notFound: true` を付与した `HttpError` をスロー）、`model/user.ts`（`UsersResponse` / `FetchUsersParams` のリスト用型）、`model/user-list.ts`（`useUserList` フック・`FETCH_LIMIT` 定数（100）・`clearUserListCache` 関数を export。グローバル Map (`userListCache`) を保持しキャッシュキー `default` でユーザー一覧をシェアする実装。`useUserList` はクライアントキャッシュ + IntersectionObserver 無限スクロール + 300ms デバウンス検索 + `userCountLabel` + `isEmptyResult` + `sentinelRef` を返す）、`model/useUserDetail.ts`（`useUserDetail(id)` フック。`id` が変化するたびに再フェッチし `{ user, loading, error, notFound }` を返す）、`UserList.styles.ts`（テーブル用スタイル）、`UserDetailPage.styles.ts`、テスト）。`index.ts` は `UsersPage` と `UserDetailPage` の双方を export。`UserList` はネイティブ `<table>` で id / uuid / 姓名 の 3 列を表示し、行クリックで `/users/:id` へ遷移する。`UserDetailPage` は `useParams` で `:id` を取得し `useUserDetail` で詳細を取得。ローディング中はスケルトン 3 ブロック、404 は「ユーザーが見つかりません」、その他エラーはエラーカードを表示。取得成功時は ID / UUID / 姓名をカードに表示し、`FaChevronLeft` の「戻る」ボタンで `/users` へ遷移                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `service-unavailable` | 実装済み（`ServiceUnavailablePage`。マウント時に `GET /api/v1/me` を再試行し、成功時は `/` へリダイレクト。失敗時はメンテナンス中メッセージを表示。`ProtectedRoute` からの `location.state.reason` は現時点では表示に使用していない）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `group-detail`        | 実装済み（`GroupDetailPage` + `GroupDetailSheet` + `GroupDetailView` + `GroupDetailContent` + `EditGroupDialog` + `DeleteGroupDialog` + `AddMemberSheet` + `MemberDetailSheet` + `MemberList` + `AddSubgroupSheet` + `SubgroupFilterChips` + `SubgroupManagementSheet` + `DeleteSubgroupDialog` コンポーネント。`api/` には `fetch-group.ts` / `fetch-group-members.ts` / `fetch-groups.ts`（サブグループ追加候補検索用。冒頭の TODO コメントに「将来 subgroup 専用 API に置き換える予定」と明記。`pages/home/api/fetch-groups.ts` と意図が異なるため entities へ昇格させず page 内に重複保持）/ `update-group.ts` / `delete-group.ts`（`apiFetch<void>`、204 No Content）/ `add-group-members.ts` / `delete-group-members.ts`（リクエストボディ `{ user_ids: number[] }`）/ `add-subgroup.ts`（リクエストボディ `{ child_group_id: number }`）/ `delete-subgroup.ts`（204 No Content）/ `fetch-non-members.ts` を配置。`fetch-group-members.ts` は `exclude_group_ids` パラメータをサポートし、レスポンスは `MembersResponse = { members, total, duplicate_count }`。`GroupMember` / `GroupDetail` / `SubgroupSummary` / `Group` / `isDirectMember` / `validateGroupName` は `@/entities/group` から利用。`model/` は API 操作系・状態フック系・ヘルパに分割: (1) ヘルパ/型 — `members-response.ts`（`MembersResponse` 型）、`source-label.ts`（`buildSourceLabel(member, groupId)`：直接所属は「自グループ」を先頭に、サブグループ経由はグループ名を列挙）、`group-update.ts`（`UpdateGroupRequest`）。(2) サーバー状態フック — `useGroupDetail`（`{ enabled }` オプション。グローバルキャッシュは持たず、`refetchKey` のインクリメントで再フェッチ。`subgroups: SubgroupSummary[]` を派生して返す）、`useMemberList(groupId, excludeGroupIds, { enabled })`（`@/shared/lib/use-infinite-list` の `useInfiniteList` をラップし、`exclude_group_ids` をクエリ化。`directMembers` / `directMemberCount` / `duplicateCount` も派生して返す）、`useNonMemberList(groupId, { enabled })`（同じく `useInfiniteList` ベース）、`useSearchableGroupList(searchQuery)`（`AddSubgroupSheet` 用。300ms デバウンスで `fetchGroups` を呼ぶ非無限スクロール版）。(3) ミューテーションフック — `useUpdateGroup` / `useDeleteGroup` / `useDeleteSubgroup`（404 は「対象のサブグループ関係が見つかりませんでした」、その他は汎用エラー）/ `useAddGroupMembers`（409 は「選択したユーザーはすでにメンバーです」）/ `useDeleteGroupMembers` / `useAddSubgroup`（409 は「すでに追加済みです」）。各ミューテーションフックは `{ isLoading, error, submit }` を返す統一形。(4) UI 派生状態 — `useSubgroupFilter(subgroups, groupId)`（チップ選択状態 + `excludeGroupIds` 計算 + `excludeDirectMembers` 切替を一括管理）、`useDebouncedMemberFilter(excludeGroupIds)`（`excludeGroupIds` を 300ms デバウンスして `MemberList` に渡す。フィルター変化時は `apiTotal` / `duplicateCount` を即時リセットせず古い値を維持し、デバウンス完了後のフェッチが完了したタイミングで MemberList 経由の `onTotalChange` / `onDuplicateCountChange` により更新される）。`MemberList.styles.ts` / `AddMemberSheet.styles.ts` / `GroupDetailPage.styles.ts` がスタイル定数を保持（テーブルセルは `whiteSpace: nowrap` + `textOverflow: ellipsis` で省略表示）。**UI 構成**: `GroupDetailView` がフルページとシート表示の共通描画を担い、`GroupDetailSheet` / `GroupDetailPage` がそれぞれの表示コンテキストのラッパー。`GroupDetailContent` は Edit / Delete ボタン + ダイアログ + チップ式サブグループフィルタ行（`SubgroupFilterChips`）+ 統合メンバー一覧セクションを束ねる。`useSubgroupFilter` で「どのサブグループを含めるか」「自グループを除外するか」を管理し、`useDebouncedMemberFilter` で `MemberList` に渡す `excludeGroupIds` をデバウンスする。`SubgroupFilterChips` はサブグループを横スクロール可能なチップ群として表示し、各チップは `aria-pressed` + メンバー数バッジ付き。右端の「サブグループ管理」ボタンで `SubgroupManagementSheet` を開く（サブグループが 0 件のときは右寄せの管理ボタンのみ表示）。`SubgroupManagementSheet` はサブグループ一覧（カード形式: 名前・説明・`{member_count} members`）と各行の「削除」ボタン（`DeleteSubgroupDialog` を起動）+ ヘッダーの「＋追加」ボタン（`AddSubgroupSheet` を子シートで開き、閉鎖時に `useGroupDetail.refetch` を呼ぶ）を提供。空状態は「サブグループはまだありません」。`AddSubgroupSheet` は `useSearchableGroupList` で取得したグループをラジオ選択（単一選択）し、`subgroups` prop と `groupId` で除外フィルタ。検索フィールド直下に「追加」ボタンを配置し、`useAddSubgroup` で送信。成功時は `addedIds` セットに追加して再選択を防止しつつ `onClose()` を呼ぶ。`MemberList` は直接メンバー（`source_groups` に当該グループ自身を含む）とサブグループ経由の間接メンバーを統合表示する。「所属元」列は `buildSourceLabel` を使い、直接所属は「自グループ」を先頭に・サブグループ経由はサブグループ名を列挙。チェックボックス・名前クリックは直接メンバーのみ有効で、全選択チェックボックスの対象も `directMemberCount`。`useDeleteGroupMembers` を内蔵し、`onRefetch` prop が渡された場合のみ複数選択削除 UI（ヘッダー行のネイティブ `<input type=checkbox>` で `indeterminate` 状態管理 + 「削除」ボタン + `AlertDialog` 確認）を表示する。`onExcludeDirectMembersChange` prop が渡された場合は表ヘッダー上に「自グループを除外」チェックボックスを表示。`onTotalChange` / `onDuplicateCountChange` で `GroupDetailContent` 側のヘッダー件数表示（`{apiTotal ?? memberCount}件` + `重複 {duplicateCount}件`）を更新。`AddMemberSheet` は `useNonMemberList` + `useAddGroupMembers` を内蔵し、ヘッダー行に全選択チェックボックス（`useRef` + `useEffect` で `indeterminate` 管理）を配置。一括追加成功時は `closeSheet()` を呼ぶだけ（`useInfiniteList` ベースに移行したためグローバルキャッシュは存在せず、`enabled: !isAddMemberSheetOpen` を切ることで `useGroupDetail` / `useMemberList` がアンマウントされ、再オープン時に再フェッチされる）。シート開閉と再フェッチは `enabled` オプションのフリップで実現する点が、旧来のグローバルキャッシュ + `clearXxxCache` パターンとの最大の違い。`index.ts` は `GroupDetailPage` / `GroupDetailSheet` / `MemberDetailSheet` を export |

### `entities/`

FSD の entities レイヤー。ドメインの語彙（型・バリデーション・ドメイン固有 API）を集約する。

**現在のスライス:**

- `entities/user/` — `model/user.ts`（`User` 型: `id`, `uuid`, `first_name`,
  `last_name`）。`index.ts` から `User` を re-export
- `entities/group/` — `model/group.ts`（`Group` 型: `id`, `name`, `description`,
  `member_count`、および `GroupsResponse` 型）、`model/group-detail.ts`（`GroupDetail` 型：`Group`
  のフィールド + `subgroups: SubgroupSummary[]`）、`model/subgroup.ts`（`SubgroupSummary`
  型：`Group` と完全同型のため型エイリアス）、`model/group-member.ts`（`GroupMember` 型: `id`,
  `uuid`, `first_name`, `last_name`,
  `source_groups: Array<{ group_id: number; group_name: string }>`、`isDirectMember(member, groupId): boolean`：`source_groups`
  にそのグループが含まれるかで直接メンバーか判定）、`lib/validate-group-name.ts`（`validateGroupName`：100文字制限・空文字バリデーション）。`index.ts`
  から
  `Group`・`GroupsResponse`・`GroupDetail`・`SubgroupSummary`・`GroupMember`・`isDirectMember`・`validateGroupName`
  を re-export。現状 entities に共有 API 関数は置かない（後述「ドメイン固有 API 関数の配置ルール」参照）

#### ドメイン型・ドメイン固有関数の配置ルール

- **ドメイン型・ドメインバリデーション** → 必ず `entities/{slice}/` に置く（`User`, `Group`
  など）。`shared/` にドメイン語彙を出さない
- **ドメイン固有の API 関数** → 原則は `entities/{slice}/api/`
  に置くが、**2 ページ以上で「同じ意図」のドメイン共有が成立する場合のみ昇格する**。同じ関数を呼んでいても各ページで意図が異なる場合は entities に上げず、各
  `pages/{slice}/api/` に重複して置く（FSD 公式の "Duplication across pages is
  acceptable"）。重複を許容する代わりに、将来の置換予定があれば該当ファイル冒頭に TODO コメントを残し、後で page 固有 API へ差し替えやすくする。現状 entities に共有 API 関数は無く、`fetchGroups`
  は `pages/home/api/fetch-groups.ts` と `pages/group-detail/api/fetch-groups.ts`
  に意図的に重複させている（前者は一覧表示、後者はサブグループ追加候補検索でいずれ subgroup 専用 API に置き換える予定）。`shared/api/`
  には `apiFetch`・`HttpError` のような汎用 wrapper のみ残す
- **ドメインのコア型・自然な拡張形** → `entities/{slice}/model/` に置く。`Group`・`User`
  のような基本型に加え、`GroupDetail`（`Group` + `subgroups`）・`SubgroupSummary`（`Group`
  型エイリアス）・`GroupMember`（`id`, `uuid`, `first_name`, `last_name` +
  `source_groups`）のように 1 ページでしか参照されていなくても「ドメインの素直な拡張」と呼べるものは entities に昇格させる。**配置はドメインのコンテキストで決める**：`GroupDetail`・`SubgroupSummary`
  は `Group` の intra-slice 拡張なので `entities/group/`、`GroupMember`
  は Group ドメインのメンバー概念なので `entities/group/` に置く。`GroupMember` は `User`
  と類似フィールドを持つが **`User` から拡張せず自己完結型として定義する**（DDD の Bounded
  Context 的アプローチで `User` と `GroupMember` を概念的に独立した型として扱う）。これにより
  `entities/user` と `entities/group`
  のクロスインポートを完全に排除し、各 entities を自己完結に保つ。トレードオフとして `User`
  のフィールドが変わったら `GroupMember`
  を手動で同期する必要があるが、これは意図的なデカップリング。`entities/group/` は
  `model/group.ts`・`model/group-detail.ts`・`model/subgroup.ts`・`model/group-member.ts`・`lib/validate-group-name.ts`、`entities/user/`
  は `model/user.ts` の構成
- **特定ページのコンテキストに依存する派生型** → `pages/{slice}/model/`
  にドメインごとに 1 ファイル＝1 関心で分割する（`MembersResponse`
  のような特定エンドポイントの API 契約、`buildSourceLabel`
  のようなページ固有の UI 文字列ヘルパ、ページ固有のフック群）。`group-detail.ts`
  のように複数のドメイン関心を 1 ファイルに同居させる god
  file は作らない（`pages/group-detail/model/` では `members-response.ts`・`source-label.ts`
  のように分割する）。2 ページ以上で共有が必要になったら `entities/` に昇格させる
- **ユーザー操作（hook + dialog 等）** → 1 ページに閉じる場合は `pages/`
  配下で OK。2 ページ以上で共有が発生したら `features/` への昇格を検討する

**命名規則**: `model/` 配下のフックファイルは `useXxx.ts`、ドメイン定数・純粋関数モジュールは
`<domain>.ts` を用いる。

### `widgets/`

FSD の widgets レイヤー。ページ横断で使われる独立した UI ブロックを配置する。

- `header/` — アプリヘッダー（ハンバーガーメニューボタン付き、`z-index: 150`
  で Sheet オーバーレイより上に固定）。`ui/Header.tsx`、`ui/Header.styles.ts`、テスト。 `useAuth()`
  でログインユーザー情報を取得し、右端の `FaCircleUser`
  アイコンボタン（`aria-label="Account"`）を押すと Radix UI `DropdownMenu`
  が開いてユーザーの UUID・氏名を表示する。レイアウトは `gridTemplateColumns: "40px 1fr 40px"`
  の 3 カラム構成（leading / title / trailing）
- `sidebar/`
  — サイドバーナビゲーション（オーバーレイ付きドロワー）。`ui/Sidebar.tsx`、`ui/Sidebar.styles.ts`、テスト。Props:
  `isOpen`・`onClose`（必須）、`onNavigate`（任意）。"Groups" ボタンをクリックすると `onClose()` と
  `onNavigate?.("/")` の両方を呼び出し、"Users" ボタンをクリックすると `onClose()` と
  `onNavigate?.("/users")` を呼び出す。`App.tsx` では `onNavigate={(path) => router.navigate(path)}`
  を渡して画面遷移させる

各 widget は `index.ts`（barrel export）を Public API として公開する。

### `shared/`

- `auth/auth.tsx` — 認証コンテキスト。`AuthProvider`（`AuthContext.Provider`）と `useAuth`
  フックを提供。`AuthUser` 型（`id`, `uuid`, `firstName`, `lastName`）を保持。`index.ts`
  から re-export
- `api/client.ts` — 汎用 fetch ラッパー（`apiFetch<T>`）と `HttpError`
  クラス。レスポンスエラー検知・JSON 変換を担う。204 No
  Content またはレスポンスボディが空（`content-length: 0`）の場合は `res.json()` を呼ばず
  `undefined` を返す。ボディなし DELETE など `apiFetch<void>` として使用する。`HttpError` は
  `status` プロパティを持ち `apiFetch<T>` がスローする
- `config/env.ts` — 環境変数の集約・エクスポート（`API_BASE_URL`
  は空文字列。サーバーサイドプロキシ経由のため同一オリジン）
- `auth/useInitializeAuth.ts` — 認証初期化フック。マウント時に `GET /api/v1/me`
  でセッション確認し、`{ status: AuthStatus }`
  を返す（`AuthStatus = "loading" | "authenticated" | "unauthenticated" | "api_unavailable"`）。`index.ts`
  から re-export。 `ProtectedRoute` がこれを使って未認証・API 障害時のリダイレクトを制御する
- `config/theme.ts` — アプリ共通のカラーパレット（`appColors`）。従来 `shared/ui/theme.ts`
  に配置していたが `shared/config/` に移管済み
- `lib/sheet-stack/`
  — シートスタック管理。`SheetStackProvider`（コンテキスト提供 + シートレンダリング）、`SheetStackContext`（型定義 +
  `useSheetStack` フック）、`sheetPresentation.ts`（`getSheetWidth(sheets, index)`：最上段シートは
  `defaultWidth`、それ以外は `fullWidth` を返す。最上段が閉じ始めたら直下のシートも同時に
  `defaultWidth` に戻す動的幅計算ヘルパ。`SheetStackProvider` から利用される）、`index.ts`（barrel
  export）で構成
- `lib/use-infinite-list/` — クライアントキャッシュ +
  IntersectionObserver 無限スクロールの汎用フック。`useInfiniteList<T extends { id: PropertyKey }, P>`
  と `INFINITE_LIST_FETCH_LIMIT`（100）を export。`id`
  プロパティを持つ型のみを受け付ける型制約により、重複排除ロジックが型安全に動作する。`{ enabled }`
  オプションでフェッチを停止/再開でき、`refetch` は `refetchKey`
  をインクリメントして再フェッチをトリガする。`cacheKey`
  が変わると state がリセットされる。`index.ts`（barrel export）で構成。`useMemberList` と
  `useNonMemberList` がこの汎用フックをラップして利用する（`useGroupList` / `useUserList`
  は移行前のカスタム実装が残っているが、新規一覧フックはこれを利用すること）
- `ui/index.ts` — 共通 UI コンポーネントの barrel
  export（`PageContainer`、`Sheet`、`sheetConstants`、`appColors`）
- `ui/PageContainer.tsx` — 全ページ共通のコンテンツラッパー（パディング制御）
- `ui/Sheet.tsx` — 右からスライドインするモーダルパネル。`createPortal`
  で描画、スクロールロック・ESC キー・オーバーレイクリックによるクローズ、トランジション完了後の DOM 除去を内包する。`headerActions?: ReactNode`
  prop で閉じるボタン（`FaChevronRight` アイコン）左隣にカスタムアクションを描画できる
- `ui/Sheet.styles.ts` —
  Sheet のスタイル定数とスタイルオブジェクト（アニメーション設定・z-index ベース値・サイズ定数を
  `sheetConstants` として export）
- `api/__tests__/` / `auth/` / `config/__tests__/` — shared のテスト

### `test/`

- `setup.ts` — Vitest のグローバルセットアップ。`@testing-library/jest-dom` のインポートと
  `MockIntersectionObserver` クラスのグローバル登録（`global.IntersectionObserver`
  への代入）を行う。 `MockIntersectionObserver` は `export { MockIntersectionObserver }`
  でテストから参照可能

## インポート規則

1. **レイヤー間**: 上位レイヤーのみ下位をインポート可能（`app` → `widgets` → `pages` → `entities` →
   `shared`）

   ```ts
   // app → widgets は OK
   import { Header } from "@/widgets/header";

   // pages → shared は OK
   import { apiFetch } from "@/shared/api/client";

   // shared → pages は NG
   // widgets → pages は NG
   ```

2. **スライス間**: 同一レイヤー内での相互インポートは禁止。Public
   API（`index.ts`）を通じてのみ参照する

3. **パスエイリアス**: `@/` を使い、相対パス `../` での上位ディレクトリ参照を避ける

## データフローパターン

### クライアントキャッシュ + IntersectionObserver 無限スクロール

一覧系画面（グループ一覧・ユーザー一覧・メンバー一覧・非メンバー一覧）は共通のデータフローパターンに従う:

1. **単位取得**: API から `FETCH_LIMIT`（100 件）単位でデータを取得し、ローカルにキャッシュ
2. **全件表示**: キャッシュ済みデータをすべて表示する（クライアント側のページ分割なし）
3. **IntersectionObserver による自動追加取得**: センチネル要素（`<div ref={sentinelRef} />`）が viewport に入ったとき、`lastBatchSize === FETCH_LIMIT`（前回取得が上限件数）であれば次の 100 件を追加取得する。`lastBatchSize`
   が `FETCH_LIMIT` 未満であればデータ末尾と判断し追加取得しない
4. **ローカル Ref による stale closure 回避**: IntersectionObserver コールバック内では
   `isFetchingMoreRef`・`isLoadingRef`・`lastBatchSizeRef`・`fetchedOffsetRef`・`debouncedQueryRef`
   の Ref で最新値を参照する。それぞれ対応する state が変わるたびに Ref を同期する
5. **検索**: 入力値を 300ms デバウンス（`debouncedQuery`）してからキャッシュをクリアし、offset
   0から再取得。検索中の `effectiveTotal`
   はキャッシュ済み件数（`cachedItems.length`）を使い、非検索時は API レスポンスの `total` を使う
6. **件数ラベル**: ローディング中は "Loading..." 系メッセージ、`effectiveTotal > 0`
   で件数表示、`effectiveTotal === 0` で "No ... found" を表示する（`useGroupList` の
   `groupCountLabel` パターン）

このパターンは現在以下 2 系統に分かれている:

- **汎用フック (`useInfiniteList`)**: `@/shared/lib/use-infinite-list`
  に集約された再利用可能な実装。`useMemberList` / `useNonMemberList`
  がこれをラップして利用する。`{ enabled }` で停止/再開、`refetch` で `refetchKey`
  をインクリメント。グローバル Map キャッシュは持たず state ベース
- **カスタム実装**: `useGroupList`（state ベース、グローバル Map なし）と
  `useUserList`（グローバルMap `userListCache` 付き、キャッシュキー
  `default`）は移行前のカスタム実装が残る。`useUserList` の `clearUserListCache`
  だけが残存するキャッシュ操作 API

新しい一覧画面を追加する場合は **汎用フックの `useInfiniteList`** を利用すること。

### 詳細画面の refetch パターン

詳細画面の更新操作（編集・削除等）が成功した後、表示データを最新に保つためのパターン:

1. **`refetchKey` ベースの再フェッチ**: `useGroupDetail` の `refetch` は `refetchKey`
   をインクリメントして `useEffect`
   を再実行する。グローバルキャッシュは持たず、stateが破棄されない限り一度取得した値を保持する
2. **楽観的更新なし**: 更新 API の成功を待ってからサーバーの最新値を取得する設計
3. **呼び出し方**: 編集ダイアログの `onSuccess` コールバックとして `refetch`
   を渡す。ダイアログはクローズ後に呼び出す
4. **シート開閉と `enabled` フラグ**: 子シート（`AddMemberSheet` / `SubgroupManagementSheet`
   等）が開いている間は親の `useGroupDetail` / `useMemberList` に `{ enabled: false }`
   を渡してフェッチを停止する。シートが閉じて `enabled` が `true` に戻ると、`useEffect`
   が再走して最新データを取得する。これにより旧来の "クローズ時に `clearXxxCache`
   を明示呼び出し" パターンを置き換えている

```ts
// useGroupDetail が返す refetch
const refetch = useCallback(() => {
  setRefetchKey((prev) => prev + 1);
}, []);
```

## 新規ファイルの配置基準

| 何を作るか                                                      | 配置先                                                   |
| --------------------------------------------------------------- | -------------------------------------------------------- |
| ページコンポーネント                                            | `src/pages/<name>/ui/` + `src/pages/<name>/index.ts`     |
| ページ横断の独立 UI ブロック                                    | `src/widgets/<name>/ui/` + `src/widgets/<name>/index.ts` |
| ドメイン型・ドメインバリデーション                              | `src/entities/<slice>/model/` または `lib/`              |
| ドメイン固有 API 関数（2 ページ以上で意図が共有される場合のみ） | `src/entities/<slice>/api/`                              |
| ページ固有 API 関数 / 意図がページごとに異なる API 関数         | `src/pages/<slice>/api/`（必要なら重複を許容）           |
| 汎用 API wrapper（`apiFetch` 等）                               | `src/shared/api/`                                        |
| 環境設定・定数                                                  | `src/shared/config/`                                     |
| 汎用ロジック・コンテキスト                                      | `src/shared/lib/<name>/` + `index.ts`（barrel export）   |
| 再利用 UI パーツ・テーマ                                        | `src/shared/ui/`                                         |
| 認証コンテキスト・フック                                        | `src/shared/auth/`                                       |
| ルート固有のレイアウトコンポーネント                            | `src/app/routes/`                                        |
| アプリ全体の初期化・ルーティング                                | `src/app/`                                               |
