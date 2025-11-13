import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { JWT_SECRET, TOKEN_TTL_HOURS } from "./config";
import { readDb, writeDb } from "./db";
import type { UserRecord } from "./types";

export type User = UserRecord;

export function assertEmail(email: string) {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error("Invalid email address");
  }
  return trimmed;
}

export async function createUser(email: string, password: string): Promise<User> {
  const normalizedEmail = assertEmail(email);
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const existing = findUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error("Account already exists");
  }

  const now = new Date().toISOString();
  const password_hash = await bcrypt.hash(password, 10);
  const user: User = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password_hash,
    created_at: now,
    updated_at: now
  };

  writeDb((state) => {
    state.users.push(user);
  });

  return user;
}

export function findUserByEmail(email: string): User | undefined {
  const db = readDb();
  return db.users.find((user) => user.email === assertEmail(email));
}

export function findUserById(id: string): User | undefined {
  const db = readDb();
  return db.users.find((user) => user.id === id);
}

export async function verifyUser(email: string, password: string): Promise<User> {
  const user = findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  return user;
}

export function createSessionToken(user: User) {
  const payload = { sub: user.id, email: user.email };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: `${TOKEN_TTL_HOURS}h`
  });
}

export function verifySessionToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
}
