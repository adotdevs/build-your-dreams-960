import { mkdir, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { getActor, safeEqual, signValue } from "./auth";

function safePath(bucket: string, filePath: string) {
  if (!bucket || !filePath || bucket.includes("..") || filePath.includes("..")) {
    throw new Error("Invalid file path");
  }
  const root = path.join(process.cwd(), "uploads", bucket);
  const full = path.resolve(root, filePath);
  if (!full.startsWith(path.resolve(root))) throw new Error("Invalid file path");
  return full;
}

export async function saveUpload(bucket: string, filePath: string, bytes: Buffer, upsert: boolean) {
  const actor = await getActor();
  if (!actor) return { data: null, error: { message: "Not authenticated" } };
  const full = safePath(bucket, filePath);
  try {
    await stat(full);
    if (!upsert) return { data: null, error: { message: "The resource already exists" } };
  } catch {
    // New file.
  }
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return { data: { path: filePath }, error: null };
}

export async function signedUrl(bucket: string, filePath: string, expiresIn: number) {
  const actor = await getActor();
  if (!actor) return { data: null, error: { message: "Not authenticated" } };
  const full = safePath(bucket, filePath);
  try {
    await stat(full);
  } catch {
    return { data: null, error: { message: "Object not found" } };
  }
  const exp = Date.now() + Math.max(60, expiresIn) * 1000;
  const sig = signValue(`${bucket}\n${filePath}\n${exp}`);
  const params = new URLSearchParams({ bucket, path: filePath, exp: String(exp), sig });
  return { data: { signedUrl: `/api/storage/file?${params.toString()}` }, error: null };
}

export async function removeFiles(bucket: string, paths: string[]) {
  const actor = await getActor();
  if (!actor) return { data: null, error: { message: "Not authenticated" } };
  for (const filePath of paths) {
    try {
      await rm(safePath(bucket, filePath), { force: true });
    } catch {
      // Missing files are ignored, matching storage remove.
    }
  }
  return { data: paths, error: null };
}

export async function readSignedFile(bucket: string, filePath: string, exp: string, sig: string) {
  if (!exp || !sig || Number(exp) < Date.now()) return null;
  const expected = signValue(`${bucket}\n${filePath}\n${exp}`);
  if (!safeEqual(expected, sig)) return null;
  const full = safePath(bucket, filePath);
  await stat(full);
  return { full };
}
