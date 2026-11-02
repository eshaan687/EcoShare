import { describe, expect, it } from "vitest";
import {
  calculateLevelProgress,
  ECOSHARE_LEVELS,
} from "@/lib/constants/levels";

describe("EcoShare authoritative XP level structure (ECOSHARE_PRD.md §8.2)", () => {
  it("matches exact approved PRD level names and XP thresholds", () => {
    expect(ECOSHARE_LEVELS).toEqual([
      { level: 1, name: "Eco Starter", xpRequired: 0 },
      { level: 2, name: "Good Collector", xpRequired: 50 },
      { level: 3, name: "Eco Guardian", xpRequired: 150 },
      { level: 4, name: "Planet Protector", xpRequired: 350 },
      { level: 5, name: "Earth Champion", xpRequired: 700 },
      { level: 6, name: "Planet Legend", xpRequired: 1500 },
    ]);
  });

  it("computes Level 4 (Planet Protector) and progress toward Level 5 (Earth Champion at 700 XP)", () => {
    const progress = calculateLevelProgress(525);
    expect(progress.currentLevel.level).toBe(4);
    expect(progress.currentLevel.name).toBe("Planet Protector");
    expect(progress.nextLevel?.level).toBe(5);
    expect(progress.nextLevel?.name).toBe("Earth Champion");
    expect(progress.xpIntoCurrentLevel).toBe(175);
    expect(progress.xpNeededForNextLevel).toBe(175);
    expect(progress.progressPercentage).toBe(50);
  });

  it("caps progress at 100% once Level 6 (Planet Legend) is reached", () => {
    const progress = calculateLevelProgress(1800);
    expect(progress.currentLevel.level).toBe(6);
    expect(progress.currentLevel.name).toBe("Planet Legend");
    expect(progress.nextLevel).toBeNull();
    expect(progress.xpNeededForNextLevel).toBe(0);
    expect(progress.progressPercentage).toBe(100);
  });
});
