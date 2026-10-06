import { test, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
async function signIn(page: Page, email: string, password: string) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Make yourself at home", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Make yourself at home", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Open account", exact: true }).click();
  await page.getByRole("textbox", { name: "Account email" }).fill(email);
  await page.getByRole("textbox", { name: "Account password" }).fill(password);
  await page
    .getByRole("button", { name: "Sign in to SoundTrip", exact: true })
    .click();
  await expect(
    page.getByText(email, { exact: true }).filter({ visible: true }),
  ).toBeVisible();
}
test("two devices recover offline playlist edits and honor account data deletion", async ({
  browser,
}) => {
  test.skip(
    !process.env.NEON_AUTH_BASE_URL || !process.env.DATABASE_URL,
    "Live development account services are not configured.",
  );
  execFileSync(
    process.execPath,
    ["--env-file=.env.local", "scripts/auth-smoke.mjs"],
    { stdio: "inherit" },
  );
  const user = JSON.parse(readFileSync(".local/auth-test.json", "utf8"));
  const first = await browser.newContext({
    viewport: { width: 1200, height: 900 },
  });
  const second = await browser.newContext({
    viewport: { width: 1200, height: 900 },
  });
  const a = await first.newPage(),
    b = await second.newPage();
  try {
    await signIn(a, user.email, user.password);
    await signIn(b, user.email, user.password);
    await first.setOffline(true);
    await a.getByRole("link", { name: "Playlists", exact: true }).click();
    await a.getByRole("button", { name: "New playlist", exact: true }).click();
    await a
      .getByRole("textbox", { name: "Playlist name" })
      .fill("Queued while offline");
    await a.getByRole("button", { name: "Save playlist", exact: true }).click();
    await a.getByRole("button", { name: "Open account", exact: true }).click();
    await expect(
      a
        .getByText(/metadata edits queued on this device/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await first.setOffline(false);
    await a
      .getByRole("button", { name: "Sync metadata · online", exact: true })
      .click();
    await expect(
      a
        .getByText("Metadata is up to date. Audio stays on each device.", {
          exact: true,
        })
        .filter({ visible: true }),
    ).toBeVisible();
    await b
      .getByRole("button", { name: "Sync metadata · online", exact: true })
      .click();
    await expect(
      b
        .getByText("Queued while offline", { exact: true })
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
    await b.reload();
    await expect(
      b.getByText(user.email, { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await a
      .getByRole("button", { name: "Delete synced account data", exact: true })
      .click();
    await a
      .getByRole("button", { name: "Delete my synced data", exact: true })
      .click();
    await expect(
      a.getByRole("button", { name: "Sign in to SoundTrip", exact: true }),
    ).toBeVisible();
    await b
      .getByRole("button", { name: "Sync metadata · online", exact: true })
      .click();
    await expect(
      b.getByRole("button", { name: "Sign in to SoundTrip", exact: true }),
    ).toBeVisible();
    await expect(
      b.getByText(/Synced data was deleted/).filter({ visible: true }),
    ).toBeVisible();
  } finally {
    await first.close();
    await second.close();
  }
});
