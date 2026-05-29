import { expect, test } from "@playwright/test";
import { createConsoleBudget, createNoteWithImage, enableWelcomeBypass } from "./helpers";

test("graph smoke: render graph canvas and inspector", async ({ page }) => {
  const budgets = createConsoleBudget(page);
  await enableWelcomeBypass(page);

  await page.goto("/");
  await createNoteWithImage(page, `E2E graph smoke ${Date.now().toString(36)}`);

  await page.goto("/section/graph");

  await expect(page.getByRole("button", { name: "Reset view" })).toBeVisible();
  await expect(page.locator("svg").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Connections" })).toBeVisible();

  budgets.assert();
});
