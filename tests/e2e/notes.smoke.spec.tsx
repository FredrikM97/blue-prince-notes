import { expect, test } from "@playwright/test";
import { createConsoleBudget, createNoteWithImage, enableWelcomeBypass } from "./helpers";

test("notes smoke: create, edit, delete", async ({ page }) => {
  test.setTimeout(60_000);

  const uid = Date.now().toString(36);
  const baseTitle = `E2E smoke note ${uid}`;
  const editedTitle = `E2E smoke note edited ${uid}`;

  const budgets = createConsoleBudget(page);
  await enableWelcomeBypass(page);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Blue Prince Notes" })).toBeVisible();

  await createNoteWithImage(page, baseTitle);

  const noteRow = page.locator(".note-row-item", { hasText: baseTitle }).first();
  await expect(noteRow).toBeVisible();

  await noteRow.getByRole("button", { name: "Edit note" }).click();
  await page.getByLabel("Title").first().fill(`${editedTitle} #smoke @entrance-hall`);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText(editedTitle, { exact: false }).first()).toBeVisible();

  const editedRow = page.locator(".note-row-item", { hasText: editedTitle }).first();
  await editedRow.getByRole("button", { name: "Delete note" }).click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator(".note-row-item", { hasText: editedTitle })).toHaveCount(0);

  budgets.assert();
});
