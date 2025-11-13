import fs from "fs";
import path from "path";

import type { DatabaseSchema } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "self-study.json");

function ensureDataFile(): DatabaseSchema {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const emptyState: DatabaseSchema = {
      users: [],
      studyPlans: [],
      studyDays: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(emptyState, null, 2), "utf8");
    return emptyState;
  }

  const raw = fs.readFileSync(dbPath, "utf8");
  try {
    const parsed = JSON.parse(raw) as DatabaseSchema;
    parsed.users ??= [];
    parsed.studyPlans ??= [];
    parsed.studyDays ??= [];
    return parsed;
  } catch {
    const fallback: DatabaseSchema = {
      users: [],
      studyPlans: [],
      studyDays: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

let cache: DatabaseSchema | null = null;

function load(): DatabaseSchema {
  if (!cache) {
    cache = ensureDataFile();
  }
  return cache;
}

function persist(state: DatabaseSchema) {
  cache = state;
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), "utf8");
}

export function readDb(): DatabaseSchema {
  return load();
}

export function writeDb(mutator: (state: DatabaseSchema) => void): DatabaseSchema {
  const state = load();
  const nextState: DatabaseSchema = {
    users: [...state.users],
    studyPlans: [...state.studyPlans],
    studyDays: [...state.studyDays]
  };

  mutator(nextState);
  persist(nextState);
  return nextState;
}
