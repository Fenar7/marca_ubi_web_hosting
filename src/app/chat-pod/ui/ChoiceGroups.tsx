"use client";

import type { Chip } from "../types";
import ChipRow from "./ChipRow";
import styles from "../ChatPod.module.scss";

interface Props {
  chips: Chip[];
  groups: ReadonlyMap<string, string>;
  onChip: (chip: Chip) => void;
  isSelected: (chip: Chip) => boolean;
}

/** Preserve source order inside meaningful groups instead of presenting one undifferentiated cloud. */
export default function ChoiceGroups({ chips, groups, onChip, isSelected }: Props) {
  const sections = new Map<string, Chip[]>();
  for (const chip of chips) {
    const group = "value" in chip.action ? (groups.get(chip.action.value) ?? "Choices") : "Choices";
    const entries = sections.get(group) ?? [];
    entries.push(chip);
    sections.set(group, entries);
  }
  return (
    <div className={styles.choiceGroups} role="group" aria-label="Choose a reply">
      {[...sections.entries()].map(([label, entries]) => (
        <div key={label} className={styles.choiceGroup}>
          {sections.size > 1 || label !== "Choices" ? <h3 className={styles.choiceGroupTitle}>{label}</h3> : null}
          <ChipRow chips={entries} onChip={onChip} isSelected={isSelected} ariaLabel={label} className={styles.choiceRows} />
        </div>
      ))}
    </div>
  );
}
