import "server-only";

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../env";

function assertWriteToken(token: string | undefined) {
  if (!token) {
    throw new Error("Missing environment variable: SANITY_API_EDIT_TOKEN");
  }

  return token;
}

export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: assertWriteToken(process.env.SANITY_API_EDIT_TOKEN),
  useCdn: false,
});
