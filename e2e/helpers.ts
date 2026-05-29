import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Load the app in a clean state, then seed the known "Load example" scenario.
 * localStorage is cleared so each test starts deterministic.
 */
export async function loadExample(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Load example" }).click();
  // Wait until the graph has rendered the seeded nodes.
  await expect(page.locator(".status-node")).toHaveCount(3);
}

/**
 * The kanban uses native HTML5 drag-and-drop, which Playwright's mouse-based
 * dragTo does not reliably trigger. This dispatches real DnD events with a
 * shared DataTransfer through the actual React handlers.
 */
export async function moveCard(
  page: Page,
  cardTitle: string,
  columnLabel: string,
): Promise<void> {
  await page.evaluate(
    ({ cardTitle, columnLabel }) => {
      const cards = [...document.querySelectorAll(".card")];
      const card = cards.find(
        (c) => c.querySelector(".card__title")?.textContent?.trim() === cardTitle,
      );
      const col = [...document.querySelectorAll(".column")].find((c) =>
        c.querySelector(".column__head")?.textContent?.includes(columnLabel),
      );
      if (!card || !col) throw new Error("card or column not found");
      const dt = new DataTransfer();
      const fire = (el: Element, type: string) =>
        el.dispatchEvent(
          new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }),
        );
      fire(card, "dragstart");
      fire(col, "dragover");
      fire(col, "drop");
      fire(card, "dragend");
    },
    { cardTitle, columnLabel },
  );
}

/**
 * Locate a kanban column by its status label. The head's text content is the
 * label immediately followed by the count (e.g. "Not deployed2"), so we anchor
 * the label to the start to avoid "Deployed" matching "Not deployed".
 */
export function column(page: Page, label: string): Locator {
  const head = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  return page.locator(".column", {
    has: page.locator(".column__head", { hasText: head }),
  });
}

/** Locate a graph node's wrapper (`.react-flow__node`) by its label text. */
export function graphNode(page: Page, label: string): Locator {
  return page.locator(".react-flow__node", {
    has: page.locator(".status-node__label", { hasText: label }),
  });
}

/** Locate the inner `.status-node` (colored border element) by its label. */
export function statusNode(page: Page, label: string): Locator {
  return page.locator(".status-node", {
    has: page.locator(".status-node__label", { hasText: label }),
  });
}

/** Locate a kanban card by its title. */
export function card(page: Page, title: string): Locator {
  return page.locator(".card", {
    has: page.locator(".card__title", { hasText: title }),
  });
}
