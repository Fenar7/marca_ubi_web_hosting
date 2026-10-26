import { redirect } from "next/navigation";

/**
 * Legacy Work Route Redirect.
 * Permanently redirects /work traffic to canonical /works showcase route.
 *
 * @author Fenar7 <86710532+Fenar7@users.noreply.github.com>
 */
export default function LegacyWorkPage() {
  redirect("/works");
}
