import { defineConfig } from "sanity";
import { visionTool } from "@sanity/vision";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { companyProfileSubmissionSchema } from "./src/sanity/schemas/companyProfileSubmission";
import { workSchema } from "./src/sanity/schemas/work";
import { projectBriefSchema } from "./src/sanity/schemas/projectBrief";
import { postSchema } from "./src/sanity/schemas/post";
import { authorSchema } from "./src/sanity/schemas/author";
import { categorySchema } from "./src/sanity/schemas/category";
import { blockContentSchema } from "./src/sanity/schemas/blockContent";
import { careerPostingSchema } from "./src/sanity/schemas/careerPosting";
import { careerApplicationSchema } from "./src/sanity/schemas/careerApplication";
import { faqItemSchema } from "./src/sanity/schemas/faqItem";

export default defineConfig({
    basePath: "/studio",
    projectId,
    dataset,
    title: "Marca Ubi Studio",
    schema: {
        types: [
            workSchema,
            companyProfileSubmissionSchema,
            projectBriefSchema,
            postSchema,
            authorSchema,
            categorySchema,
            blockContentSchema,
            careerPostingSchema,
            careerApplicationSchema,
            faqItemSchema,
        ],
    },
    plugins: [
        structureTool(),
        visionTool({ defaultApiVersion: apiVersion }),
    ],
});
