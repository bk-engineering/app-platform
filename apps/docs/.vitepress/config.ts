import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  title: "app-platform",
  description: "Single source of truth for architecture, ADRs, and guides",
  srcDir: ".",
  themeConfig: {
    nav: [
      { text: "Architecture", link: "/architecture/overview" },
      { text: "ADRs", link: "/adr/0001-record-architecture-decisions" },
      { text: "Guides", link: "/guides/local-development" },
    ],
    sidebar: [
      {
        text: "Architecture",
        items: [{ text: "Overview", link: "/architecture/overview" }],
      },
      {
        text: "ADRs",
        items: [
          {
            text: "0001 - Record architecture decisions",
            link: "/adr/0001-record-architecture-decisions",
          },
        ],
      },
      {
        text: "Guides",
        items: [{ text: "Local development", link: "/guides/local-development" }],
      },
    ],
  },
});
