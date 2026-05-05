import freeAPI from "@/BackendRoutes/FreeAPI";
import { usePaginatedData } from "@/lib/utils";
import React from "react";
import { PaginatedList } from "./PaginatedList";
import { useNavigate } from "react-router-dom";

interface YouTubeVideo {
  items: {
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: {
        medium: { url: string; width: number; height: number };
      };
      tags: string[];
      description: string;
    };
    contentDetails: {
      duration: string; // ISO 8601 e.g. "PT19M35S"
    };
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
  };
}

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

const YT_app = () => {
  const { items: videos, ...pagination } = usePaginatedData<YouTubeVideo>({
    fetchFn: freeAPI.getYouTubeVideos,
  });
  const navigate = useNavigate();

  return (
    <PaginatedList
      title="YouTube Videos"
      items={videos}
      {...pagination}
      renderItem={(video, i) => (
        <div
          key={video.items.id ?? i}
          className="flex gap-4 items-start rounded-md bg-white p-3 shadow cursor-pointer"
          onClick={() => {
            navigate(`/app/freeAPI/yt/${video.items.id}`);
          }}
        >
          <div className="text-sm text-muted-foreground w-6 pt-1">{i + 1}.</div>

          {/* Thumbnail */}
          <div className="relative shrink-0">
            <img
              src={video.items.snippet.thumbnails.medium.url}
              alt={video.items.snippet.title}
              className="w-40 h-24 rounded-md object-cover"
            />
            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 rounded">
              {formatDuration(video.items.contentDetails.duration)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-snug line-clamp-2">
              {video.items.snippet.title}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {video.items.snippet.channelTitle}
            </div>

            {/* Statistics */}
            <div className="flex gap-3 text-xs text-muted-foreground mt-2">
              <span>
                👁️ {formatCount(video.items.statistics.viewCount)} views
              </span>
              <span>👍 {formatCount(video.items.statistics.likeCount)}</span>
              <span>💬 {formatCount(video.items.statistics.commentCount)}</span>
            </div>

            {/* Tags */}
            {video.items.snippet.tags?.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {video.items.snippet.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-muted px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    />
  );
};

export default YT_app;
