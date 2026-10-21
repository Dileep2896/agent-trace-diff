import type { Metadata } from "next";
import { Story } from "@/components/story/Story";
export const metadata: Metadata = {
  title: "The story behind Trace Diff",
  description:
    "From a model regression to the first wrong turn: a five-scene animated story.",
};
export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ autoplay?: string }>;
}) {
  const params = await searchParams;
  return <Story autoplay={params.autoplay === "1"} />;
}
