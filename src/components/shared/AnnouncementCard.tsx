"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { addComment, deleteCommentAction } from "@/app/feed/actions";

export type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | null;
};

export type AnnouncementCardProps = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  image_url: string | null;
  profiles: { full_name: string } | null;
  comments: Comment[];
  currentUserId: string;
  currentUserRole: string;
};

const PREVIEW_COUNT = 3;

function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
}: {
  comment: Comment;
  currentUserId: string;
  currentUserRole: string;
}) {
  const canDelete =
    comment.user_id === currentUserId || currentUserRole === "admin";
  const deleteWithId = deleteCommentAction.bind(null, comment.id);

  return (
    <div className="flex gap-2.5 group">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-bold text-foreground mt-0.5">
        {(comment.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-elevated px-3 py-2">
          <p className="text-xs font-semibold text-foreground mb-0.5">
            {comment.profiles?.full_name ?? "Unknown"}
          </p>
          <p className="text-xs text-(--text-secondary) break-words">{comment.content}</p>
        </div>
        <p className="mt-0.5 text-[10px] text-(--text-muted) px-1">
          {new Date(comment.created_at).toLocaleDateString("en-AU", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      {canDelete && (
        <form action={deleteWithId}>
          <button
            type="submit"
            className="mt-1 shrink-0 text-(--text-muted) hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete comment"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </form>
      )}
    </div>
  );
}

function CommentForm({ announcementId }: { announcementId: string }) {
  const [state, formAction] = useActionState(addComment, { error: null });
  const [key, setKey] = useState(0);
  const [chars, setChars] = useState(0);
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (prevStateRef.current !== state && !state.error) {
      setKey((k) => k + 1);
      setChars(0);
    }
    prevStateRef.current = state;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form key={key} action={formAction} className="flex gap-2 mt-3">
      <input type="hidden" name="announcement_id" value={announcementId} />
      <div className="flex-1">
        <textarea
          name="content"
          rows={1}
          maxLength={500}
          placeholder="Write a comment…"
          onChange={(e) => setChars(e.target.value.length)}
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-xs text-foreground placeholder-white/30 focus:border-accent focus:outline-none resize-none"
        />
        {state.error && (
          <p className="text-[10px] text-red-400 mt-0.5">{state.error}</p>
        )}
        {chars > 400 && (
          <p className="text-[10px] text-(--text-muted) mt-0.5 text-right">
            {500 - chars} left
          </p>
        )}
      </div>
      <button
        type="submit"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-black hover:bg-accent-hover transition-colors self-start mt-0.5"
        title="Post comment"
      >
        <Send className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}

export default function AnnouncementCard({
  id,
  title,
  content,
  created_at,
  image_url,
  profiles,
  comments,
  currentUserId,
  currentUserRole,
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);

  const displayedComments = expanded ? comments : comments.slice(0, PREVIEW_COUNT);
  const hasMore = comments.length > PREVIEW_COUNT;

  return (
    <article className="rounded-2xl border border-border bg-surface overflow-hidden">
      {/* Image */}
      {image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image_url}
          alt={title}
          className="w-full object-cover max-h-72"
        />
      )}

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-black">
            {(profiles?.full_name ?? "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {profiles?.full_name ?? "Admin"}
            </p>
            <p className="text-[11px] text-(--text-muted)">
              {new Date(created_at).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div>
          <h3 className="font-semibold text-foreground mb-1.5 text-base">{title}</h3>
          <p className="text-sm text-(--text-secondary) whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </div>

        {/* Comments section */}
        <div className="border-t border-border pt-3">
          {comments.length > 0 && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-(--text-muted)">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>
                {comments.length} comment{comments.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {displayedComments.length > 0 && (
            <div className="space-y-2 mb-3">
              {displayedComments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
              ))}
            </div>
          )}

          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-(--text-secondary) hover:text-foreground transition-colors mb-3"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Show fewer comments
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  View {comments.length - PREVIEW_COUNT} more comment
                  {comments.length - PREVIEW_COUNT !== 1 ? "s" : ""}
                </>
              )}
            </button>
          )}

          <CommentForm announcementId={id} />
        </div>
      </div>
    </article>
  );
}

