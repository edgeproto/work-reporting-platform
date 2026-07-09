import assert from "node:assert/strict";
import { describe, it } from "node:test";

import sharp from "sharp";

import {
  AVATAR_MIME_TYPE,
  AVATAR_SIZE,
  compressAvatar,
} from "@/lib/images/compress-avatar";

async function createTestImage(
  width: number,
  height: number,
  format: "jpeg" | "png" = "jpeg",
): Promise<Buffer> {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 80, b: 200 },
    },
  });
  return format === "png" ? image.png().toBuffer() : image.jpeg().toBuffer();
}

describe("compressAvatar", () => {
  it("exports webp mime type constant", () => {
    assert.equal(AVATAR_MIME_TYPE, "image/webp");
  });

  for (const [label, width, height] of [
    ["square", 800, 800],
    ["landscape", 1200, 600],
    ["portrait", 400, 900],
    ["small", 64, 64],
  ] as const) {
    it(`compresses ${label} image to webp under size cap`, async () => {
      const input = await createTestImage(width, height);
      const output = await compressAvatar(input);

      assert.ok(output.length > 0);
      if (width > AVATAR_SIZE || height > AVATAR_SIZE) {
        assert.ok(output.length < input.length);
      }

      const meta = await sharp(output).metadata();
      assert.equal(meta.format, "webp");
      assert.equal(meta.width, AVATAR_SIZE);
      assert.equal(meta.height, AVATAR_SIZE);
    });
  }

  it("compresses png input", async () => {
    const input = await createTestImage(500, 500, "png");
    const output = await compressAvatar(input);
    const meta = await sharp(output).metadata();
    assert.equal(meta.format, "webp");
  });
});
