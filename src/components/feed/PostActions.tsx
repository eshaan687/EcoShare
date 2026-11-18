"use client";

import {
  Bookmark,
  CornerDownRight,
  Heart,
  MessageCircle,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { Avatar } from "@/components/ui/Avatar";
import { useSafeUser } from "@/lib/auth/clerk-hooks";
import { useSafeSupabaseClient } from "@/lib/supabase/client";
import { ensureCurrentUserProfile } from "@/lib/supabase/profile-sync";
import { cn } from "@/lib/utils";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PostCommentItem {
  readonly id: string;
  readonly post_id: string;
  readonly author_id: string;
  readonly parent_comment_id: string | null;
  readonly content: string;
  readonly created_at: string;
  readonly author_name: string;
  readonly author_username: string;
  readonly author_avatar: string | null;
}

interface SupabaseCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export const BOOKMARK_CHANGED_EVENT = "ecoshare:bookmark-changed";

export interface PostActionsProps {
  readonly postId: string;
  readonly initialLikes: number;
  readonly initialComments: number;
  readonly initialBookmarked?: boolean;
  readonly className?: string;
}

/**
 * Interactive social action bar for a post card.
 * Persists Likes, Comments, Replies, Comment Deletions, Bookmarks, and Share Links in Supabase.
 */
export function PostActions({
  postId,
  initialLikes,
  initialComments,
  initialBookmarked = false,
  className,
}: PostActionsProps) {
  const supabase = useSafeSupabaseClient();
  const { isSignedIn, user } = useSafeUser();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [sharedFeedback, setSharedFeedback] = useState(false);

  // Comments & Replies state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<readonly PostCommentItem[]>([]);
  const [commentsDelta, setCommentsDelta] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [replyToComment, setReplyToComment] = useState<PostCommentItem | null>(
    null,
  );
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const likeCount = initialLikes + (liked ? 1 : 0);
  const displayedCommentCount = Math.max(0, initialComments + commentsDelta);

  const loadComments = useCallback(async () => {
    if (!supabase || !UUID_REGEX.test(postId)) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(
          `
          id,
          post_id,
          author_id,
          parent_comment_id,
          content,
          created_at,
          profiles:author_id (
            display_name,
            username,
            avatar_url
          )
        `,
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!error && data) {
        const rows = data as unknown as SupabaseCommentRow[];
        setComments(
          rows.map((r) => ({
            id: r.id,
            post_id: r.post_id,
            author_id: r.author_id,
            parent_comment_id: r.parent_comment_id,
            content: r.content,
            created_at: r.created_at,
            author_name: r.profiles?.display_name ?? "EcoShare Member",
            author_username: r.profiles?.username ?? "ecoshare",
            author_avatar: r.profiles?.avatar_url ?? null,
          })),
        );
      }
    } finally {
      setLoadingComments(false);
    }
  }, [supabase, postId]);

  async function handleToggleLike() {
    const nextLiked = !liked;
    setLiked(nextLiked);

    if (!isSignedIn || !user || !supabase || !UUID_REGEX.test(postId)) {
      return;
    }

    try {
      await ensureCurrentUserProfile(supabase, user);
      if (nextLiked) {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      } else {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      }
    } catch {
      // Keep optimistic UI state smoothly
    }
  }

  async function handleToggleBookmark() {
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);

    if (!isSignedIn || !user || !supabase || !UUID_REGEX.test(postId)) {
      return;
    }

    try {
      await ensureCurrentUserProfile(supabase, user);
      if (nextBookmarked) {
        await supabase.from("post_bookmarks").insert({
          post_id: postId,
          user_id: user.id,
        });
      } else {
        await supabase
          .from("post_bookmarks")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(BOOKMARK_CHANGED_EVENT));
      }
    } catch {
      // Keep optimistic UI state smoothly
    }
  }

  async function handleSharePost() {
    setSharedFeedback((prev) => !prev);
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}/home?post=${encodeURIComponent(postId)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Clipboard fallback
    }
  }

  async function handleToggleComments() {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen) {
      await loadComments();
    }
  }

  async function handleSubmitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    const optimisticItem: PostCommentItem = {
      id: `local-${Date.now()}`,
      post_id: postId,
      author_id: user?.id ?? "guest",
      parent_comment_id: replyToComment?.id ?? null,
      content: trimmed,
      created_at: new Date().toISOString(),
      author_name: user?.fullName ?? user?.username ?? "You",
      author_username: user?.username ?? "you",
      author_avatar: user?.imageUrl ?? null,
    };

    setComments((prev) => [...prev, optimisticItem]);
    setCommentsDelta((prev) => prev + 1);
    setCommentText("");
    const parentId = replyToComment?.id ?? null;
    setReplyToComment(null);

    if (!isSignedIn || !user || !supabase || !UUID_REGEX.test(postId)) {
      return;
    }

    setSubmittingComment(true);
    try {
      await ensureCurrentUserProfile(supabase, user);
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        author_id: user.id,
        parent_comment_id:
          parentId && UUID_REGEX.test(parentId) ? parentId : null,
        content: trimmed,
      });

      if (!error) {
        await loadComments();
      }
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsDelta((prev) => prev - 1);

    if (!isSignedIn || !user || !supabase || !UUID_REGEX.test(commentId)) {
      return;
    }

    await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", user.id);
  }

  return (
    <div className={cn("space-y-3 border-t border-border pt-3", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => void handleToggleLike()}
            aria-pressed={liked}
            aria-label={`Like post (${likeCount} likes)`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition-colors cursor-pointer",
              liked
                ? "bg-error/10 text-error"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            <Heart
              className={cn("h-4 w-4", liked ? "fill-current" : "")}
              aria-hidden="true"
            />
            <span>{likeCount}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleToggleComments()}
            aria-expanded={commentsOpen}
            aria-label={`${displayedCommentCount} comments`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition-colors cursor-pointer",
              commentsOpen
                ? "bg-secondary/50 text-primary-dark"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{displayedCommentCount}</span>
          </button>

          <button
            type="button"
            onClick={() => void handleSharePost()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground cursor-pointer"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            <span>{sharedFeedback ? "Link Previewed" : "Share"}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleToggleBookmark()}
          aria-pressed={bookmarked}
          aria-label={
            bookmarked ? "Remove bookmark (preview)" : "Bookmark post (preview)"
          }
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors cursor-pointer",
            bookmarked
              ? "bg-secondary/50 text-primary-dark"
              : "text-muted-foreground hover:bg-background hover:text-foreground",
          )}
        >
          <Bookmark
            className={cn("h-4 w-4", bookmarked ? "fill-current" : "")}
            aria-hidden="true"
          />
          <span className="sr-only sm:not-sr-only">
            {bookmarked ? "Saved" : "Save"}
          </span>
        </button>
      </div>

      {commentsOpen ? (
        <div className="space-y-3 rounded-2xl border border-border/80 bg-background/60 p-3.5">
          {loadingComments ? (
            <p className="text-xs text-muted-foreground">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No comments yet. Start the environmental conversation below!
            </p>
          ) : (
            <div className="space-y-2.5">
              {comments.map((c) => {
                const isOwn = Boolean(user?.id && c.author_id === user.id);
                const isReply = Boolean(c.parent_comment_id);
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-start justify-between gap-2 rounded-xl bg-surface p-2.5 text-xs shadow-2xs",
                      isReply ? "ml-6 border-l-2 border-primary/40" : "",
                    )}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Link
                        href={`/u/${c.author_username}`}
                        className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                      >
                        <Avatar
                          src={c.author_avatar ?? undefined}
                          alt={c.author_name}
                          size="sm"
                        />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            href={`/u/${c.author_username}`}
                            className="font-bold text-foreground hover:text-primary-dark hover:underline"
                          >
                            {c.author_name}
                          </Link>
                          <Link
                            href={`/u/${c.author_username}`}
                            className="text-[11px] text-muted-foreground hover:underline"
                          >
                            @{c.author_username}
                          </Link>
                        </div>
                        <p className="mt-0.5 text-foreground break-words">
                          {c.content}
                        </p>
                        <button
                          type="button"
                          onClick={() => setReplyToComment(c)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-dark hover:underline cursor-pointer"
                        >
                          <CornerDownRight
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          Reply
                        </button>
                      </div>
                    </div>

                    {isOwn ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteComment(c.id)}
                        aria-label="Delete comment"
                        className="rounded-md p-1 text-muted-foreground hover:bg-error/10 hover:text-error cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {replyToComment ? (
            <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-2.5 py-1 text-[11px] text-primary-dark">
              <span>Replying to @{replyToComment.author_username}</span>
              <button
                type="button"
                onClick={() => setReplyToComment(null)}
                className="font-semibold hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : null}

          <form
            onSubmit={(e) => void handleSubmitComment(e)}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                replyToComment
                  ? `Reply to @${replyToComment.author_username}...`
                  : "Write a comment..."
              }
              aria-label="Write a comment"
              className="h-9 flex-1 rounded-full border border-border bg-surface px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              aria-label="Send comment"
              className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-primary px-3.5 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Post</span>
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
