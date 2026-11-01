/**
 * @file ChatPodBoundary.tsx
 * @description Server-side provider for the pod. It compiles the corpus and hands the client a plain
 *              JSON object through props, which is the whole reason chat mode makes zero network
 *              requests: the visitor's message never leaves the browser, so there is nothing to
 *              rate-limit, nothing to authenticate and no chat endpoint to probe.
 *
 *              It is a separate file rather than an `await` in `layout.tsx` so the render can sit
 *              inside a `<Suspense>` boundary. Without that, two Sanity round-trips would stand in
 *              front of the first byte of every page on the site; with it, the document streams and
 *              the pod arrives in its own later chunk.
 * @author Fenar Khan <86710532+Fenar7@users.noreply.github.com>
 */

import { getKnowledgeBase } from "./knowledge/collect";
import ChatPodShell from "./ChatPodShell";
import type { KnowledgeBase } from "./types";

export default async function ChatPodBoundary() {
  let knowledge: KnowledgeBase | null = null;
  try {
    knowledge = await getKnowledgeBase();
  } catch (error) {
    // The pod is an enhancement, so its failure must not become a site-wide 500. It is still loud:
    // an unlogged fallback would hide a broken corpus behind a visibly absent launcher, which is
    // indistinguishable from "nobody mounted the pod today".
    console.error("[chat-pod] corpus compile failed; the pod will not mount on this render:", error);
    return null;
  }

  return <ChatPodShell knowledge={knowledge} />;
}
