import { groq } from "next-sanity";

export const worksQuery = groq`
  *[_type == "work"] | order(order asc) {
    _id,
    title,
    subtext,
    coverImage,
    caseStudyLink,
    testimonialLink,
    viewWorkLink,
  }
`;
