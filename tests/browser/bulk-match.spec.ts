import { expect, test } from "@playwright/test";

const song = (trackName: string, artistName: string) => ({
  track: { trackName, artistName },
});
const exportFile = {
  name: "Playlist1.json",
  mimeType: "application/json",
  buffer: Buffer.from(
    JSON.stringify({
      playlists: [
        {
          name: "Bulk memories",
          items: [
            song("Morning Drift", "SoundTrip"),
            song("Morning Drift - Remastered 2020", "SoundTrip"),
            song("Not on this device", "Another artist"),
          ],
        },
      ],
    }),
  ),
};
function audio() {
  const rate = 8000,
    seconds = 2,
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
  return {
    name: "SoundTrip - Morning Drift.wav",
    mimeType: "audio/wav",
    buffer: data,
  };
}
test("bulk matching proposes files for the whole playlist and links only what is confirmed", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const button = (name: string) =>
    page.getByRole("button", { name, exact: true });
  const checkbox = (name: string) =>
    page.getByRole("checkbox", { name, exact: true });
  await page.goto("/");
  await button("Make yourself at home").click();
  await page.getByRole("link", { name: "Playlists", exact: true }).click();
  await button("Import Spotify export").click();
  const picker = page.waitForEvent("filechooser");
  await button("Choose playlist JSON").click();
  await (await picker).setFiles(exportFile);
  await button("Import selected playlists (1)").click();
  await expect(button("Find matching files for all songs")).toBeDisabled();
  const musicPicker = page.waitForEvent("filechooser");
  await button("Import local music").click();
  await (await musicPicker).setFiles(audio());
  await button("Find matching files for all songs").click();
  const exact = checkbox(
    "Match Morning Drift to SoundTrip - Morning Drift.wav",
  );
  const close = checkbox(
    "Match Morning Drift - Remastered 2020 to SoundTrip - Morning Drift.wav",
  );
  await expect(exact).toBeChecked();
  await expect(close).not.toBeChecked();
  await expect(
    checkbox("Match Not on this device to SoundTrip - Morning Drift.wav"),
  ).toHaveCount(0);
  await button("Select all, including close matches").click();
  await expect(close).toBeChecked();
  await exact.click();
  await button("Confirm selected matches (1)").click();
  await expect(
    page.getByText("Confirmed 1 file. 2 songs still need a local file.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("3 songs · 1 confirmed files · 1 available offline", {
      exact: true,
    }),
  ).toBeVisible();
  await button("Show songs without a file (2)").click();
  await expect(
    page.getByText("Not on this device", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Morning Drift - Remastered 2020", { exact: true }),
  ).toHaveCount(0);
  // The exact match was left unchecked, so a second pass proposes it again.
  await button("Find matching files for all songs").click();
  await expect(exact).toBeChecked();
  await button("Confirm selected matches (1)").click();
  await expect(
    page.getByText("Confirmed 1 file. 1 song still needs a local file.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
