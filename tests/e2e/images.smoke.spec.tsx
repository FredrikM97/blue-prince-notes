import { expect, test } from "@playwright/test";
import { createConsoleBudget, createNoteWithImage, enableWelcomeBypass } from "./helpers";

test("images smoke: gallery and inspector", async ({ page }) => {
  const budgets = createConsoleBudget(page);
  await enableWelcomeBypass(page);

  await page.goto("/");
  await createNoteWithImage(page, `E2E image smoke ${Date.now().toString(36)}`);

  await page.goto("/section/images");

  await expect(page.getByRole("heading", { name: "Images" })).toBeVisible();
  await page.locator(".images-thumb").first().click();
  await expect(page.getByRole("button", { name: "Delete image" })).toBeVisible();

  budgets.assert();
});
