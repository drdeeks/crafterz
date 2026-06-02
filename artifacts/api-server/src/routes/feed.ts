import { Router } from "express";
import { getFeed } from "../lib/feed-state.js";

const router = Router();

router.get("/feed", async (req, res) => {
  try {
    const rawLimit = Number(req.query["limit"] ?? 30);
    const limit = Number.isFinite(rawLimit) ? Math.min(rawLimit, 100) : 30;
    const events = await getFeed(limit);
    res.json({ ok: true, events });
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
