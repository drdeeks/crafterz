import { Router } from "express";
import { z } from "zod";
import { getCaptions, reactToCaption, reportCaption } from "../lib/caption-state.js";
import { isEnabled } from "../lib/feature-flags.js";

const router = Router();

router.get("/captions", async (req, res) => {
  try {
    if (!(await isEnabled("comedyFeed"))) {
      return res.json({ ok: true, captions: [] });
    }

    const rawLimit = Number(req.query["limit"] ?? 20);
    const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 50) : 20;
    const captions = await getCaptions(limit);
    res.json({ ok: true, captions });
  } catch (err) {
    console.error("Captions list error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

const submitCaptionSchema = z.object({
  captionText: z.string().min(5).max(200),
  username: z.string().min(1).max(32).optional(),
});

router.post("/captions", async (req, res) => {
  try {
    if (!(await isEnabled("comedyFeed"))) {
      return res.json({ ok: false, error: "Comedy feed disabled" });
    }
    const parsed = submitCaptionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid caption text (5–200 chars)" });
    }
    const { captionText, username = "anonymous" } = parsed.data;
    const { generateCaption } = await import("../lib/caption-state.js");
    const caption = await generateCaption({
      itemName: "Field Dispatch",
      discovererUsername: username,
      tier: "COMMON",
      ingredients: [],
      isMegaMind: false,
      customText: captionText,
    });
    res.json({ ok: true, caption });
  } catch (err) {
    console.error("Caption submit error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

const idSchema = z.object({ id: z.string().min(1).max(80) });

router.post("/captions/:id/react", async (req, res) => {
  try {
    const parsed = idSchema.safeParse({ id: req.params.id });
    if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid caption id" });

    const ok = await reactToCaption(parsed.data.id);
    res.json({ ok });
  } catch (err) {
    console.error("Caption react error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.post("/captions/:id/report", async (req, res) => {
  try {
    const parsed = idSchema.safeParse({ id: req.params.id });
    if (!parsed.success) return res.status(400).json({ ok: false, error: "Invalid caption id" });

    const ok = await reportCaption(parsed.data.id);
    res.json({ ok });
  } catch (err) {
    console.error("Caption report error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
