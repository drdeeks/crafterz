import { Router } from "express";
import { z } from "zod";
import {
  AGENT_DEFINITIONS,
  getActiveRentals,
  rentAgent,
  expireStaleRentals,
} from "../lib/agent-state.js";
import { isEnabled } from "../lib/feature-flags.js";

const router = Router();

router.get("/agents", async (req, res) => {
  try {
    if (!(await isEnabled("brainRental"))) {
      return res.status(503).json({ ok: false, error: "Brain Rental is currently disabled" });
    }

    const fid = parseInt(String(req.query["fid"] ?? "0"));
    await expireStaleRentals();

    const activeRentals = fid ? await getActiveRentals(fid) : [];
    const activeAgentIds = new Set(activeRentals.map((r) => r.agentId));

    const agents = Object.values(AGENT_DEFINITIONS).map((agent) => ({
      ...agent,
      isRentedByMe: activeAgentIds.has(agent.id),
      myRental: activeRentals.find((r) => r.agentId === agent.id) ?? null,
    }));

    res.json({ ok: true, agents });
  } catch (err) {
    console.error("Agents list error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

const rentSchema = z.object({
  fid: z.number().int().min(0),
  paymentMethod: z.enum(["craftz", "x402"]).default("craftz"),
});

router.post("/agents/:agentId/rent", async (req, res) => {
  try {
    if (!(await isEnabled("brainRental"))) {
      return res.status(503).json({ ok: false, error: "Brain Rental is currently disabled" });
    }

    const { agentId } = req.params;
    const parsed = rentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid payload", issues: parsed.error.flatten() });
    }

    const result = await rentAgent(parsed.data.fid, agentId, parsed.data.paymentMethod);
    if (!result.ok) {
      return res.status(409).json({ ok: false, error: result.error });
    }

    const agent = AGENT_DEFINITIONS[agentId];
    res.json({ ok: true, rental: result.rental, agent, buffApplied: agent.buffDescription });
  } catch (err) {
    console.error("Agent rent error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

router.get("/agents/active", async (req, res) => {
  try {
    const fid = parseInt(String(req.query["fid"] ?? "0"));
    if (!fid) return res.status(400).json({ ok: false, error: "fid required" });

    await expireStaleRentals();
    const active = await getActiveRentals(fid);
    res.json({ ok: true, rentals: active });
  } catch (err) {
    console.error("Active rentals error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
