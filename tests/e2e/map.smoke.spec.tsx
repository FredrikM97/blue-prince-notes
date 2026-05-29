import { expect, test } from "@playwright/test";
import { createConsoleBudget, enableWelcomeBypass } from "./helpers";

test("map smoke: open and edit a cell panel", async ({ page }) => {
  const budgets = createConsoleBudget(page);
  await enableWelcomeBypass(page);

  await page.goto("/section/map");

  await expect(page.getByRole("heading", { name: "House Map" })).toBeVisible();
  await expect(page.locator(".map-cell")).toHaveCount(45);

  await page.locator(".map-cell").first().click();
  const detailsField = page.locator(".map-panel textarea").first();
  await expect(detailsField).toBeVisible();
  await detailsField.fill("Smoke map cell details");

  await page.getByRole("button", { name: "Close panel" }).click();

  budgets.assert();
});
