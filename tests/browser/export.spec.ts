import { expect, test } from "@playwright/test";

const exportedSong = {
  track: {
    trackName: "Morning Drift",
    artistName: "SoundTrip",
    albumName: "Local collection",
    trackUri: "spotify:track:1234567890123456789012",
  },
};
const exportFile = {
  name: "Playlist1.json",
  mimeType: "application/json",
  buffer: Buffer.from(
    JSON.stringify({
      playlists: [
        {
          name: "Offline memories",
          items: [
            exportedSong,
            { episode: { episodeName: "Podcast" } },
            exportedSong,
            {
              track: {
                trackName: "Not on this device",
                artistName: "Another artist",
              },
            },
          ],
        },
        { name: "Empty memories", items: [] },
      ],
      user: { email: "private-export-field@example.invalid" },
    }),
  ),
};
function audio() {
  const rate = 16000,
    seconds = 20,
    data = Buffer.alloc(44 + rate * seconds * 2);
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
  for (let i = 0; i < rate * seconds; i++)
    data.writeInt16LE(
      Math.round(Math.sin((i * 220 * 2 * Math.PI) / rate) * 500),
      44 + i * 2,
    );
  return {
    name: "SoundTrip - Morning Drift.wav",
    mimeType: "audio/wav",
    buffer: data,
  };
}
test("official export preview, matching, duplicates, offline persistence and removal preserve local music", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  const spotifyRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https:\/\/(api|accounts)\.spotify\.com\//.test(r.url()))
      spotifyRequests.push(r.url());
  });
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  const choose = async (
    files: Parameters<import("@playwright/test").FileChooser["setFiles"]>[0],
  ) => {
    const picker = page.waitForEvent("filechooser");
    await button("Choose playlist JSON").click();
    await (await picker).setFiles(files);
  };
  await page.goto("/");
  await button("Make yourself at home").click();
  await page.getByRole("link", { name: "Playlists", exact: true }).click();
  await button("Import Spotify export").click();
  await expect(
    page.getByText("Bring your playlist memories.", { exact: true }),
  ).toBeVisible();
  await choose([exportFile, { ...exportFile, name: "Playlist2.json" }]);
  await expect(
    page.getByText(
      "2 playlists · 3 songs · 1 podcast or unreadable items skipped",
      { exact: true },
    ),
  ).toBeVisible();
  await button("Cancel import").click();
  await expect(button("Open imported playlist Offline memories")).toHaveCount(
    0,
  );
  await choose(exportFile);
  await page
    .getByRole("checkbox", { name: "Include Empty memories", exact: true })
    .click();
  await button("Import selected playlists (1)").click();
  await expect(
    page.getByText("3 songs · 0 confirmed files · 0 available offline", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(button("Create local playlist")).toBeDisabled();
  const musicPicker = page.waitForEvent("filechooser");
  await button("Import local music").click();
  await (await musicPicker).setFiles(audio());
  const confirm = "Confirm file: SoundTrip - Morning Drift.wav";
  await button(confirm).first().click();
  await button(confirm).first().click();
  await expect(
    page.getByText("3 songs · 2 confirmed files · 2 available offline", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "No confirmed local file. Import audio you own, or choose a file from your library.",
      { exact: true },
    ),
  ).toBeVisible();
  await button("Create local playlist").click();
  await expect(button("Open local playlist")).toBeVisible();
  await choose(exportFile);
  await expect(
    page.getByText("3 songs · Already imported", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Include Empty memories", exact: true }),
  ).toBeChecked();
  await button("Import selected playlists (1)").click();
  await button("Open imported playlist Offline memories").click();
  await expect(
    page.getByText("3 songs · 2 confirmed files · 2 available offline", {
      exact: true,
    }),
  ).toBeVisible();
  await choose({
    name: "Userdata.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"email":"must-not-import@example.invalid"}'),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "No playlist export found" }),
  ).toBeVisible();
  await expect(button("Open imported playlist Offline memories")).toHaveCount(
    1,
  );
  const snapshot = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("soundtrip", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return new Promise<unknown>((resolve, reject) => {
      const r = db.transaction("state").objectStore("state").get("library");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  });
  const serialized = JSON.stringify(snapshot);
  expect(serialized).not.toContain("private-export-field");
  expect(serialized).not.toContain("must-not-import");
  // A downloaded export survives long after the unrelated API metadata TTL.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("soundtrip", 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction("state", "readwrite"),
        store = t.objectStore("state"),
        read = store.get("library");
      read.onsuccess = () => {
        const state = read.result;
        state.playlistExports.forEach(
          (p: { importedAt: number }) =>
            (p.importedAt = Date.now() - 3 * 86400000),
        );
        store.put(state, "library");
      };
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBeTruthy();
  await context.setOffline(true);
  await page.reload();
  await button("Open imported playlist Offline memories").click();
  await expect(
    page.getByText("3 songs · 2 confirmed files · 2 available offline", {
      exact: true,
    }),
  ).toBeVisible();
  await button("Shuffle confirmed files").click();
  await expect(button("Pause")).toBeVisible();
  const position = () =>
    page
      .getByRole("slider", { name: "Playback position", exact: true })
      .inputValue()
      .then(Number);
  const first = await position();
  await expect.poll(position).toBeGreaterThan(first + 1);
  await button("Pause").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/export-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  // Simulate removal of the test blob, without changing the user's library.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const r = indexedDB.open("soundtrip", 1);
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction("files", "readwrite");
      t.objectStore("files").clear();
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  });
  await page.reload();
  await button("Open imported playlist Offline memories").click();
  await expect(
    page.getByText("3 songs · 2 confirmed files · 0 available offline", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(button("Shuffle confirmed files")).toBeDisabled();
  await expect(button("Play your local file").first()).toBeDisabled();
  await button("Remove export metadata").click();
  await button("Keep snapshot").click();
  await expect(button("Open imported playlist Offline memories")).toBeVisible();
  await button("Remove export metadata").click();
  await button("Remove imported snapshot").click();
  await expect(button("Open imported playlist Offline memories")).toHaveCount(
    0,
  );
  await page.getByRole("link", { name: "Playlists", exact: true }).click();
  await expect(
    page.getByText("Offline memories", { exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
  expect(spotifyRequests).toEqual([]);
  expect(errors).toEqual([]);
});
