import { mkdir, rm, stat, writeFile } from "fs/promises";
import path from "path";
import { del, get, head, put } from "@vercel/blob";
import { getActor, safeEqual, signValue } from "./auth";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

function useBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobPath(bucket: string, filePath: string) {
  if (!bucket || !filePath || bucket.includes("..") || filePath.includes("..") || bucket.includes("/") || filePath.startsWith("/")) {
    throw new Error("Invalid file path");
  }
  return `${bucket}/${filePath.replace(/\\/g, "/")}`;
}

function localPath(bucket: string, filePath: string) {
  if (!bucket || !filePath || bucket.includes("..") || filePath.includes("..")) {
    throw new Error("Invalid file path");
  }
  const root = path.join(process.cwd(), "uploads", bucket);
  const full = path.resolve(root, filePath);
  if (!full.startsWith(path.resolve(root))) throw new Error("Invalid file path");
  return full;
}

function contentTypeFor(filePath: string) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function blobExists(pathname: string) {
  try {
    await head(pathname);
    return true;
  } catch {
    return false;
  }
}

export async function saveUpload(bucket: string, filePath: string, bytes: Buffer, upsert: boolean) {
  const actor = await getActor();
  if (!actor) return { data: null, error: { message: "Not authenticated" } };

  if (useBlob()) {
    const pathname = blobPath(bucket, filePath);
    if (!upsert && (await blobExists(pathname))) {
      return { data: null, error: { message: "The resource already exists" } };
    }
    await put(pathname, bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: upsert,
      contentType: contentTypeFor(filePath),
    });
    return { data: { path: filePath }, error: null };
  }

  const full = localPath(bucket, filePath);
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

  if (useBlob()) {
    if (!(await blobExists(blobPath(bucket, filePath)))) {
      return { data: null, error: { message: "Object not found" } };
    }
  } else {
    try {
      await stat(localPath(bucket, filePath));
    } catch {
      return { data: null, error: { message: "Object not found" } };
    }
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
      if (useBlob()) await del(blobPath(bucket, filePath));
      else await rm(localPath(bucket, filePath), { force: true });
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

  if (useBlob()) {
    const result = await get(blobPath(bucket, filePath), { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return {
      stream: result.stream,
      contentType: result.blob.contentType || contentTypeFor(filePath),
    };
  }

  const full = localPath(bucket, filePath);
  await stat(full);
  return { full, contentType: contentTypeFor(filePath) };
}
