import { expect, test } from "@playwright/test";
import { createConsoleBudget, enableWelcomeBypass } from "./helpers";

test("todos smoke: board shells and scope controls", async ({ page }) => {
  const budgets = createConsoleBudget(page);
  await enableWelcomeBypass(page);

  await page.goto("/section/todos");

  await expect(page.getByRole("heading", { name: "Todo" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Open" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In progress" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Done" })).toBeVisible();

  await page.getByRole("button", { name: "This run" }).click();
  await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  await expect(page.getByText(/\d+ item|\d+ items/)).toBeVisible();

  budgets.assert();
});
