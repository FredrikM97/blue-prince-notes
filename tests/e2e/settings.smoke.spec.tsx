import { expect, test } from "@playwright/test";
import { createConsoleBudget, enableWelcomeBypass } from "./helpers";

test("settings smoke: data and room controls are visible", async ({ page }) => {
  const budgets = createConsoleBudget(page);
  await enableWelcomeBypass(page);

  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Data" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export ZIP" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rooms" })).toBeVisible();

  budgets.assert();
});
