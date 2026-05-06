import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import freeAPI from "@/BackendRoutes/FreeAPI";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationIconsOnly } from "@/components/ui/pagination-icons-only";

// ── Types ──────────────────────────────────────────────────────────────────

interface VideoSnippet {
  title: string;
  channelTitle: string;
  publishedAt: string;
  description: string;
  tags: string[];
  thumbnails: {
    medium: { url: string };
    maxres?: { url: string };
    high: { url: string };
  };
}

interface VideoItem {
  id: string;
  snippet: VideoSnippet;
  contentDetails: { duration: string };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

interface ChannelInfo {
  title: string;
  description: string;
  thumbnails: { default: { url: string } };
}

interface VideoPageData {
  channel: {
    info: ChannelInfo;
    statistics: {
      subscriberCount: string;
      viewCount: string;
      videoCount: string;
    };
  };
  video: { items: VideoItem };
}

interface Comment {
  id: string;
  snippet: {
    topLevelComment: {
      snippet: {
        textDisplay: string;
        authorDisplayName: string;
        authorProfileImageUrl: string;
        likeCount: number;
        publishedAt: string;
      };
    };
    totalReplyCount: number;
  };
}

interface RelatedVideo {
  items: VideoItem;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const formatDuration = (iso: string) => {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const [, h, m, s] = match;
  return [h, m ?? "0", (s ?? "0").padStart(2, "0")]
    .filter((v, i) => i > 0 || v)
    .join(":");
};

const formatCount = (n: string) => {
  const num = parseInt(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return n;
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

// ── Skeleton rows ──────────────────────────────────────────────────────────

const CommentSkeleton = () => (
  <div className="flex gap-3 p-3">
    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const RelatedSkeleton = () => (
  <div className="flex gap-2 items-start">
    <Skeleton className="w-32 h-20 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2 pt-1">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const YTVideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();

  const [videoData, setVideoData] = useState<VideoPageData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [related, setRelated] = useState<RelatedVideo[]>([]);

  // related pagination state — all sourced from rRes
  const [relatedPage, setRelatedPage] = useState(1);
  const [relatedLimit, setRelatedLimit] = useState(10);
  const [relatedTotal, setRelatedTotal] = useState(0);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  // fetch video + comments on videoId change
  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    setComments([]);

    const fetchVideo = async () => {
      try {
        const vRes: any = await freeAPI.getAYoutubeVideo(videoId);
        setVideoData(vRes ?? null);
      } catch (e: any) {
        console.error("Failed to fetch video:", e?.message ?? e);
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res: any = await freeAPI.getYouTubeVideoComment(videoId, {});
        setComments(res ?? []);
      } catch (e: any) {
        console.error("Failed to fetch comments:", e?.message ?? e);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchVideo();
    fetchComments();
  }, [videoId]);

  // fetch related videos — refetches on page change
  useEffect(() => {
    if (!videoId) return;
    setLoadingRelated(true);

    const fetchRelated = async () => {
      try {
        const rRes: any = await freeAPI.getRelatedVideos(videoId, {
          page: relatedPage,
          limit: relatedLimit,
        });
        const d = rRes;
        setRelated(d?.data ?? []);
        setRelatedTotal(d?.totalItems ?? 0);
        setRelatedLimit(d?.limit ?? 10);
      } catch (e: any) {
        console.error("Failed to fetch related:", e?.message ?? e);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelated();
  }, [videoId, relatedPage, relatedLimit]);

  const video = videoData?.video?.items;
  const channel = videoData?.channel;

  return (
    <div className="flex gap-6 p-4 min-h-screen">
      {/* ── Left: video + info + comments ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Video embed */}
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
          {loading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title={video?.snippet.title}
              allowFullScreen
            />
          )}
        </div>

        {/* Title */}
        {loading ? (
          <Skeleton className="h-6 w-3/4" />
        ) : (
          <h1 className="text-lg font-bold leading-snug">
            {video?.snippet.title}
          </h1>
        )}

        {/* Channel row + stats */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img
                src={channel?.info.thumbnails.default.url}
                alt={channel?.info.title}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-sm">
                  {channel?.info.title}
                </div>
                <div className="text-xs">
                  {formatCount(channel?.statistics.subscriberCount ?? "0")}{" "}
                  subscribers
                </div>
              </div>
            </div>
          )}

          {/* Stat pills */}
          {loading ? (
            <div className="flex gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ) : (
            video && (
              <div className="flex gap-2 flex-wrap">
                {[
                  {
                    icon: "👁️",
                    val: video.statistics.viewCount,
                    label: "views",
                  },
                  { icon: "👍", val: video.statistics.likeCount, label: "" },
                  { icon: "💬", val: video.statistics.commentCount, label: "" },
                ].map(({ icon, val, label }) => (
                  <span
                    key={icon}
                    className="text-xs bg-white/10 border border-white/20 px-3 py-1 rounded-full"
                  >
                    {icon} {formatCount(val)} {label}
                  </span>
                ))}
              </div>
            )
          )}
        </div>

        {/* Description */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
          </div>
        ) : (
          video && (
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-sm whitespace-pre-line line-clamp-4">
              {video.snippet.description}
            </div>
          )
        )}

        {/* Tags */}
        {loading ? (
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        ) : (
          (video?.snippet.tags?.length ?? 0) > 0 && (
            <div className="flex gap-2 flex-wrap">
              {video!.snippet.tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="text-xs border px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )
        )}

        {/* ── Comments ── */}
        <div className="mt-2">
          <h2 className="font-semibold text-base mb-3">Comments</h2>
          <div className="flex flex-col gap-3">
            {loadingComments
              ? Array.from({ length: 6 }).map((_, i) => (
                  <CommentSkeleton key={i} />
                ))
              : comments.map((c) => {
                  const s = c.snippet.topLevelComment.snippet;
                  return (
                    <div
                      key={c.id}
                      className="flex gap-3 bg-white/10 border border-white/20 rounded-xl p-3"
                    >
                      <img
                        src={s.authorProfileImageUrl}
                        alt={s.authorDisplayName}
                        className="h-8 w-8 rounded-full shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {s.authorDisplayName}
                          </span>
                          <span className="text-xs">
                            {timeAgo(s.publishedAt)}
                          </span>
                        </div>
                        <div
                          className="text-sm mt-1"
                          dangerouslySetInnerHTML={{ __html: s.textDisplay }}
                        />
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          👍 {s.likeCount}
                          {c.snippet.totalReplyCount > 0 && (
                            <span className="ml-2">
                              · {c.snippet.totalReplyCount} replies
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      {/* ── Right: related videos ── */}
      <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto max-h-screen sticky top-0 pb-4">
        <h2 className="font-semibold text-base">Related Videos</h2>

        {loadingRelated
          ? Array.from({ length: 8 }).map((_, i) => <RelatedSkeleton key={i} />)
          : related.map((r, i) => {
              const v = r.items;

              return (
                <div
                  key={v?.id ?? i}
                  className="flex gap-2 cursor-pointer group"
                  onClick={() => {
                    navigate(`/app/freeAPI/yt/${v.id}`);
                    setRelatedPage(1);
                  }}
                >
                  <div className="relative shrink-0">
                    <img
                      src={v.snippet.thumbnails.medium.url}
                      alt={v.snippet.title}
                      className="w-32 h-20 rounded-lg object-cover transition-opacity group-hover:opacity-80"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
                      {formatDuration(v.contentDetails.duration)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold line-clamp-2 leading-snug">
                      {v.snippet.title}
                    </div>
                    <div className="text-xs mt-1">{v.snippet.channelTitle}</div>
                    <div className="text-xs mt-0.5">
                      {formatCount(v.statistics.viewCount)} views ·{" "}
                      {timeAgo(v.snippet.publishedAt)}
                    </div>
                  </div>
                </div>
              );
            })}

        {/* Pagination */}
        {!loadingRelated && relatedTotal > 0 && (
          <PaginationIconsOnly
            page={relatedPage}
            pageSize={relatedLimit}
            total={relatedTotal}
            onPageChange={(p) => setRelatedPage(p)}
            onPageSizeChange={(s) => {
              setRelatedLimit(s);
              setRelatedPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default YTVideoPage;
