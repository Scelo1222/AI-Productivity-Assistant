import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudySync AI · Student Productivity Dashboard" },
      {
        name: "description",
        content:
          "StudySync AI: an AI email writer, notes summarizer, study planner, research helper and tutor in one student dashboard.",
      },
      { property: "og:title", content: "StudySync AI · Student Productivity Dashboard" },
      {
        property: "og:description",
        content:
          "Draft emails, summarize lecture notes, plan your week and revise smarter — with built-in responsible AI guidance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/studysync/index.html"
      title="StudySync AI dashboard"
      style={{ border: 0, width: "100vw", height: "100vh", display: "block" }}
    />
  );
}
