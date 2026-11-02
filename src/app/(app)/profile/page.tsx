"use client";

import { useUser } from "@clerk/nextjs";

import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import {
  PROTOTYPE_BADGES,
  PROTOTYPE_POSTS,
  PROTOTYPE_USER_PROFILE,
} from "@/lib/mock/prototype-data";

export default function MyProfilePage() {
  const { isSignedIn, user } = useUser();

  const resolvedProfile =
    isSignedIn && user
      ? {
          ...PROTOTYPE_USER_PROFILE,
          displayName:
            user.fullName ||
            user.username ||
            PROTOTYPE_USER_PROFILE.displayName,
          username: user.username || PROTOTYPE_USER_PROFILE.username,
        }
      : PROTOTYPE_USER_PROFILE;

  return (
    <div className="space-y-4">
      <ProfileHeader profile={resolvedProfile} isOwnProfile={true} />
      <ProfileStats profile={resolvedProfile} />
      <ProfileTabs
        profile={resolvedProfile}
        posts={PROTOTYPE_POSTS}
        badges={PROTOTYPE_BADGES}
      />
    </div>
  );
}
