import { Router } from "express";
import { z } from "zod";
import { initiateHeist, getHeist, getHeistsByFid } from "../lib/heist-state.js";
import { isEnabled } from "../lib/feature-flags.js";

const router = Router();

const initiateSchema = z.object({
  challengerFid: z.number().int().min(0),
  defenderFid: z.number().int().min(0).nullable().default(null),
  defenderUsername: z.string().trim().max(50).default("Bot Opponent"),
  targetItemName: z.string().trim().min(1).max(80),
  targetItemEmojis: z.array(z.string().max(8)).max(2).default([]),
  targetItemTier: z.enum(["COMMON", "RARE", "LEGENDARY", "GENESIS"]).default("COMMON"),
  entryCraftz: z.number().int().min(10).max(500).default(50),
  challengerItemName: z.string().trim().min(1).max(80),
  challengerItemTier: z.enum(["COMMON", "RARE", "LEGENDARY", "GENESIS"]).default("COMMON"),
  challengerItemGeneration: z.number().int().min(0).max(50).default(1),
  paymentMethod: z.enum(["craftz", "x402"]).default("craftz"),
});

router.post("/heists/initiate", async (req, res) => {
  try {
    if (!(await isEnabled("heists"))) {
      return res.status(503).json({ ok: false, error: "Heist feature is currently disabled" });
    }

    const parsed = initiateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const result = await initiateHeist(parsed.data);
    if (!result.ok) {
      return res.status(400).json({ ok: false, error: result.error });
    }

    res.json({ ok: true, heist: result.heist, pointsAwarded: result.pointsAwarded });
  } catch (err) {
    console.error("Heist initiate error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/heists/:id", async (req, res) => {
  try {
    const heist = await getHeist(req.params.id);
    if (!heist) return res.status(404).json({ ok: false, error: "Heist not found" });
    res.json({ ok: true, heist });
  } catch (err) {
    console.error("Heist get error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/heists", async (req, res) => {
  try {
    const fid = parseInt(String(req.query["fid"] ?? "0"));
    const heists = await getHeistsByFid(fid);
    res.json({ ok: true, heists });
  } catch (err) {
    console.error("Heists list error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
