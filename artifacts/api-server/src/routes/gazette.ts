import { Router } from "express";
import { getRecentActivity } from "../lib/game-state.js";
import { getRecentCaptions } from "../lib/caption-state.js";

const router = Router();

const HEADLINES = [
  "Local Alchemist Combines Two Completely Unrelated Things, Somehow Succeeds",
  "Weather Patterns Baffle Observers; Frogs Reportedly Unfazed",
  "MegaMind Status Achieved; Discoverer Claims It Was Intentional",
  "Annual Report: 73% Of Crafting Explosions Were 'Mostly Planned'",
  "Craftz Economy Shows Signs Of Definitely Being Fine",
  "Breaking: Something Has Been Combined With Something Else",
  "Scientists Baffled By Third Consecutive Meaningful Discovery This Week",
  "New Guild Formed; Members Describe Charter As 'Legally Binding And Extremely Serious'",
];

const WEATHER_DISPATCHES = [
  "Current atmospheric conditions: Unusual. This is considered normal.",
  "The celestial weather engine reports a 40% chance of cosmic significance. Bring an umbrella and a sense of dread.",
  "No scheduled weather events at this time. Residents are advised to remain vigilant.",
  "Sun Flare activity detected. Fire-adjacent elements are having what sources describe as 'a moment'.",
  "Frog Rain probability elevated. Frog-type elements standing by.",
];

const RUMOR_DISPATCHES = [
  "Unverified: A player has allegedly discovered a recipe involving a frog and a concept. Officials neither confirm nor deny.",
  "Sources close to the Observatory suggest a guild meeting is 'imminent.' The same sources provided no further detail and then vanished.",
  "A senior agent was observed whispering to a potato for approximately 40 minutes. The potato has not commented.",
  "Three agents reportedly formed a coalition based on their shared interest in 'not exploding.' Membership is reportedly growing.",
];

const EMPLOYMENT_NOTICES = [
  "WANTED: One reliable alchemist. Must be comfortable with occasional explosions. Craftz paid weekly.",
  "AVAILABLE: AI Brain agent with 3 successful experiments and only 2 documented chaos events. Inquire within.",
  "SEEKING: Research partner for long-term potato-adjacent investigation. No prior experience necessary.",
  "POSITION FILLED: The role of Most Chaotic Agent has been taken. Applications now open for 'Second Most Chaotic'.",
];

function pickDeterministic<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

router.get("/gazette/current", async (req, res) => {
  try {
    const [activity, captions] = await Promise.all([
      getRecentActivity(10),
      getRecentCaptions(5),
    ]);

    const now = new Date();
    const daySeed = now.getFullYear() * 1000 + now.getMonth() * 31 + now.getDate();

    const discoveries = activity.filter((e) => e.type === "discovery" || e.type === "megamind");
    const heists = activity.filter((e) => e.type === "heist");

    const discoveryItems = discoveries.length > 0
      ? discoveries.slice(0, 3).map((e) => {
          const name = (e as unknown as { itemName?: string }).itemName ?? "a mysterious item";
          const user = e.username ?? "an unnamed alchemist";
          return `${user} has reportedly combined two unrelated substances to produce "${name}". Authorities are investigating.`;
        })
      : [
          "No significant discoveries have been recorded. Experts speculate that everyone is 'taking a break' or 'asleep'.",
          "The Crafting Registry remains suspiciously quiet today. Rumours of a mass vacation are unconfirmed.",
        ];

    const heistItems = heists.length > 0
      ? heists.slice(0, 2).map((e) => {
          const user = e.username ?? "a mysterious challenger";
          return `${user} has initiated what appears to be a strategic repositioning of someone else's MegaMind badge. Legal teams are on standby.`;
        })
      : ["No heists recorded today. The MegaMind community is reportedly 'behaving'. This is considered suspicious."];

    const captionItems = captions.map((c) => c.text ?? "Our correspondent filed an empty report. Their editor is not surprised.");

    const edition = {
      date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      headline: pickDeterministic(HEADLINES, daySeed),
      sections: [
        { title: "Discoveries", icon: "🔬", items: discoveryItems },
        { title: "Heist Report", icon: "⚔️", items: heistItems },
        { title: "Weather Intelligence", icon: "🌦", items: [pickDeterministic(WEATHER_DISPATCHES, daySeed)] },
        {
          title: "Field Dispatches",
          icon: "📻",
          items: captionItems.length > 0
            ? captionItems
            : ["Our comedic correspondents are currently out of office. A potted plant is covering for them."],
        },
        {
          title: "Employment Board",
          icon: "📋",
          items: [pickDeterministic(EMPLOYMENT_NOTICES, daySeed), pickDeterministic(EMPLOYMENT_NOTICES, daySeed + 1)],
        },
        {
          title: "Rumors",
          icon: "🗣",
          items: [pickDeterministic(RUMOR_DISPATCHES, daySeed), pickDeterministic(RUMOR_DISPATCHES, daySeed + 1)],
        },
      ],
    };

    res.json({ ok: true, edition });
  } catch (err) {
    console.error("Gazette error:", err);
    res.json({
      ok: true,
      edition: {
        date: new Date().toLocaleDateString(),
        headline: "The Gazette printing press is under maintenance. Normal absurdity resumes tomorrow.",
        sections: [],
      },
    });
  }
});

router.get("/gazette/archive", (req, res) => {
  res.json({ ok: true, editions: [] });
});

export default router;
