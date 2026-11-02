import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import {
  PROTOTYPE_BADGES,
  PROTOTYPE_POSTS,
  PROTOTYPE_USER_PROFILE,
} from "@/lib/mock/prototype-data";

export interface PublicProfilePageProps {
  readonly params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;
  const normalizedUsername = decodeURIComponent(username).replace(/^@/, "");

  const matchingAuthorPost = PROTOTYPE_POSTS.find(
    (post) =>
      post.author.username.toLowerCase() === normalizedUsername.toLowerCase(),
  );

  const profile =
    matchingAuthorPost &&
    normalizedUsername.toLowerCase() !==
      PROTOTYPE_USER_PROFILE.username.toLowerCase()
      ? {
          ...PROTOTYPE_USER_PROFILE,
          username: matchingAuthorPost.author.username,
          displayName: matchingAuthorPost.author.displayName,
          location: matchingAuthorPost.author.location,
          isVerifiedContributor:
            matchingAuthorPost.author.isVerifiedContributor,
        }
      : {
          ...PROTOTYPE_USER_PROFILE,
          username: normalizedUsername || PROTOTYPE_USER_PROFILE.username,
        };

  return (
    <div className="space-y-4">
      <ProfileHeader profile={profile} isOwnProfile={false} />
      <ProfileStats profile={profile} />
      <ProfileTabs
        profile={profile}
        posts={PROTOTYPE_POSTS}
        badges={PROTOTYPE_BADGES}
      />
    </div>
  );
}
