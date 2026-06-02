import { Router } from "express";

const router = Router();

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile?: { bio?: { text?: string } };
  follower_count: number;
  following_count: number;
  custody_address: string;
  verifications: string[];
}

router.get("/neynar/user", async (req, res) => {
  const rawFid = req.query["fid"];
  const fid = parseInt(String(rawFid ?? ""), 10);

  if (!rawFid || isNaN(fid) || fid <= 0) {
    return res.status(400).json({ ok: false, error: "Valid fid query parameter required" });
  }

  const apiKey = process.env["NEYNAR_API_KEY"];
  if (!apiKey) {
    return res.status(503).json({ ok: false, error: "Neynar not configured — set NEYNAR_API_KEY" });
  }

  try {
    const resp = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: { "x-api-key": apiKey, "accept": "application/json" },
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("Neynar error:", resp.status, errText.slice(0, 200));
      return res.status(resp.status).json({ ok: false, error: `Neynar returned ${resp.status}` });
    }

    const data = await resp.json() as { users?: NeynarUser[] };
    const user = data.users?.[0];

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found on Farcaster" });
    }

    res.json({
      ok: true,
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text ?? null,
      followerCount: user.follower_count,
      followingCount: user.following_count,
      custodyAddress: user.custody_address,
      verifications: user.verifications ?? [],
    });
  } catch (err) {
    console.error("Neynar proxy error:", err);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
});

export default router;
