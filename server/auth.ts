import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "./db";
import { InsertUser } from "../drizzle/schema";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(email: string, password: string, name?: string) {
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const newUser: InsertUser = {
    email,
    password: hashedPassword,
    name: name || null,
    role: "user",
  };

  await createUser(newUser);
  return { email, name };
}

export async function loginUser(email: string, password: string) {
  // Find user
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  return user;
}
