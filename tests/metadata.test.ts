import { test } from "node:test";
import assert from "node:assert/strict";
import { readMetadata, localMedia } from "../src/core/metadata";

test("embedded media returns with a transferred file without losing edited lyrics", () => {
  const frame = (id: string, value: Buffer) => {
    const header = Buffer.alloc(10);
    header.write(id);
    header.writeUInt32BE(value.length, 4);
    return Buffer.concat([header, value]);
  };
  const artwork = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const body = Buffer.concat([
    frame(
      "TIT2",
      Buffer.concat([Buffer.from([3]), Buffer.from("Morning Drift")]),
    ),
    frame(
      "USLT",
      Buffer.concat([Buffer.from([3]), Buffer.from("eng\0Embedded words")]),
    ),
    frame(
      "APIC",
      Buffer.concat([
        Buffer.from([0]),
        Buffer.from("image/png\0"),
        Buffer.from([3, 0]),
        artwork,
      ]),
    ),
  ]);
  const header = Buffer.from([
    73,
    68,
    51,
    3,
    0,
    0,
    0,
    0,
    body.length >> 7,
    body.length & 127,
  ]);
  const metadata = readMetadata(Buffer.concat([header, body]));
  assert.equal(metadata.title, "Morning Drift");
  assert.equal(metadata.lyrics, "Embedded words");
  const restored = localMedia(metadata);
  assert.equal(
    restored.artwork,
    `data:image/png;base64,${artwork.toString("base64")}`,
  );
  assert.equal(restored.lyrics, "Embedded words");
  assert.equal(
    localMedia(metadata, { lyrics: "[00:03.50]My edited timing" }).lyrics,
    "[00:03.50]My edited timing",
  );
  assert.equal(localMedia(metadata, { lyrics: "" }).lyrics, "");
});
