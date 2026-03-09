import { client } from "@/sanity/lib/client";
import { worksQuery } from "@/sanity/lib/queries";
import WorksSectionClient, { type SanityWork } from "./WorksSectionClient";

const WorksSection = async () => {
  const works: SanityWork[] = await client.fetch(worksQuery, {}, { next: { revalidate: 60 } });

  return <WorksSectionClient works={works} />;
};

export default WorksSection;
