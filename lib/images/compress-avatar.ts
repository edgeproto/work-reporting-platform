import sharp from "sharp";

export const AVATAR_SIZE = 256;
export const AVATAR_MIME_TYPE = "image/webp";
export const AVATAR_FILE_NAME = "avatar.webp";

/** Resize, auto-orient, and compress an uploaded image for avatar storage. */
export async function compressAvatar(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(AVATAR_SIZE, AVATAR_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 80 })
    .toBuffer();
}
