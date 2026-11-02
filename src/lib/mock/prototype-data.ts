import type { EcoShareFeedTabId } from "@/lib/constants/design-tokens";

export interface PrototypeAuthor {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly avatarInitials: string;
  readonly avatarColor: string;
  readonly avatarSrc?: string;
  readonly location: string;
  readonly isVerifiedContributor: boolean;
}

export interface PrototypePostMedia {
  readonly id: string;
  readonly src: string;
  readonly alt: string;
  readonly hasVerifiedImpactBadge?: boolean;
}

export interface PrototypePost {
  readonly id: string;
  readonly isPrototype: true;
  readonly author: PrototypeAuthor;
  readonly publishedRelative: string;
  readonly content: string;
  readonly category: string;
  readonly isVerifiedImpact: boolean;
  readonly isFollowingAuthor: boolean;
  readonly media: readonly PrototypePostMedia[];
  readonly initialLikes: number;
  readonly initialComments: number;
  readonly initialBookmarked?: boolean;
}

export interface PrototypeChallenge {
  readonly id: string;
  readonly isPrototype: true;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly thumbnailSrc: string;
  readonly participantsCount: number;
  readonly rewardXp: number;
  readonly durationLabel: string;
}

export interface PrototypeCommunity {
  readonly id: string;
  readonly isPrototype: true;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly membersCount: number;
  readonly visibility: "public" | "private";
  readonly bannerSrc: string;
}

export interface PrototypeBadgeItem {
  readonly id: string;
  readonly isPrototype: true;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly iconName: "leaf" | "recycle" | "users" | "award";
  readonly accentRing: "green" | "gold";
  readonly earned: boolean;
}

export interface PrototypeProfileSummary {
  readonly isPrototype: true;
  readonly username: string;
  readonly displayName: string;
  readonly bio: string;
  readonly location: string;
  readonly joinedLabel: string;
  readonly avatarSrc: string;
  readonly coverSrc: string;
  readonly isVerifiedContributor: boolean;
  readonly totalXp: number;
  readonly verifiedActionsCount: number;
  readonly badgesEarnedCount: number;
  readonly totalBadgesAvailable: number;
  readonly followersCount: number;
  readonly followingCount: number;
}

export interface PrototypeVerificationReviewItem {
  readonly id: string;
  readonly isPrototype: true;
  readonly submitterName: string;
  readonly submitterHandle: string;
  readonly submittedRelative: string;
  readonly activityTitle: string;
  readonly category: string;
  readonly location: string;
  readonly thumbnailSrc: string;
  readonly status: "pending" | "approved" | "rejected";
}

/**
 * Reference user profile ("Alex R.") from references/ecoshare-ui-reference.png,
 * using authoritative PRD §8.2 XP thresholds (Level 4: Planet Protector at 350 XP,
 * Level 5: Earth Champion at 700 XP).
 */
export const PROTOTYPE_USER_PROFILE: PrototypeProfileSummary = {
  isPrototype: true,
  username: "alexr",
  displayName: "Alex R.",
  bio: "Urban reforestation volunteer & watershed cleanup organizer. Sharing community actions for a cleaner planet.",
  location: "Monterrey, Mexico",
  joinedLabel: "Joined EcoShare · Prototype Preview",
  avatarSrc: "/images/avatar-alex.png",
  coverSrc: "/images/hero-mountains.png",
  isVerifiedContributor: true,
  totalXp: 420,
  verifiedActionsCount: 7,
  badgesEarnedCount: 4,
  totalBadgesAvailable: 12,
  followersCount: 148,
  followingCount: 92,
};

export const PROTOTYPE_BADGES: readonly PrototypeBadgeItem[] = [
  {
    id: "badge-first-action",
    isPrototype: true,
    slug: "first-action",
    name: "First Action",
    description: "Completed and verified your first environmental contribution.",
    iconName: "leaf",
    accentRing: "green",
    earned: true,
  },
  {
    id: "badge-good-collector",
    isPrototype: true,
    slug: "good-collector",
    name: "Good Collector",
    description: "Verified 3 community litter or recycling cleanup submissions.",
    iconName: "recycle",
    accentRing: "gold",
    earned: true,
  },
  {
    id: "badge-community-helper",
    isPrototype: true,
    slug: "community-helper",
    name: "Community Helper",
    description: "Collaborated in verified group environmental initiatives.",
    iconName: "users",
    accentRing: "green",
    earned: true,
  },
  {
    id: "badge-eco-contributor",
    isPrototype: true,
    slug: "eco-contributor",
    name: "Eco Contributor",
    description: "Sustained verified environmental participation across multiple categories.",
    iconName: "award",
    accentRing: "gold",
    earned: true,
  },
];

export const PROTOTYPE_POSTS: readonly PrototypePost[] = [
  {
    id: "post-sofia-cleanup",
    isPrototype: true,
    author: {
      id: "author-sofia",
      username: "sofiam",
      displayName: "Sofia M.",
      avatarInitials: "SM",
      avatarColor: "#15803D",
      avatarSrc: "/images/avatar-sofia.png",
      location: "Monterrey, Mexico",
      isVerifiedContributor: true,
    },
    publishedRelative: "2 hours ago",
    content:
      "Cleaned up litter at Fundidora Park today with my classmates! ♻️ Small actions make a big difference. 💚",
    category: "Community Cleanup",
    isVerifiedImpact: true,
    isFollowingAuthor: true,
    media: [
      {
        id: "media-sofia-1",
        src: "/images/cleanup-park.png",
        alt: "Gloved volunteer hand collecting recyclable plastic bottle on park grass",
      },
      {
        id: "media-sofia-2",
        src: "/images/cleanup-team.png",
        alt: "Four classmates in recycling volunteer shirts smiling at Fundidora Park",
        hasVerifiedImpactBadge: true,
      },
    ],
    initialLikes: 284,
    initialComments: 27,
    initialBookmarked: false,
  },
  {
    id: "post-marcus-trees",
    isPrototype: true,
    author: {
      id: "author-marcus",
      username: "marcusv",
      displayName: "Marcus V.",
      avatarInitials: "MV",
      avatarColor: "#047857",
      avatarSrc: "/images/avatar-marcus.png",
      location: "Portland, USA",
      isVerifiedContributor: true,
    },
    publishedRelative: "5 hours ago",
    content:
      "Our weekend urban canopy group planted 18 native oak saplings along the river trail. Submitted evidence through the Impact workflow for verifier review!",
    category: "Tree Planting",
    isVerifiedImpact: true,
    isFollowingAuthor: true,
    media: [
      {
        id: "media-marcus-1",
        src: "/images/challenge-trees.png",
        alt: "Newly planted native sapling in rich soil",
        hasVerifiedImpactBadge: true,
      },
    ],
    initialLikes: 142,
    initialComments: 19,
    initialBookmarked: true,
  },
  {
    id: "post-david-oceans",
    isPrototype: true,
    author: {
      id: "author-david",
      username: "davidl",
      displayName: "David L.",
      avatarInitials: "DL",
      avatarColor: "#0284C7",
      avatarSrc: "/images/avatar-alex.png",
      location: "San Diego, USA",
      isVerifiedContributor: true,
    },
    publishedRelative: "8 hours ago",
    content:
      "Recorded 14 kg of marine microplastics and abandoned fishing gear removed during our low-tide shoreline survey at Balboa Cove. Clean waters protect our marine life! 🌊🐢",
    category: "Ocean Conservation",
    isVerifiedImpact: true,
    isFollowingAuthor: false,
    media: [
      {
        id: "media-david-1",
        src: "/images/challenge-oceans.png",
        alt: "Green sea turtle in turquoise coastal waters",
        hasVerifiedImpactBadge: true,
      },
    ],
    initialLikes: 198,
    initialComments: 14,
    initialBookmarked: false,
  },
  {
    id: "post-maya-pollinators",
    isPrototype: true,
    author: {
      id: "author-maya",
      username: "mayas",
      displayName: "Maya S.",
      avatarInitials: "MS",
      avatarColor: "#D97706",
      avatarSrc: "/images/avatar-elena.png",
      location: "Vancouver, Canada",
      isVerifiedContributor: true,
    },
    publishedRelative: "12 hours ago",
    content:
      "Planted a native clover and lavender micro-meadow to support urban bumblebee populations. Documented flower coverage and visitor density for our local biodiversity audit! 🐝🌸",
    category: "Wildlife Conservation",
    isVerifiedImpact: true,
    isFollowingAuthor: true,
    media: [
      {
        id: "media-maya-1",
        src: "/images/wildlife-pollinator.png",
        alt: "Bumblebee pollinating purple wildflower blossoms in community garden",
        hasVerifiedImpactBadge: true,
      },
    ],
    initialLikes: 215,
    initialComments: 23,
    initialBookmarked: false,
  },
  {
    id: "post-elena-discussion",
    isPrototype: true,
    author: {
      id: "author-elena",
      username: "elenak",
      displayName: "Elena K.",
      avatarInitials: "EK",
      avatarColor: "#0369A1",
      avatarSrc: "/images/avatar-elena.png",
      location: "Lisbon, Portugal",
      isVerifiedContributor: false,
    },
    publishedRelative: "1 day ago",
    content:
      "What reusable containers do you bring for zero-waste grocery shopping? Looking for lightweight ideas before starting the 7-Day Plastic Reduction Challenge.",
    category: "Sustainable Living",
    isVerifiedImpact: false,
    isFollowingAuthor: false,
    media: [],
    initialLikes: 64,
    initialComments: 31,
    initialBookmarked: false,
  },
];

export const PROTOTYPE_CHALLENGES: readonly PrototypeChallenge[] = [
  {
    id: "challenge-clean-oceans",
    isPrototype: true,
    slug: "clean-oceans-challenge",
    title: "Clean Oceans Challenge",
    description: "Collect and properly dispose of litter in your area.",
    category: "Community Cleanup",
    thumbnailSrc: "/images/challenge-oceans.png",
    participantsCount: 12430,
    rewardXp: 75,
    durationLabel: "14 days remaining",
  },
  {
    id: "challenge-plant-for-tomorrow",
    isPrototype: true,
    slug: "plant-for-tomorrow",
    title: "Plant for Tomorrow",
    description: "Plant trees or support reforestation efforts.",
    category: "Tree Planting",
    thumbnailSrc: "/images/challenge-trees.png",
    participantsCount: 8920,
    rewardXp: 100,
    durationLabel: "21 days remaining",
  },
  {
    id: "challenge-zero-waste-week",
    isPrototype: true,
    slug: "zero-waste-week",
    title: "7-Day Plastic Reduction Challenge",
    description: "Eliminate single-use plastics for a full week and document your swaps.",
    category: "Recycling Initiatives",
    thumbnailSrc: "/images/cleanup-park.png",
    participantsCount: 5340,
    rewardXp: 50,
    durationLabel: "7 days remaining",
  },
];

export const PROTOTYPE_COMMUNITIES: readonly PrototypeCommunity[] = [
  {
    id: "community-beach-cleanup",
    isPrototype: true,
    slug: "beach-cleanup-volunteers",
    name: "Beach Cleanup Volunteers",
    description: "Coordinating coastal cleanups, marine debris tracking, and shoreline protection.",
    category: "Ocean Conservation",
    membersCount: 14820,
    visibility: "public",
    bannerSrc: "/images/challenge-oceans.png",
  },
  {
    id: "community-urban-gardening",
    isPrototype: true,
    slug: "urban-gardening-collective",
    name: "Urban Gardening & Reforestation",
    description: "Transforming city rooftops, schoolyards, and parks with native trees and pollinator gardens.",
    category: "Tree Planting",
    membersCount: 9640,
    visibility: "public",
    bannerSrc: "/images/challenge-trees.png",
  },
  {
    id: "community-recycling-initiatives",
    isPrototype: true,
    slug: "community-recycling-network",
    name: "Zero-Waste & Recycling Advocates",
    description: "Practical community recycling drives, repair cafes, and local waste-reduction education.",
    category: "Recycling Initiatives",
    membersCount: 7210,
    visibility: "public",
    bannerSrc: "/images/cleanup-park.png",
  },
];

export const PROTOTYPE_TRENDING_TOPICS: readonly {
  readonly id: string;
  readonly tag: string;
  readonly category: string;
  readonly actionsCountLabel: string;
}[] = [
  {
    id: "topic-1",
    tag: "#FundidoraParkCleanup",
    category: "Community Cleanup",
    actionsCountLabel: "420 verified actions",
  },
  {
    id: "topic-2",
    tag: "#UrbanTreeCanopy",
    category: "Tree Planting",
    actionsCountLabel: "315 verified actions",
  },
  {
    id: "topic-3",
    tag: "#CoastalPlasticFree",
    category: "Ocean Conservation",
    actionsCountLabel: "890 verified actions",
  },
  {
    id: "topic-4",
    tag: "#CampusRecyclingDrive",
    category: "Recycling Initiatives",
    actionsCountLabel: "210 verified actions",
  },
];

export const PROTOTYPE_VERIFICATION_QUEUE: readonly PrototypeVerificationReviewItem[] = [
  {
    id: "verify-sofia-1",
    isPrototype: true,
    submitterName: "Sofia M.",
    submitterHandle: "@sofiam",
    submittedRelative: "2 hours ago",
    activityTitle: "Cleanup Activity",
    category: "Community Cleanup",
    location: "Fundidora Park, Monterrey",
    thumbnailSrc: "/images/cleanup-park.png",
    status: "pending",
  },
];

export function filterPrototypePostsByTab(
  posts: readonly PrototypePost[],
  tab: EcoShareFeedTabId,
): readonly PrototypePost[] {
  if (tab === "following") {
    return posts.filter((post) => post.isFollowingAuthor);
  }
  if (tab === "verified-impact") {
    return posts.filter((post) => post.isVerifiedImpact);
  }
  return posts;
}
