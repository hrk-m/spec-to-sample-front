import { Skeleton } from "@radix-ui/themes";
import { FaChevronLeft } from "react-icons/fa6";
import { useNavigate, useParams } from "react-router";

import { useUserDetail } from "@/pages/user-detail/model/user-detail-state";
import { styles } from "./UserDetailPage.styles";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading, error, notFound } = useUserDetail(id);

  return (
    <div style={{ width: "100%", padding: "22px 24px 44px" }}>
      <button
        type="button"
        data-testid="back-button"
        style={styles.backButton}
        onClick={() => navigate("/users")}
      >
        <FaChevronLeft size={14} aria-hidden="true" />
        戻る
      </button>

      {loading && (
        <div data-testid="user-detail-skeleton" style={styles.sectionCard}>
          <div style={styles.skeletonBlock}>
            <Skeleton style={{ ...styles.skeletonLine, width: "80px", marginBottom: 8 }} />
            <Skeleton style={{ ...styles.skeletonLine, width: "40px" }} />
          </div>
          <div style={styles.skeletonBlock}>
            <Skeleton style={{ ...styles.skeletonLine, width: "80px", marginBottom: 8 }} />
            <Skeleton style={{ ...styles.skeletonLine, width: "260px" }} />
          </div>
          <div style={styles.skeletonBlock}>
            <Skeleton style={{ ...styles.skeletonLine, width: "80px", marginBottom: 8 }} />
            <Skeleton style={{ ...styles.skeletonLine, width: "120px" }} />
          </div>
        </div>
      )}

      {!loading && notFound && (
        <div style={styles.sectionCard}>
          <p style={styles.notFoundText}>ユーザーが見つかりません</p>
        </div>
      )}

      {!loading && error && (
        <div data-testid="user-detail-error" style={styles.errorCard}>
          <p style={styles.errorTitle}>エラーが発生しました</p>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {!loading && user && (
        <div style={styles.sectionCard}>
          <div style={styles.infoRow}>
            <p style={styles.infoLabel}>ID</p>
            <p style={styles.infoValue}>{user.id}</p>
          </div>
          <div style={styles.infoRow}>
            <p style={styles.infoLabel}>UUID</p>
            <p style={styles.infoValueMono}>{user.uuid}</p>
          </div>
          <div style={styles.infoRowLast}>
            <p style={styles.infoLabel}>姓名</p>
            <p style={styles.infoValue}>
              {user.last_name} {user.first_name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
