/**
 * Finalidade: hashing e verificação de senha (argon2id).
 * Relações: usado no cadastro/login e no reset de senha.
 */
import argon2 from "argon2";

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
