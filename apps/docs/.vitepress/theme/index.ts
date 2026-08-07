import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import Status from "./components/Status.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // ใช้ได้ทุกหน้าโดยไม่ต้อง import: <Status value="planned" />
    app.component("Status", Status);
  },
} satisfies Theme;
