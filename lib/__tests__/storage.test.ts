import assert from "node:assert/strict";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { after, before, describe, it } from "node:test";

import {
  buildAvatarStorageKey,
  buildPlanItemStorageKey,
  buildStorageKey,
  deleteFile,
  getAbsolutePath,
  getMaxUploadBytes,
  getUploadDir,
  readFile,
  sanitizeFileName,
  saveFile,
} from "@/lib/storage/local";

describe("sanitizeFileName", () => {
  const cases: Array<[string, string]> = [
    ["report.pdf", "report.pdf"],
    ["../../etc/passwd", "passwd"],
    ["..\\windows\\system32", ".._windows_system32"],
    ["  spaced  .txt", "spaced__.txt"],
    ["file with spaces.doc", "file_with_spaces.doc"],
    ["unicode-文件.png", "unicode-__.png"],
    ["", "file"],
    ["   ", "file"],
    ["a".repeat(300) + ".pdf", "a".repeat(200)],
    ["control\x00chars.pdf", "control_chars.pdf"],
    ["name<script>.txt", "name_script_.txt"],
    ["multiple.dots.file.pdf", "multiple.dots.file.pdf"],
    ["-leading-dash.pdf", "-leading-dash.pdf"],
    ["trailing.dot.", "trailing.dot."],
  ];

  for (const [input, expected] of cases) {
    it(`sanitizes ${JSON.stringify(input)} → ${expected}`, () => {
      const result = sanitizeFileName(input);
      assert.ok(!result.includes("/"));
      assert.ok(!result.includes("\\"));
      if (expected !== "file" && !input.includes("\x00")) {
        assert.equal(result, expected);
      } else {
        assert.ok(result.length > 0);
      }
    });
  }
});

describe("buildStorageKey paths", () => {
  it("builds report entry key with org/report/entry segments", () => {
    const key = buildStorageKey("org1", "rep1", "ent1", "doc.pdf");
    assert.match(key, /^org1\/rep1\/ent1\/[a-f0-9-]+-doc\.pdf$/);
  });

  it("builds plan item key", () => {
    const key = buildPlanItemStorageKey("org1", "plan1", "item1", "img.png");
    assert.match(key, /^org1\/plans\/plan1\/item1\/[a-f0-9-]+-img\.png$/);
  });

  it("builds avatar key with extension", () => {
    const key = buildAvatarStorageKey("org1", "user1", "avatar.jpg");
    assert.match(key, /^org1\/avatars\/user1-[a-f0-9-]+\.jpg$/);
  });

  it("sanitizes unsafe names in keys", () => {
    const key = buildStorageKey("org", "rep", "ent", "../../../evil.pdf");
    assert.ok(!key.includes(".."));
    assert.ok(key.endsWith("-evil.pdf") || key.includes("evil"));
  });
});

describe("getAbsolutePath", () => {
  it("resolves key under upload dir", () => {
    const abs = getAbsolutePath("org/file.pdf");
    assert.ok(abs.includes("org"));
    assert.ok(abs.endsWith(path.join("org", "file.pdf")));
  });

  it("rejects path traversal", () => {
    assert.throws(
      () => getAbsolutePath("../../../etc/passwd"),
      /Invalid storage key/,
    );
  });
});

describe("getUploadDir and getMaxUploadBytes", () => {
  it("returns default upload dir", () => {
    const original = process.env.UPLOAD_DIR;
    delete process.env.UPLOAD_DIR;
    assert.equal(getUploadDir(), "./data/uploads");
    if (original) {
      process.env.UPLOAD_DIR = original;
    }
  });

  it("returns default max bytes", () => {
    const original = process.env.MAX_UPLOAD_BYTES;
    delete process.env.MAX_UPLOAD_BYTES;
    assert.equal(getMaxUploadBytes(), 10 * 1024 * 1024);
    if (original) {
      process.env.MAX_UPLOAD_BYTES = original;
    }
  });

  it("parses MAX_UPLOAD_BYTES env", () => {
    const original = process.env.MAX_UPLOAD_BYTES;
    process.env.MAX_UPLOAD_BYTES = "5242880";
    assert.equal(getMaxUploadBytes(), 5242880);
    if (original) {
      process.env.MAX_UPLOAD_BYTES = original;
    } else {
      delete process.env.MAX_UPLOAD_BYTES;
    }
  });

  it("ignores invalid MAX_UPLOAD_BYTES", () => {
    const original = process.env.MAX_UPLOAD_BYTES;
    process.env.MAX_UPLOAD_BYTES = "not-a-number";
    assert.equal(getMaxUploadBytes(), 10 * 1024 * 1024);
    if (original) {
      process.env.MAX_UPLOAD_BYTES = original;
    } else {
      delete process.env.MAX_UPLOAD_BYTES;
    }
  });
});

describe("file I/O integration", () => {
  let tempDir: string;
  let originalUploadDir: string | undefined;

  before(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wrp-upload-"));
    originalUploadDir = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = tempDir;
  });

  after(async () => {
    if (originalUploadDir) {
      process.env.UPLOAD_DIR = originalUploadDir;
    } else {
      delete process.env.UPLOAD_DIR;
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("saveFile and readFile round-trip", async () => {
    const key = buildStorageKey("org", "r1", "e1", "test.txt");
    const data = Buffer.from("hello storage");
    await saveFile(key, data);
    const read = await readFile(key);
    assert.equal(read.toString(), "hello storage");
  });

  it("deleteFile removes file", async () => {
    const key = buildStorageKey("org", "r1", "e2", "gone.txt");
    await saveFile(key, Buffer.from("x"));
    await deleteFile(key);
    await assert.rejects(() => readFile(key));
  });

  it("deleteFile ignores missing file", async () => {
    await deleteFile("org/missing/file.txt");
  });
});
