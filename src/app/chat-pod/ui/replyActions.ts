import type { Chip } from "../types";

export interface TaskReplies {
  choices: Chip[];
  primary: Chip | null;
  secondary: Chip[];
}

/** Task commands must remain reachable independently of a long selectable answer list. */
export function taskReplies(chips: readonly Chip[]): TaskReplies {
  const result: TaskReplies = { choices: [], primary: null, secondary: [] };
  for (const chip of chips) {
    const action = chip.action;
    if (action.kind === "slot-continue" || (action.kind === "intake-action" && (action.action === "submit" || action.action === "retry"))) {
      if (result.primary === null) result.primary = chip;
      else result.secondary.push(chip);
    } else if (action.kind === "slot-edit" || action.kind === "slot-skip" || action.kind === "intake-action") {
      result.secondary.push(chip);
    } else result.choices.push(chip);
  }
  if (result.primary === null) {
    const review = result.secondary.findIndex((chip) => chip.action.kind === "intake-action" && chip.action.action === "review");
    if (review !== -1) result.primary = result.secondary.splice(review, 1)[0];
  }
  return result;
}

/** The count describes the draft; the command label describes the action and stays stable. */
export function commandLabel(chip: Chip): string {
  if (chip.action.kind === "slot-continue") return "Continue";
  if (chip.action.kind === "intake-action" && chip.action.action === "submit") return "Send brief";
  if (chip.action.kind === "intake-action" && chip.action.action === "retry") return "Retry sending";
  return chip.label;
}
