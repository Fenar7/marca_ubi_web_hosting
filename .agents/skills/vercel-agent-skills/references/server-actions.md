# Vercel Agent Skills — Server Actions & Mutation Boundaries

Guidelines for rock-solid Next.js App Router Server Actions.

---

## 1. Boundary Rules
- Every Server Action file must have `"use server"` at the very top.
- **Export only async functions.** Never export synchronous helpers, constants, types, or Zod schemas from `"use server"` files.
- Run `npm run test:boundaries` to verify 100% boundary compliance.

---

## 2. Robust Mutation Pattern
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const updateLeadSchema = z.object({
  id: z.string().uuid(),
  statusId: z.string().uuid(),
});

export async function updateLeadStatus(input: unknown) {
  const parsed = updateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid payload parameters" };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ status_id: parsed.data.statusId })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (error) {
    console.error("[CRM Server Action] Failed to update lead status:", error.message);
    return { success: false, error: "Database transaction failed" };
  }

  revalidatePath("/admin");
  return { success: true, data };
}
```
