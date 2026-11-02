import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EcoShareLogo } from "@/components/branding/EcoShareLogo";
import { PrototypeBanner } from "@/components/branding/PrototypeBanner";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { PostCard } from "@/components/feed/PostCard";
import { BadgeCard } from "@/components/gamification/BadgeCard";
import { LevelCard } from "@/components/gamification/LevelCard";
import { VerificationBadge } from "@/components/impact/VerificationBadge";
import { VerificationReviewCard } from "@/components/impact/VerificationReviewCard";
import {
  filterPrototypePostsByTab,
  PROTOTYPE_BADGES,
  PROTOTYPE_CHALLENGES,
  PROTOTYPE_COMMUNITIES,
  PROTOTYPE_POSTS,
  PROTOTYPE_USER_PROFILE,
  PROTOTYPE_VERIFICATION_QUEUE,
} from "@/lib/mock/prototype-data";

describe("Milestone 1 UI Foundation components and prototype boundaries", () => {
  it("marks all prototype sample entities with isPrototype: true", () => {
    expect(PROTOTYPE_USER_PROFILE.isPrototype).toBe(true);
    expect(PROTOTYPE_POSTS.every((post) => post.isPrototype === true)).toBe(true);
    expect(
      PROTOTYPE_CHALLENGES.every((challenge) => challenge.isPrototype === true),
    ).toBe(true);
    expect(
      PROTOTYPE_COMMUNITIES.every((community) => community.isPrototype === true),
    ).toBe(true);
    expect(PROTOTYPE_BADGES.every((badge) => badge.isPrototype === true)).toBe(
      true,
    );
    expect(
      PROTOTYPE_VERIFICATION_QUEUE.every((item) => item.isPrototype === true),
    ).toBe(true);
  });

  it("filters prototype feed posts accurately by tab", () => {
    const forYouPosts = filterPrototypePostsByTab(PROTOTYPE_POSTS, "for-you");
    const followingPosts = filterPrototypePostsByTab(
      PROTOTYPE_POSTS,
      "following",
    );
    const verifiedPosts = filterPrototypePostsByTab(
      PROTOTYPE_POSTS,
      "verified-impact",
    );

    expect(forYouPosts.length).toBe(PROTOTYPE_POSTS.length);
    expect(followingPosts.every((post) => post.isFollowingAuthor)).toBe(true);
    expect(verifiedPosts.every((post) => post.isVerifiedImpact)).toBe(true);
    expect(verifiedPosts.length).toBe(
      PROTOTYPE_POSTS.filter((post) => post.isVerifiedImpact).length,
    );
  });

  it("renders EcoShareLogo and PrototypeBanner with clear prototype messaging", () => {
    render(
      <div>
        <EcoShareLogo />
        <PrototypeBanner />
      </div>,
    );

    expect(screen.getByText("EcoShare")).toBeTruthy();
    expect(screen.getByText(/Milestone 1 UI Preview/i)).toBeTruthy();
  });

  it("renders LevelCard using authoritative PRD §8.2 thresholds for 420 XP (Level 4: Planet Protector)", () => {
    render(<LevelCard totalXp={420} />);

    expect(screen.getByText("Level 4: Planet Protector")).toBeTruthy();
    expect(screen.getByText("420 XP Points")).toBeTruthy();
    expect(screen.getByText(/Next Level: Earth Champion/i)).toBeTruthy();
    expect(screen.getAllByText(/700 XP/i).length).toBeGreaterThan(0);
  });

  it("renders Sofia M.'s reference post card with Verified Impact indicator and interactive local like toggle", () => {
    const sofiaPost = PROTOTYPE_POSTS[0]!;
    render(<PostCard post={sofiaPost} />);

    expect(screen.getByText("Sofia M.")).toBeTruthy();
    expect(
      screen.getByText(/Cleaned up litter at Fundidora Park today/i),
    ).toBeTruthy();
    expect(screen.getAllByText("Verified Impact").length).toBeGreaterThan(0);

    const likeButton = screen.getByRole("button", {
      name: /Like post \(284 likes\)/i,
    });
    expect(likeButton.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(likeButton);
    const updatedLikeButton = screen.getByRole("button", {
      name: /Like post \(285 likes\)/i,
    });
    expect(updatedLikeButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders FeedTabs and invokes onTabChange when switching tabs", () => {
    let selected = "for-you";
    render(
      <FeedTabs
        activeTab="for-you"
        onTabChange={(nextTab) => {
          selected = nextTab;
        }}
      />,
    );

    const verifiedTab = screen.getByRole("tab", { name: /Verified Impact/i });
    fireEvent.click(verifiedTab);
    expect(selected).toBe("verified-impact");
  });

  it("renders VerificationBadge, BadgeCard, and VerificationReviewCard", () => {
    render(
      <div>
        <VerificationBadge status="verified" />
        <BadgeCard badge={PROTOTYPE_BADGES[0]!} />
        <VerificationReviewCard items={PROTOTYPE_VERIFICATION_QUEUE} />
      </div>,
    );

    expect(screen.getByText("First Action")).toBeTruthy();
    expect(screen.getByText("Verification Review")).toBeTruthy();
    expect(screen.getByText("Cleanup Activity")).toBeTruthy();

    const approveButton = screen.getByRole("button", { name: /Approve/i });
    fireEvent.click(approveButton);
    expect(screen.getByText("Preview: Approved")).toBeTruthy();
  });
});
