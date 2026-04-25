import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { kv } from "@/db/schema";

const memoryStore = new Map<string, string>();

async function readFromDatabase(key: string) {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const rows = await db
      .select({ value: kv.value })
      .from(kv)
      .where(eq(kv.key, key))
      .limit(1);

    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function writeToDatabase(key: string, value: string) {
  if (!process.env.DATABASE_URL) {
    return false;
  }

  try {
    await db
      .insert(kv)
      .values({ key, value })
      .onConflictDoUpdate({ target: kv.key, set: { value } });

    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(key: string): Promise<T | null> {
  const raw = (await readFromDatabase(key)) ?? memoryStore.get(key) ?? null;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson<T>(key: string, value: T): Promise<void> {
  const raw = JSON.stringify(value);
  const savedInDatabase = await writeToDatabase(key, raw);

  if (savedInDatabase) {
    memoryStore.delete(key);
    return;
  }

  memoryStore.set(key, raw);
}
