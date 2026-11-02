import { Bookmark } from "lucide-react";

import { PostCard } from "@/components/feed/PostCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PROTOTYPE_POSTS } from "@/lib/mock/prototype-data";

export default function BookmarksPrototypePage() {
  const bookmarkedPosts = PROTOTYPE_POSTS.filter((post) => post.initialBookmarked);

  return (
    <div className="space-y-4">
      <Card className="p-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-primary-dark">
            <Bookmark className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Saved Bookmarks</h1>
            <p className="text-xs text-muted-foreground">
              Sample bookmarked posts (Database persistence via `post_bookmarks` in Milestone 2)
            </p>
          </div>
        </div>
        <Badge variant="prototype">Milestone 2 Preview</Badge>
      </Card>

      <div className="space-y-4">
        {bookmarkedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
