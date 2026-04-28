import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Skeleton, Text, TextField } from "@radix-ui/themes";
import { FaMagnifyingGlass } from "react-icons/fa6";

import { addSubgroup } from "@/pages/group-detail/api/add-subgroup";
import { fetchGroupsForSheet, type GroupSummary } from "@/pages/group-detail/api/fetch-groups";
import type { SubgroupSummary } from "@/pages/group-detail/model/group-detail";
import { appColors } from "@/shared/ui";

const colors = {
  separator: appColors.separator,
  surfaceRaised: appColors.surfaceRaised,
  textPrimary: appColors.textPrimary,
  textSecondary: appColors.textSecondary,
  searchBackground: appColors.searchBackground,
  error: appColors.error,
  errorBackground: appColors.errorBackground,
  errorBorder: appColors.errorBorder,
} as const;

const containerStyle = {
  padding: "0 24px 24px",
} as const;

const searchSectionStyle = {
  marginTop: 18,
} as const;

const searchFieldStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: colors.searchBackground,
  borderRadius: 16,
  boxShadow: `inset 0 0 0 1px ${colors.separator}`,
} as const;

const searchFieldIconStyle = {
  width: 18,
  height: 18,
  display: "block",
  color: colors.textSecondary,
} as const;

const countLabelStyle = {
  margin: "0 0 8px",
  fontSize: 13,
  color: colors.textSecondary,
} as const;

const listStyle = {
  marginTop: 12,
  background: colors.surfaceRaised,
  border: `1px solid ${colors.separator}`,
  borderRadius: 22,
  overflow: "hidden",
  boxShadow: "0 18px 42px rgba(15, 23, 42, 0.06)",
} as const;

const rowBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 20px",
  cursor: "pointer",
  transition: "background 0.1s",
} as const;

const rowSelectedStyle = {
  ...rowBaseStyle,
  background: "rgba(0, 122, 255, 0.06)",
} as const;

const rowBorderStyle = {
  borderBottom: `1px solid ${colors.separator}`,
} as const;

const radioStyle = {
  width: 18,
  height: 18,
  accentColor: "#007AFF",
  flexShrink: 0,
  cursor: "pointer",
} as const;

const groupNameStyle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 500,
  color: colors.textPrimary,
} as const;

const groupDescStyle = {
  margin: 0,
  fontSize: 13,
  color: colors.textSecondary,
  marginTop: 1,
} as const;

const footerStyle = {
  marginTop: 20,
  display: "flex",
  justifyContent: "flex-end",
} as const;

const errorStyle = {
  margin: "12px 0 0",
  fontSize: 14,
  lineHeight: 1.5,
  color: colors.error,
  padding: "12px 16px",
  background: colors.errorBackground,
  borderRadius: 12,
  border: `1px solid ${colors.errorBorder}`,
} as const;

const emptyStyle = {
  margin: 0,
  fontSize: 14,
  color: colors.textSecondary,
  textAlign: "center" as const,
  padding: "28px 24px",
} as const;

const SKELETON_ROWS = 4;
const DEBOUNCE_MS = 300;

type AddSubgroupSheetProps = {
  groupId: number;
  onClose: () => void;
  onSuccess: () => void;
  subgroups: SubgroupSummary[];
};

export function AddSubgroupSheet({
  groupId,
  onClose,
  onSuccess,
  subgroups,
}: AddSubgroupSheetProps) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isFetchingGroups, setIsFetchingGroups] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isActiveRef = useRef(true);

  // 検索クエリが変わるたびにデバウンス付きでフェッチ
  useEffect(() => {
    isActiveRef.current = true;
    setIsFetchingGroups(true);
    setFetchError(null);

    const timerId = setTimeout(() => {
      fetchGroupsForSheet(searchQuery)
        .then((data) => {
          if (!isActiveRef.current) return;
          setGroups(data.groups);
          setTotal(data.total);
        })
        .catch((err: unknown) => {
          if (!isActiveRef.current) return;
          const msg = err instanceof Error ? err.message : String(err);
          setFetchError(`Error ${msg}`);
        })
        .finally(() => {
          if (!isActiveRef.current) return;
          setIsFetchingGroups(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timerId);
      isActiveRef.current = false;
    };
  }, [searchQuery]);

  // 既に直接の子グループになっているものを除外
  const existingChildIds = new Set(subgroups.map((s) => s.id));
  const availableGroups = groups.filter((g) => g.id !== groupId && !existingChildIds.has(g.id));

  const handleSubmit = useCallback(async () => {
    if (selectedGroupId === null) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addSubgroup({ groupId, childGroupId: selectedGroupId });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message = String(err);
      if (message.includes("409")) {
        setSubmitError("すでに追加済みです");
      } else {
        setSubmitError("エラーが発生しました。しばらくしてから再試行してください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [groupId, selectedGroupId, onSuccess, onClose]);

  return (
    <Box style={containerStyle}>
      {/* 検索フィールド */}
      <Box style={searchSectionStyle}>
        <TextField.Root
          size="3"
          radius="large"
          variant="surface"
          style={searchFieldStyle}
          placeholder="Search by name or description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        >
          <TextField.Slot>
            <FaMagnifyingGlass aria-hidden="true" style={searchFieldIconStyle} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* グループ件数ラベル */}
      {total !== null && !fetchError && (
        <Text as="p" style={countLabelStyle}>
          {total} groups
        </Text>
      )}

      {/* エラー表示（GET） */}
      {fetchError && (
        <Text as="p" style={errorStyle}>
          {fetchError}
        </Text>
      )}

      {/* エラー表示（POST） */}
      {submitError && (
        <Text as="p" style={errorStyle}>
          {submitError}
        </Text>
      )}

      {isFetchingGroups ? (
        <Box style={{ ...listStyle, marginTop: 18 }}>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <Box
              key={i}
              style={{
                padding: "14px 20px",
                ...(i < SKELETON_ROWS - 1 ? rowBorderStyle : {}),
              }}
            >
              <Skeleton style={{ height: 16, width: "60%", borderRadius: 999 }} />
            </Box>
          ))}
        </Box>
      ) : !fetchError && availableGroups.length === 0 ? (
        <Text as="p" style={emptyStyle}>
          追加できるグループがありません。
        </Text>
      ) : (
        !fetchError && (
          <Box style={listStyle}>
            {availableGroups.map((group, index) => {
              const isSelected = selectedGroupId === group.id;
              const isLast = index === availableGroups.length - 1;
              return (
                <Flex
                  key={group.id}
                  style={{
                    ...(isSelected ? rowSelectedStyle : rowBaseStyle),
                    ...(isLast ? {} : rowBorderStyle),
                  }}
                  onClick={() => setSelectedGroupId(isSelected ? null : group.id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedGroupId(isSelected ? null : group.id);
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="subgroup-selection"
                    checked={isSelected}
                    onChange={() => setSelectedGroupId(group.id)}
                    style={radioStyle}
                    aria-label={group.name}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Box>
                    <Text as="p" style={groupNameStyle}>
                      {group.name}
                    </Text>
                    {group.description && (
                      <Text as="p" style={groupDescStyle}>
                        {group.description}
                      </Text>
                    )}
                  </Box>
                </Flex>
              );
            })}
          </Box>
        )
      )}

      <Box style={footerStyle}>
        <Button
          variant="soft"
          size="2"
          radius="full"
          disabled={selectedGroupId === null || isSubmitting}
          onClick={() => void handleSubmit()}
        >
          追加する
        </Button>
      </Box>
    </Box>
  );
}
