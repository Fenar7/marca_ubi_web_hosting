/** Whole-message commands are reserved for intake navigation; longer field values stay literal. */
export type IntakeCommand = "back" | "contact" | "exit" | "review";

/** Trim only terminal sentence punctuation so commands remain bounded and ordinary project titles survive. */
export function parseIntakeCommand(raw: string): IntakeCommand | null {
  const command = raw.trim().toLowerCase().replace(/[.!?]+$/, "").trim();
  if (/^(stop|cancel|exit|quit|never mind|not now)$/.test(command)) return "exit";
  if (/^(back|go back)$/.test(command)) return "back";
  if (/^(review|review brief)$/.test(command)) return "review";
  if (/^(contact|contact the studio|talk to a person)$/.test(command)) return "contact";
  return null;
}
