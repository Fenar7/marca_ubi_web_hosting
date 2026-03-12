import { defineConfig } from "sanity";
import { visionTool } from "@sanity/vision";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { companyProfileSubmissionSchema } from "./src/sanity/schemas/companyProfileSubmission";
import { workSchema } from "./src/sanity/schemas/work";

export default defineConfig({
    basePath: "/studio",
    projectId,
    dataset,
    title: "Marca Ubi Studio",
    schema: {
        types: [workSchema, companyProfileSubmissionSchema],
    },
    plugins: [
        structureTool(),
        visionTool({ defaultApiVersion: apiVersion }),
    ],
});
