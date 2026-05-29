import { expect, test } from "@playwright/test";
import { createConsoleBudget, createNoteWithImage, enableWelcomeBypass } from "./helpers";

test("graph smoke: render graph canvas and inspector", async ({ page }) => {
  const budgets = createConsoleBudget(page);
  await enableWelcomeBypass(page);

  const uid = Date.now().toString(36);
  const noteTitle = `E2E graph smoke ${uid}`;

  await page.goto("/");
  await createNoteWithImage(page, noteTitle);

  const noteRow = page.locator(".note-row-item", { hasText: noteTitle }).first();
  await expect(noteRow).toBeVisible({ timeout: 10_000 });

  await page.goto("/section/graph");

  await expect(page.getByRole("heading", { name: "Connections" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Reset view" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("svg").first()).toBeVisible();

  budgets.assert();
});
