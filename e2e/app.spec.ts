import { test, expect } from "@playwright/test";
import {
  loadExample,
  moveCard,
  column,
  graphNode,
  statusNode,
  card,
} from "./helpers";

// Hex colors from STATUS_COLOR, as the browser reports them (rgb).
const GREEN = "rgb(34, 197, 94)"; // done
const GREY = "rgb(156, 163, 175)"; // todo

test.beforeEach(async ({ page }) => {
  await loadExample(page);
});

test("load example seeds the expected board structure", async ({ page }) => {
  // Four status columns visible.
  await expect(column(page, "Not deployed")).toBeVisible();
  await expect(column(page, "In progress")).toBeVisible();
  await expect(column(page, "Deployed")).toBeVisible();
  await expect(column(page, "Blocked")).toBeVisible();

  // Per-status counts: 2 / 1 / 2 / 0.
  await expect(column(page, "Not deployed").locator(".count")).toHaveText("2");
  await expect(column(page, "In progress").locator(".count")).toHaveText("1");
  await expect(column(page, "Deployed").locator(".count")).toHaveText("2");
  await expect(column(page, "Blocked").locator(".count")).toHaveText("0");

  // Graph: 3 nodes, 2 edges, both edge labels visible.
  await expect(page.locator(".status-node")).toHaveCount(3);
  await expect(page.locator(".react-flow__edge-path")).toHaveCount(2);
  await expect(page.locator(".floating-edge-label", { hasText: "runs on" })).toBeVisible();
  await expect(
    page.locator(".floating-edge-label", { hasText: "IRSA access" }),
  ).toBeVisible();
});

test("status colors drive node borders", async ({ page }) => {
  // EKS Cluster is "done" -> green border; Application is "todo" -> grey.
  await expect(statusNode(page, "EKS Cluster")).toHaveCSS("border-color", GREEN);
  await expect(statusNode(page, "Application")).toHaveCSS("border-color", GREY);
});

test("moving a card recolors its node live", async ({ page }) => {
  // Application starts grey (todo).
  await expect(statusNode(page, "Application")).toHaveCSS("border-color", GREY);

  await moveCard(page, "Application", "Deployed");

  // Card now lives in the Deployed column...
  await expect(column(page, "Deployed").locator(".card__title", { hasText: "Application" })).toBeVisible();
  // ...and the node border turned green.
  await expect(statusNode(page, "Application")).toHaveCSS("border-color", GREEN);
});

test("adding a resource via the toolbar form", async ({ page }) => {
  const input = page.getByLabel("New resource name");
  await input.fill("S3 Bucket");
  await page.getByRole("button", { name: "+ Add" }).click();

  // A card appears under "Not deployed".
  await expect(
    column(page, "Not deployed").locator(".card__title", { hasText: "S3 Bucket" }),
  ).toBeVisible();
  // A 4th graph node appears.
  await expect(page.locator(".status-node")).toHaveCount(4);
  // The input is cleared.
  await expect(input).toHaveValue("");
});

test("add, save and remove a card description", async ({ page }) => {
  // "App runs on EKS" has no description, so its note button isn't active.
  const target = card(page, "App runs on EKS");
  const note = target.locator(".card__note");
  await expect(note).not.toHaveClass(/card__note--active/);

  // Open the editor, type a note, save with Enter.
  await note.click();
  const editor = target.locator(".card__desc-edit");
  await expect(editor).toBeVisible();
  await editor.fill("test note");
  await editor.press("Enter");

  // Editor closed, note button now active.
  await expect(editor).toBeHidden();
  await expect(note).toHaveClass(/card__note--active/);

  // Reopen and remove the description.
  await note.click();
  await target.locator(".card__desc-remove").click();
  await expect(note).not.toHaveClass(/card__note--active/);
});

test("inline rename propagates to the graph node", async ({ page }) => {
  await card(page, "EKS Cluster").locator(".card__title").dblclick();

  // Only one card can be edited at a time; once editing starts the title span
  // is replaced by this input, so target it globally rather than via the card.
  const titleEdit = page.locator(".card__title-edit");
  await expect(titleEdit).toBeVisible();
  await titleEdit.fill("EKS v2");
  await titleEdit.press("Enter");

  // The graph node label updates to the new title.
  await expect(statusNode(page, "EKS v2")).toBeVisible();
  await expect(page.locator(".status-node__label", { hasText: "EKS Cluster" })).toHaveCount(0);
});

test("auto-organize repositions nodes", async ({ page }) => {
  const node = graphNode(page, "EKS Cluster");
  const before = await node.evaluate((el) => (el as HTMLElement).style.transform);

  await page.getByRole("button", { name: "Auto-organize" }).click();

  // The layout + fitView animation needs a moment to settle.
  await expect
    .poll(
      async () => node.evaluate((el) => (el as HTMLElement).style.transform),
      { timeout: 5000 },
    )
    .not.toBe(before);
});
