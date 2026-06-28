import type { Vehicle } from "@globefly/shared";
import { t } from "../i18n";

export type ControlHintRow = { keys: string[]; label: string };

export interface VehicleTutorialHints {
  root: HTMLElement;
  setStep(index: number): void;
  dispose(): void;
}

function rowsForVehicle(vehicle: Vehicle): ControlHintRow[] {
  if (vehicle === "plane") {
    return [
      { keys: ["W"], label: t("Throttle", "油门") },
      { keys: ["S"], label: t("Slow", "减速") },
      { keys: ["A", "D"], label: t("Turn", "转向") },
      { keys: ["↑"], label: t("Climb", "爬升") },
      { keys: ["Space"], label: t("Shoot", "射击") },
    ];
  }
  if (vehicle === "carpet") {
    return [
      { keys: ["W"], label: t("Throttle", "油门") },
      { keys: ["S"], label: t("Slow", "减速") },
      { keys: ["A", "D"], label: t("Turn", "转向") },
      { keys: ["Space"], label: t("Portal", "传送门") },
    ];
  }
  const base: ControlHintRow[] = [
    { keys: ["W", "↑"], label: t("Throttle", "油门") },
    { keys: ["S", "↓"], label: t("Slow", "减速") },
    { keys: ["A", "D", "←", "→"], label: t("Turn", "转向") },
  ];
  return base;
}

function injectStyles() {
  if (document.getElementById("control-hints-styles")) return;
  const style = document.createElement("style");
  style.id = "control-hints-styles";
  style.textContent = `
    .control-hints {
      position: absolute;
      /* Room above Vibe Jam 2026 entrant label (widget.js, bottom-right). */
      bottom: max(108px, calc(100px + env(safe-area-inset-bottom, 0px)));
      right: max(36px, calc(28px + env(safe-area-inset-right, 0px)));
      z-index: 1;
      pointer-events: none;
      font-family: 'Domine', Georgia, serif;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }
    .control-hints.control-hints--tutorial {
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    .control-hints--hidden {
      opacity: 0;
      transform: translateY(8px);
    }
    .control-hints-title {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.45);
      margin-bottom: 10px;
    }
    .control-hints-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 9px;
      font-size: 0.78rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.92);
    }
    .control-hints-title + .control-hints-row { margin-top: 0; }
    .control-hints-keys {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      max-width: 120px;
    }
    .control-hints-keys kbd {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 3px 6px;
      min-width: 1.25rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 6px;
      color: #fff;
      background: transparent;
      line-height: 1.2;
    }
    .control-hints-label {
      flex: 0 1 auto;
      min-width: 0;
      letter-spacing: 0.02em;
    }
    .control-hints--tutorial .control-hints-title {
      font-size: 0.93rem;
      color: rgba(255, 255, 255, 0.62);
      margin-bottom: 15px;
    }
    .control-hints--tutorial .control-hints-row {
      gap: 15px;
      margin-top: 0;
      font-size: 1.17rem;
    }
    .control-hints--tutorial .control-hints-keys {
      gap: 6px;
      max-width: 180px;
    }
    .control-hints--tutorial .control-hints-keys kbd {
      font-size: 0.975rem;
      padding: 4.5px 9px;
      min-width: 1.875rem;
      border-width: 1.5px;
      border-radius: 9px;
    }
    @media (max-width: 520px) {
      .control-hints { display: none; }
    }
  `;
  document.head.appendChild(style);
}

const TITLES: Record<Vehicle, string> = {
  plane: t("Biplane", "双翼机"),
  boat: t("Boat", "小船"),
  carpet: t("Carpet", "飞毯"),
};

function appendKeys(parent: HTMLElement, keys: string[]) {
  parent.replaceChildren();
  parent.style.display = keys.length > 0 ? "" : "none";
  for (const k of keys) {
    const el = document.createElement("kbd");
    el.textContent = k;
    parent.appendChild(el);
  }
}

function buildHints(
  parent: HTMLElement,
  ariaLabel: string,
  rows: ControlHintRow[],
  options: { title?: string; className?: string } = {},
): HTMLElement {
  injectStyles();
  const wrap = document.createElement("div");
  wrap.className = `control-hints${options.className ? ` ${options.className}` : ""}`;
  wrap.setAttribute("aria-label", ariaLabel);

  const title = document.createElement("div");
  title.className = "control-hints-title";
  title.textContent = options.title ?? t("Controls", "操作");
  wrap.appendChild(title);

  for (const row of rows) {
    const line = document.createElement("div");
    line.className = "control-hints-row";

    const keys = document.createElement("span");
    keys.className = "control-hints-keys";
    appendKeys(keys, row.keys);

    const label = document.createElement("span");
    label.className = "control-hints-label";
    label.textContent = row.label;

    line.appendChild(keys);
    line.appendChild(label);
    wrap.appendChild(line);
  }

  parent.appendChild(wrap);
  return wrap;
}

/** Desktop-only keyboard hints for the current vehicle. Returns the element. */
export function mountControlHints(parent: HTMLElement, vehicle: Vehicle, desktop: boolean): HTMLElement | null {
  if (!desktop) return null;
  return buildHints(
    parent,
    t(`Keyboard controls (${TITLES[vehicle]})`, `键盘操作 (${TITLES[vehicle]})`),
    rowsForVehicle(vehicle),
  );
}

/** Desktop-only first-time tutorial prompt that reuses the controls hint layout. */
export function mountVehicleTutorialHints(
  parent: HTMLElement,
  desktop: boolean,
  rows: ControlHintRow[],
  title = t("First flight", "首次飞行"),
): VehicleTutorialHints | null {
  if (!desktop || rows.length === 0) return null;
  const root = buildHints(parent, t(`${title} tutorial`, `${title} 教程`), [rows[0]!], {
    title,
    className: "control-hints--tutorial",
  });
  const keys = root.querySelector(".control-hints-keys") as HTMLElement;
  const label = root.querySelector(".control-hints-label") as HTMLElement;

  return {
    root,
    setStep(index: number) {
      const row = rows[Math.max(0, Math.min(rows.length - 1, index))]!;
      appendKeys(keys, row.keys);
      label.textContent = row.label;
    },
    dispose() {
      root.remove();
    },
  };
}

/** Desktop-only keyboard hints for the campsite scene. Returns the element. */
export function mountCampsiteControlHints(parent: HTMLElement, desktop: boolean): HTMLElement | null {
  if (!desktop) return null;
  const rows: ControlHintRow[] = [
    { keys: ["W", "A", "S", "D"], label: t("Move", "移动") },
    { keys: ["↑", "↓", "←", "→"], label: t("Move", "移动") },
    { keys: ["Space"], label: t("Jump", "跳跃") },
    { keys: ["F"], label: t("Fly away", "起飞离开") },
  ];
  return buildHints(parent, t("Keyboard controls (Campsite)", "键盘操作 (营地)"), rows);
}
