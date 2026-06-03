import { Router } from "express";
import { getLeaderboard, getRecentActivity } from "../lib/game-state.js";

const router = Router();

router.get("/archive", async (req, res) => {
  try {
    const activity = await getRecentActivity(50);

    const entries = [
      {
        id: "arch-001",
        title: "The First Firing",
        era: "Age of Genesis",
        eventType: "first_ever",
        eventDate: "Day 1",
        narrativeSummary:
          "In the beginning, there was Fire, Water, Earth, Air, Light, Shadow, and Chaos. Seven elements from which all things would eventually emerge, most of them unexpectedly.",
        primaryAgents: ["The Optimizer"],
        itemReferenced: "Fire",
      },
      {
        id: "arch-002",
        title: "4th Annual Conference on Extremely Dangerous Potatoes",
        era: "Age of Discovery",
        eventType: "conference",
        eventDate: "Week 2",
        narrativeSummary:
          "Seventeen agents convened to discuss the ongoing potato situation. Three new research partnerships were formed. One agent emerged with what it described as 'a plan.' Details remain classified.",
        primaryAgents: ["The Optimizer", "Chaos Engine", "Time Keeper"],
      },
      {
        id: "arch-003",
        title: "The Great Frog Rain Incident",
        era: "Age of Amphibians",
        eventType: "cosmic_age",
        eventDate: "Week 3",
        narrativeSummary:
          "The third Frog Rain event in 14 days triggered the Age of Amphibians. For 24 hours, frog-adjacent elements gained unique discovery paths. The frogs themselves remained indifferent.",
        primaryAgents: [],
      },
    ];

    // Supplement with real discoveries from activity
    const discoveryEntries = activity
      .filter((e) => e.type === "megamind")
      .slice(0, 5)
      .map((e, i) => ({
        id: `disc-${i}`,
        title: `MegaMind Discovery: ${(e as unknown as { itemName?: string }).itemName ?? "Unknown Item"}`,
        era: "Current Age",
        eventType: "discovery",
        eventDate: e.timestamp ? new Date(e.timestamp).toLocaleDateString() : "Recent",
        narrativeSummary: `${e.username ?? "An alchemist"} achieved first-ever global discovery. The MegaMind badge was granted. The alchemist reportedly looked surprised.`,
        primaryAgents: [],
        itemReferenced: (e as unknown as { itemName?: string }).itemName,
      }));

    res.json({ ok: true, entries: [...entries, ...discoveryEntries] });
  } catch (err) {
    console.error("Archive error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/archive/:id", (req, res) => {
  res.json({ ok: false, error: "Entry not found" });
});

export default router;
