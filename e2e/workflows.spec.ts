import { expect, test } from "@playwright/test";
import path from "node:path";

test("default comparison, every scenario, span details and keyboard navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByText(/Diverged at step 5/)).toBeVisible();
  await page
    .getByRole("button", { name: "Step 5: bureau_score_lookup, changed" })
    .click();
  await expect(
    page
      .getByRole("complementary", { name: "Span details" })
      .getByText("args.region"),
  ).toBeVisible();
  await page.keyboard.press("j");
  await expect(
    page.getByRole("button", { name: "Step 6: bureau_score_lookup, changed" }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const id of ["prompt-edit", "tool-bump", "control", "model-swap"]) {
    await page.getByLabel("Trace pair").selectOption(id);
    if (id === "control")
      await expect(page.getByText("No divergence: runs match")).toBeVisible();
    else await expect(page.getByText(/Diverged at step 5/)).toBeVisible();
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  }
  await page.getByRole("heading", { level: 1 }).click();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: "test-results/screenshot.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("regression creation persists after reload and exports JSON", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Turn into regression test" }).click();
  await expect(page.getByRole("status")).toContainText("TC-");
  await page.reload();
  await page.getByRole("button", { name: /Regression dataset/ }).click();
  const dialog = page.getByRole("dialog", { name: "Regression dataset" });
  await expect(dialog.locator("header code")).toHaveCount(1);
  await dialog.getByText("View test case JSON").click();
  await expect(dialog.locator("pre")).toContainText('"expected_tools"');
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: /^Download TC-/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^TC-.+\.json$/);
});

test("upload validation and real JSON file import", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Import traces" }).click();
  await page
    .getByLabel("Baseline JSON", { exact: true })
    .fill("not valid json");
  await page.getByRole("button", { name: "Compare traces" }).click();
  await expect(page.getByRole("alert")).toContainText("valid JSON");
  await page
    .getByLabel("Upload baseline file")
    .setInputFiles(path.resolve("src/data/seed/control.baseline.json"));
  await page
    .getByLabel("Upload candidate file")
    .setInputFiles(path.resolve("src/data/seed/control.candidate.json"));
  await page.getByRole("button", { name: "Compare traces" }).click();
  await expect(page.getByText("No divergence: runs match")).toBeVisible();
  await expect(page.getByLabel("Trace pair")).toHaveValue("imported");
});

test("both pages fit 320, 375, 414 and 768 pixels", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/story"]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        width: document.documentElement.scrollWidth,
      }));
      expect(dimensions.width, `${route} at ${width}px`).toBeLessThanOrEqual(
        dimensions.viewport,
      );
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/");
  await expect(page.getByText(/Diverged at step 5/)).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});

test("story autoplay visits all five scenes every four seconds", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/story?autoplay=1");
  for (const scene of ["hero", "pain", "decision", "diagram", "impact"]) {
    await expect(page.locator(".story")).toHaveAttribute(
      "data-active-scene",
      scene,
      { timeout: 5500 },
    );
    await expect(page.locator(`#${scene}`)).toBeInViewport({ ratio: 0.5 });
  }
  expect(errors).toEqual([]);
});

test("reduced motion is static, disables autoplay, and keeps navigation usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/story?autoplay=1");
  await expect(page.locator(".story")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await expect(page.getByRole("button", { name: "Play story" })).toBeDisabled();
  await page.getByRole("button", { name: "Scene 4: What it does" }).click();
  await expect(page.locator("#diagram")).toBeInViewport({ ratio: 0.5 });
  await expect(page.locator(".diagram-dataset")).toContainText(
    "Regression dataset",
  );
  await page.screenshot({ path: "test-results/story.png" });
  await page.getByRole("button", { name: "Scene 5: Measured impact" }).click();
  await expect(page.getByLabel("1 row", { exact: true })).toHaveText("1 row");
  await page.getByRole("link", { name: "Explore Trace Diff" }).click();
  await expect(page.getByText(/Diverged at step 5/)).toBeVisible();
});
