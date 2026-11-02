export interface EcoShareLevelDefinition {
  readonly level: number;
  readonly name: string;
  readonly xpRequired: number;
}

/**
 * Authoritative EcoShare level structure from ECOSHARE_PRD.md §8.2.
 */
export const ECOSHARE_LEVELS: readonly EcoShareLevelDefinition[] = [
  { level: 1, name: "Eco Starter", xpRequired: 0 },
  { level: 2, name: "Good Collector", xpRequired: 50 },
  { level: 3, name: "Eco Guardian", xpRequired: 150 },
  { level: 4, name: "Planet Protector", xpRequired: 350 },
  { level: 5, name: "Earth Champion", xpRequired: 700 },
  { level: 6, name: "Planet Legend", xpRequired: 1500 },
] as const;

export interface LevelProgressSummary {
  readonly currentLevel: EcoShareLevelDefinition;
  readonly nextLevel: EcoShareLevelDefinition | null;
  readonly totalXp: number;
  readonly xpIntoCurrentLevel: number;
  readonly xpNeededForNextLevel: number;
  readonly progressPercentage: number;
}

export function calculateLevelProgress(totalXp: number): LevelProgressSummary {
  const safeXp = Math.max(0, Math.floor(totalXp));

  let currentIndex = 0;
  for (let i = 0; i < ECOSHARE_LEVELS.length; i += 1) {
    const candidate = ECOSHARE_LEVELS[i];
    if (candidate && safeXp >= candidate.xpRequired) {
      currentIndex = i;
    }
  }

  const currentLevel = ECOSHARE_LEVELS[currentIndex] ?? ECOSHARE_LEVELS[0]!;
  const nextLevel = ECOSHARE_LEVELS[currentIndex + 1] ?? null;

  if (!nextLevel) {
    return {
      currentLevel,
      nextLevel: null,
      totalXp: safeXp,
      xpIntoCurrentLevel: safeXp - currentLevel.xpRequired,
      xpNeededForNextLevel: 0,
      progressPercentage: 100,
    };
  }

  const bandSpan = nextLevel.xpRequired - currentLevel.xpRequired;
  const xpIntoCurrentLevel = safeXp - currentLevel.xpRequired;
  const xpNeededForNextLevel = Math.max(0, nextLevel.xpRequired - safeXp);
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((xpIntoCurrentLevel / bandSpan) * 100)),
  );

  return {
    currentLevel,
    nextLevel,
    totalXp: safeXp,
    xpIntoCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage,
  };
}
