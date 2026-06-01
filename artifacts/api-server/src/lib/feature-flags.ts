import { readJson, writeJson } from "./kv-store.js";

const FLAGS_KEY = "craftz:feature-flags:v1";

export type FeatureFlags = {
  heists: boolean;
  brainRental: boolean;
  weatherSystem: boolean;
  comedyFeed: boolean;
};

const DEFAULTS: FeatureFlags = {
  heists: true,
  brainRental: true,
  weatherSystem: true,
  comedyFeed: true,
};

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const stored = await readJson<Partial<FeatureFlags>>(FLAGS_KEY);
  return { ...DEFAULTS, ...(stored ?? {}) };
}

export async function setFeatureFlag(key: keyof FeatureFlags, value: boolean): Promise<FeatureFlags> {
  const current = await getFeatureFlags();
  const updated = { ...current, [key]: value };
  await writeJson(FLAGS_KEY, updated);
  return updated;
}

export async function isEnabled(key: keyof FeatureFlags): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[key] ?? DEFAULTS[key];
}
