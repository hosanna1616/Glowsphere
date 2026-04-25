import React, { useEffect, useMemo, useState } from "react";
import PostsApi from "../../api/postsApi";
import { useToast } from "../../context/ToastContext";
import { resolveMediaUrl } from "../../utils/media";

const STATUS_OPTIONS = ["", "pending", "under_review", "resolved", "dismissed"];
const CATEGORY_OPTIONS = [
  "",
  "harmful_or_dangerous",
  "hate_or_harassment",
  "violence_or_threat",
  "nudity_or_sexual",
  "misinformation",
  "spam_or_scam",
  "other",
];

const labelize = (value) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const ModerationDashboard = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const loadQueue = async (targetPage = 1) => {
    try {
      setLoading(true);
      const data = await PostsApi.getReportQueue({
        page: targetPage,
        status: statusFilter,
        category: categoryFilter,
      });

      const flattened = [];
      (data.posts || []).forEach((post) => {
        (post.reports || []).forEach((report) => {
          if (statusFilter && report.moderationStatus !== statusFilter) return;
          if (categoryFilter && report.reportCategory !== categoryFilter) return;
          flattened.push({
            postId: post._id,
            reportId: report._id,
            moderationStatus: report.moderationStatus,
            reportCategory: report.reportCategory,
            reason: report.reason,
            additionalDetails: report.additionalDetails,
            reportedAt: report.reportedAt,
            reporterId: report.userId,
            postContent: post.content,
            postMedia: resolveMediaUrl(post.mediaUrl),
            postAuthor: post.userId?.username || post.username || "unknown",
          });
        });
      });

      setItems(flattened);
      setPage(data.page || targetPage);
      setPages(data.pages || 1);
    } catch (error) {
      showToast(error.message || "Failed to load moderation queue", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(1);
  }, [statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc[item.moderationStatus] = (acc[item.moderationStatus] || 0) + 1;
        return acc;
      },
      { pending: 0, under_review: 0, resolved: 0, dismissed: 0 }
    );
  }, [items]);

  const updateStatus = async (item, moderationStatus) => {
    try {
      await PostsApi.updateReportStatus(item.postId, item.reportId, moderationStatus);
      setItems((prev) =>
        prev.map((row) =>
          row.reportId === item.reportId ? { ...row, moderationStatus } : row
        )
      );
      showToast(`Report marked ${labelize(moderationStatus)}`, "success");
    } catch (error) {
      showToast(error.message || "Failed to update report status", "error");
    }
  };

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-400">Moderation Dashboard</h1>
        <p className="text-amber-200/80 mt-2">
          Report queue with review status controls.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Object.entries(counts).map(([k, v]) => (
          <div
            key={k}
            className="bg-card-bg border border-amber-500/30 rounded-lg p-3"
          >
            <div className="text-xs text-amber-200/70">{labelize(k)}</div>
            <div className="text-2xl font-bold text-amber-300">{v}</div>
          </div>
        ))}
      </div>

      <div className="bg-card-bg border border-amber-500/30 rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-stone-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-200"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt || "all"} value={opt}>
              {opt ? labelize(opt) : "All Statuses"}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-stone-900 border border-amber-500/30 rounded-lg px-3 py-2 text-amber-200"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt || "all"} value={opt}>
              {opt ? labelize(opt) : "All Categories"}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-amber-300 py-12 text-center">Loading report queue...</div>
      ) : items.length === 0 ? (
        <div className="bg-card-bg border border-amber-500/30 rounded-xl p-12 text-center text-amber-200">
          No reports found for selected filters.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.reportId}
              className="bg-card-bg border border-amber-500/30 rounded-xl p-4"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2 py-1 rounded-full text-xs bg-stone-800 text-amber-200">
                  {labelize(item.reportCategory || "other")}
                </span>
                <span className="px-2 py-1 rounded-full text-xs bg-stone-800 text-amber-200">
                  {labelize(item.moderationStatus || "pending")}
                </span>
                <span className="text-xs text-amber-200/70">
                  {item.reportedAt
                    ? new Date(item.reportedAt).toLocaleString()
                    : "Unknown time"}
                </span>
              </div>

              <p className="text-amber-100 mb-2">
                <span className="text-amber-300 font-semibold">Reason:</span>{" "}
                {item.reason}
              </p>
              {item.additionalDetails ? (
                <p className="text-amber-100/85 mb-2">
                  <span className="text-amber-300 font-semibold">Details:</span>{" "}
                  {item.additionalDetails}
                </p>
              ) : null}

              <p className="text-amber-100/80 mb-2">
                <span className="text-amber-300 font-semibold">Post by:</span> @
                {item.postAuthor}
              </p>
              <p className="text-amber-100/90 mb-3">{item.postContent}</p>
              {item.postMedia ? (
                <img
                  src={item.postMedia}
                  alt="Reported post media"
                  className="w-full max-h-72 object-cover rounded-lg border border-amber-500/20 mb-3"
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus(item, "under_review")}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-amber-200 text-sm"
                >
                  Mark Under Review
                </button>
                <button
                  onClick={() => updateStatus(item, "resolved")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-sm"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => updateStatus(item, "dismissed")}
                  className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 1}
          onClick={() => loadQueue(page - 1)}
          className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-200 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-amber-200 text-sm">
          Page {page} of {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => loadQueue(page + 1)}
          className="px-4 py-2 rounded-lg border border-amber-500/30 text-amber-200 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ModerationDashboard;
