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

test("adding a resource via the floating map button", async ({ page }) => {
  // The control lives on the map: a "+ Add resource" button that reveals an input.
  await page.getByRole("button", { name: "+ Add resource" }).click();
  const input = page.getByPlaceholder("Resource name…");
  await input.fill("S3 Bucket");
  await input.press("Enter");

  // A card appears under "Not deployed".
  await expect(
    column(page, "Not deployed").locator(".card__title", { hasText: "S3 Bucket" }),
  ).toBeVisible();
  // A 4th graph node appears.
  await expect(page.locator(".status-node")).toHaveCount(4);
  // The panel collapses back to the button.
  await expect(page.getByRole("button", { name: "+ Add resource" })).toBeVisible();
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

test("nodes with a description show the note icon", async ({ page }) => {
  // All 3 seeded nodes have descriptions, so each shows the corner note icon.
  await expect(page.locator(".status-node__note-icon")).toHaveCount(3);
  await expect(
    statusNode(page, "EKS Cluster").locator(".status-node__note-icon"),
  ).toBeVisible();
});

test("double-click renames a node directly on the map", async ({ page }) => {
  await statusNode(page, "RDS").locator(".status-node__label").dblclick();

  const edit = page.locator(".status-node__label-edit");
  await expect(edit).toBeVisible();
  await edit.fill("RDS Aurora");
  await edit.press("Enter");

  // Node label updates...
  await expect(statusNode(page, "RDS Aurora")).toBeVisible();
  // ...and so does the linked kanban card.
  await expect(card(page, "RDS Aurora")).toBeVisible();
});

test("double-click renames an edge label directly on the map", async ({ page }) => {
  await page.locator(".floating-edge-label", { hasText: "runs on" }).dblclick();

  const edit = page.locator(".floating-edge-label-edit");
  await expect(edit).toBeVisible();
  await edit.fill("deployed on");
  await edit.press("Enter");

  await expect(
    page.locator(".floating-edge-label", { hasText: "deployed on" }),
  ).toBeVisible();
});

test("dragging the gutter resizes the panes", async ({ page }) => {
  const kanban = page.locator(".pane--kanban");
  const before = (await kanban.boundingBox())!.width;

  const gutter = page.locator(".pane-gutter");
  const box = (await gutter.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();

  await expect
    .poll(async () => (await kanban.boundingBox())!.width)
    .toBeGreaterThan(before + 50);
});

test("toggles hide and restore the panes", async ({ page }) => {
  const kanbanBtn = page.getByRole("button", { name: "Kanban" });

  // Hide the kanban: only the map remains, no gutter.
  await kanbanBtn.click();
  await expect(page.locator(".pane--kanban")).toHaveCount(0);
  await expect(page.locator(".pane--graph")).toBeVisible();
  await expect(page.locator(".pane-gutter")).toHaveCount(0);

  // Click again to restore both panes.
  await kanbanBtn.click();
  await expect(page.locator(".pane--kanban")).toBeVisible();
  await expect(page.locator(".pane--graph")).toBeVisible();
  await expect(page.locator(".pane-gutter")).toBeVisible();
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
