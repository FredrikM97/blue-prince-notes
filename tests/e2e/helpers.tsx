import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const smokeImagePath = new URL("./fixtures/smoke-image.png", import.meta.url).pathname;

export function enableWelcomeBypass(page: Page) {
  return page.addInitScript(() => {
    localStorage.setItem("bp-welcomed", "1");
  });
}

export function createConsoleBudget(page: Page) {
  const fatalErrors: string[] = [];
  const perfWarnings: string[] = [];

  page.on("console", (msg) => {
    const text = msg.text();
    if (
      /Maximum update depth exceeded|getSnapshot should be cached|Cannot read properties of undefined \(reading 'Provider'\)/i.test(
        text,
      )
    ) {
      fatalErrors.push(text);
    }
    if (
      /\[Violation\].*setTimeout handler took|Unable to preventDefault inside passive event listener invocation/i.test(
        text,
      )
    ) {
      perfWarnings.push(text);
    }
  });

  return {
    assert() {
      expect(fatalErrors, `fatal runtime console errors:\n${fatalErrors.join("\n")}`).toEqual([]);
      expect(
        perfWarnings.length,
        `too many perf warnings (${perfWarnings.length}):\n${perfWarnings.join("\n")}`,
      ).toBeLessThanOrEqual(2);
    },
  };
}

export async function createNoteWithImage(page: Page, title: string) {
  await page.waitForLoadState("networkidle");

  const panelHeading = page.getByRole("heading", { name: /New note/i });
  const titleInput = page
    .locator("input[placeholder='Parlor safe = 4271']")
    .or(page.getByLabel("Title").first())
    .first();
  const emptyStateAdd = page.getByRole("button", { name: /Add your first note/i });
  const addNoteHeader = page.getByRole("button", { name: /Add note/i });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.keyboard.press("n");
    if (await panelHeading.isVisible()) break;

    if (await emptyStateAdd.isVisible()) {
      await emptyStateAdd.click();
    } else {
      await addNoteHeader.click();
    }

    if (await panelHeading.isVisible()) break;
  }

  await expect(panelHeading).toBeVisible({ timeout: 10_000 });
  await expect(titleInput).toBeVisible({ timeout: 10_000 });
  await titleInput.fill(`${title} #smoke @entrance-hall`);

  const attachInput = page.locator(".capture-footer input[type='file']");
  await attachInput.setInputFiles(smokeImagePath);

  await page.getByRole("button", { name: "Save", exact: true }).click();
}
