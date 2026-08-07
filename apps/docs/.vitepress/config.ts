import { withMermaid } from "vitepress-plugin-mermaid";
import { nav, sidebar } from "./sidebar";

/**
 * ตัวตัดคำสำหรับ local search
 *
 * ภาษาไทยไม่เว้นวรรคระหว่างคำ ตัวตัดคำ default ของ MiniSearch (split ตาม whitespace)
 * จึงมองทั้งประโยคเป็น token เดียว ค้นหาแทบไม่เจอ — ใช้ Intl.Segmenter ตัดคำไทยแทน
 *
 * ข้อจำกัด: VitePress serialize ฟังก์ชันนี้ลง client bundle ด้วย toString()
 * จึงห้าม reference ตัวแปรนอก scope เด็ดขาด (ต้อง self-contained ทั้งก้อน)
 */
const tokenize = (text: string) => {
  const rough = text.split(/[\n\r\p{Z}\p{P}\p{S}]+/u).filter(Boolean);
  const hasThai = /[฀-๿]/;
  if (typeof Intl === "undefined" || !("Segmenter" in Intl)) return rough;

  const segmenter = new Intl.Segmenter("th", { granularity: "word" });
  const tokens: string[] = [];
  for (const chunk of rough) {
    if (!hasThai.test(chunk)) {
      tokens.push(chunk);
      continue;
    }
    // เก็บทั้งก้อนไว้ด้วย เผื่อผู้ใช้พิมพ์วลียาว
    tokens.push(chunk);
    for (const part of segmenter.segment(chunk)) {
      const word = part.segment.trim();
      if (word) tokens.push(word);
    }
  }
  return tokens;
};

export default withMermaid({
  title: "app-platform",
  description: "Single source of truth ของ boilerplate: สถาปัตยกรรม สัญญา และคู่มือ",
  srcDir: ".",
  lang: "th-TH",
  cleanUrls: true,
  // ปิดไว้: ต้องเรียก `git` ซึ่งไม่มีใน image node:22-bookworm-slim ที่ docs container ใช้รัน
  // (ไม่งั้นทุกหน้าพังด้วย "spawn git ENOENT") เปิดใหม่ได้ถ้าเพิ่ม git ใน infra/docker/docs/Dockerfile.dev
  lastUpdated: false,
  // ลิงก์เสียต้องทำให้ build พัง — นี่คือกลไกบังคับให้ /en/ มิเรอร์ครบทุกหน้า
  // ยกเว้นเฉพาะ URL ของ dev stack บนเครื่อง ซึ่งไม่มีทางเช็คได้ตอน build
  ignoreDeadLinks: [/^https?:\/\/localhost(:\d+)?/],

  locales: {
    root: {
      label: "ไทย",
      lang: "th-TH",
      themeConfig: {
        nav: nav("th"),
        sidebar: sidebar("th"),
        outline: { level: "deep", label: "หัวข้อในหน้านี้" },
        docFooter: { prev: "หน้าก่อนหน้า", next: "หน้าถัดไป" },
        darkModeSwitchLabel: "ธีม",
        lightModeSwitchTitle: "สลับเป็นธีมสว่าง",
        darkModeSwitchTitle: "สลับเป็นธีมมืด",
        sidebarMenuLabel: "เมนู",
        returnToTopLabel: "กลับขึ้นบนสุด",
        langMenuLabel: "เปลี่ยนภาษา",
        lastUpdated: { text: "แก้ไขล่าสุด" },
        editLink: {
          pattern: "https://github.com/BKFullStack/app-platform/edit/main/apps/docs/:path",
          text: "แก้ไขหน้านี้",
        },
        footer: {
          message: "เอกสารชุดนี้คือ single source of truth — โค้ดตามเอกสาร ไม่ใช่เอกสารตามโค้ด",
          copyright: "app-platform",
        },
      },
    },
    en: {
      label: "English",
      lang: "en-US",
      link: "/en/",
      themeConfig: {
        nav: nav("en"),
        sidebar: sidebar("en"),
        outline: { level: "deep", label: "On this page" },
        editLink: {
          pattern: "https://github.com/BKFullStack/app-platform/edit/main/apps/docs/:path",
          text: "Edit this page",
        },
        footer: {
          message: "These docs are the single source of truth — code follows the docs, not the other way around.",
          copyright: "app-platform",
        },
      },
    },
  },

  themeConfig: {
    search: {
      provider: "local",
      options: {
        miniSearch: { options: { tokenize } },
        locales: {
          root: {
            translations: {
              button: { buttonText: "ค้นหา", buttonAriaLabel: "ค้นหาเอกสาร" },
              modal: {
                displayDetails: "แสดงรายละเอียด",
                resetButtonTitle: "ล้างคำค้น",
                backButtonTitle: "ปิด",
                noResultsText: "ไม่พบผลลัพธ์สำหรับ",
                footer: {
                  selectText: "เลือก",
                  navigateText: "เลื่อน",
                  closeText: "ปิด",
                },
              },
            },
          },
        },
      },
    },
  },
});
