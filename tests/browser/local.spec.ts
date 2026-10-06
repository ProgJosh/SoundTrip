import { expect, test } from "@playwright/test";
function wav(frequency: number) {
  const rate = 16000,
    seconds = 20,
    data = Buffer.alloc(rate * seconds * 2 + 44);
  data.write("RIFF", 0);
  data.writeUInt32LE(data.length - 8, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24);
  data.writeUInt32LE(rate * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(data.length - 44, 40);
  for (let n = 0; n < rate * seconds; n++)
    data.writeInt16LE(
      Math.round(Math.sin((n * frequency * 2 * Math.PI) / rate) * 500),
      44 + n * 2,
    );
  return data;
}
test("local import, playlists, lyrics, shuffle and playback survive network disconnection", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Make yourself at home", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Make yourself at home", exact: true }),
  ).not.toBeVisible();
  await page.screenshot({
    path: "test-results/library-empty.png",
    fullPage: true,
  });
  const fileChooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Import your music", exact: true })
    .click();
  await (
    await fileChooser
  ).setFiles([
    {
      name: "SoundTrip - Morning Drift.wav",
      mimeType: "audio/wav",
      buffer: wav(220),
    },
    {
      name: "SoundTrip - Afterglow.wav",
      mimeType: "audio/wav",
      buffer: wav(330),
    },
  ]);
  await expect(
    page.getByRole("button", {
      name: "Play Morning Drift by SoundTrip",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Details for Morning Drift", exact: true })
    .click();
  await page.getByRole("button", { name: "Drift away", exact: true }).click();
  await page.getByRole("button", { name: "Save details", exact: true }).click();
  await page.getByRole("link", { name: "Playlists", exact: true }).click();
  await page.getByRole("button", { name: "New playlist", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Playlist name" })
    .fill("The long way home");
  await page
    .getByRole("button", { name: "Save playlist", exact: true })
    .click();
  await page.getByRole("button", { name: "Add tracks", exact: true }).click();
  await page
    .getByRole("button", { name: "Morning Drift", exact: true })
    .click();
  await page.getByRole("button", { name: "Afterglow", exact: true }).click();
  await page
    .getByRole("button", { name: "Move track 2 up", exact: true })
    .click();
  await page.getByRole("button", { name: "Rename", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Playlist name" })
    .fill("Offline escapes");
  await page
    .getByRole("button", { name: "Save playlist", exact: true })
    .click();
  await page.getByRole("button", { name: "Shuffle", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Open now playing", exact: true })
    .click();
  await page.getByRole("button", { name: "Lyrics", exact: true }).click();
  const lrcChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Import .lrc", exact: true }).click();
  await (
    await lrcChooser
  ).setFiles({
    name: "song.lrc",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "[00:00.00]Morning light\n[00:03.00]Take the long way\n[00:10.00]Home again",
    ),
  });
  await expect(
    page.getByRole("button", {
      name: "Seek to lyric Morning light",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Seek to lyric Take the long way",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Edit lyric timing", exact: true })
    .click();
  await page.getByRole("button", { name: "All +0.5s", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "LRC timing editor" }),
  ).toHaveValue(/\[00:03.50\]/);
  await page.getByRole("button", { name: "Save lyrics", exact: true }).click();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBeTruthy();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("Offline escapes", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  const position = () =>
    page
      .getByRole("slider", { name: "Playback position", exact: true })
      .inputValue()
      .then(Number);
  const first = await position();
  await expect.poll(position, { timeout: 10000 }).toBeGreaterThan(first + 1);
  await page.screenshot({
    path: "test-results/lyrics-offline.png",
    fullPage: true,
  });
  await context.setOffline(false);
  await page.getByRole("link", { name: "Your library", exact: true }).click();
  await page
    .getByRole("button", { name: "Shuffle Drift away", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/library-playing.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/library-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Simulate browser file eviction; playlists and lyric metadata must survive.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("soundtrip", 1);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("files", "readwrite");
          transaction.objectStore("files").clear();
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      }),
  );
  await page.reload();
  await expect(
    page.getByText("Offline escapes", { exact: true }).first(),
  ).toBeVisible();
  const relinkChooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Relink Morning Drift", exact: true })
    .click();
  await (
    await relinkChooser
  ).setFiles({
    name: "SoundTrip - Morning Drift.wav",
    mimeType: "audio/wav",
    buffer: wav(220),
  });
  await expect(
    page.getByRole("button", {
      name: "Play Morning Drift by SoundTrip",
      exact: true,
    }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});
