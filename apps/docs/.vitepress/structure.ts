/**
 * โครงสร้างเอกสารชุดเดียว ใช้สร้าง sidebar/nav ของทั้งสองภาษา
 *
 * กฎ: ทุกหน้าต้องมีไฟล์ทั้ง `<path>.md` (ไทย) และ `en/<path>.md` (อังกฤษ)
 * เพราะ config ตั้ง ignoreDeadLinks: false — ถ้าไฟล์ฝั่งใดขาด build จะพัง
 * นี่คือกลไกบังคับไม่ให้สองภาษา drift กัน
 */

export interface DocPage {
  /** path ไม่มี locale prefix และไม่มีนามสกุล เช่น "start/quickstart" */
  path: string;
  th: string;
  en: string;
}

export interface DocSection {
  key: string;
  th: string;
  en: string;
  /** ให้ sidebar พับไว้เป็นค่าเริ่มต้น */
  collapsed?: boolean;
  items: DocPage[];
}

export const structure: DocSection[] = [
  {
    key: "start",
    th: "เริ่มต้น",
    en: "Start",
    items: [
      { path: "start/introduction", th: "boilerplate นี้คืออะไร", en: "What is this boilerplate" },
      { path: "start/quickstart", th: "เริ่มใช้งานใน 10 นาที", en: "Quickstart" },
      { path: "start/repo-tour", th: "ทัวร์โครงสร้าง repo", en: "Repo tour" },
      { path: "start/glossary", th: "อภิธานศัพท์", en: "Glossary" },
      { path: "start/roadmap", th: "สถานะ & Roadmap", en: "Status & roadmap" },
    ],
  },
  {
    key: "architecture",
    th: "สถาปัตยกรรม",
    en: "Architecture",
    items: [
      { path: "architecture/overview", th: "ภาพรวมระบบ", en: "System overview" },
      { path: "architecture/containers", th: "Container & routing", en: "Containers & routing" },
      { path: "architecture/tech-stack", th: "Tech stack & เหตุผล", en: "Tech stack & rationale" },
      { path: "architecture/request-lifecycle", th: "วงจรชีวิตของ request", en: "Request lifecycle" },
      { path: "architecture/data-model", th: "Data model", en: "Data model" },
    ],
  },
  {
    key: "conventions",
    th: "ข้อตกลง & สัญญา",
    en: "Conventions & contracts",
    items: [
      { path: "conventions/contract-first", th: "Contract-first workflow", en: "Contract-first workflow" },
      { path: "conventions/api-conventions", th: "ข้อตกลงของ API", en: "API conventions" },
      { path: "conventions/errors", th: "Error envelope", en: "Error envelope" },
      { path: "conventions/structure-api", th: "โครงสร้างโฟลเดอร์ · api", en: "Folder structure · api" },
      { path: "conventions/structure-web", th: "โครงสร้างโฟลเดอร์ · web", en: "Folder structure · web" },
    ],
  },
  {
    key: "platform",
    th: "ข้ามระบบ",
    en: "Platform",
    items: [
      { path: "platform/trace-id", th: "Trace ID", en: "Trace ID" },
      { path: "platform/config", th: "Config & environment", en: "Config & environment" },
      { path: "platform/observability", th: "Observability & logging", en: "Observability & logging" },
      { path: "platform/health", th: "Health checks", en: "Health checks" },
      { path: "platform/security", th: "Security checklist", en: "Security checklist" },
    ],
  },
  {
    key: "auth",
    th: "ยืนยันตัวตน & สิทธิ์",
    en: "Auth & access",
    items: [
      { path: "auth/overview", th: "ภาพรวม auth", en: "Auth overview" },
      { path: "auth/tokens", th: "JWT & refresh rotation", en: "JWT & refresh rotation" },
      { path: "auth/login", th: "เข้าสู่ระบบ", en: "Login" },
      { path: "auth/signup", th: "สมัครสมาชิก & Google OAuth", en: "Signup & Google OAuth" },
      { path: "auth/forgot-password", th: "ลืมรหัสผ่าน", en: "Forgot password" },
      { path: "auth/email-verification", th: "ยืนยันอีเมล", en: "Email verification" },
      { path: "auth/rbac-model", th: "Role & permission model", en: "Role & permission model" },
      { path: "auth/casl", th: "CASL authorization", en: "CASL authorization" },
    ],
  },
  {
    key: "frontend",
    th: "ฟรอนต์เอนด์",
    en: "Frontend",
    items: [
      { path: "frontend/overview", th: "ภาพรวมฟรอนต์เอนด์", en: "Frontend overview" },
      { path: "frontend/data-fetching", th: "Data fetching (TanStack Query)", en: "Data fetching (TanStack Query)" },
      { path: "frontend/forms", th: "ฟอร์ม (react-hook-form + zod)", en: "Forms (react-hook-form + zod)" },
      { path: "frontend/ui-system", th: "ระบบ UI (shadcn/ui)", en: "UI system (shadcn/ui)" },
      { path: "frontend/i18n", th: "i18n (next-intl)", en: "i18n (next-intl)" },
      { path: "frontend/theming", th: "ธีม & dark mode", en: "Theming & dark mode" },
      { path: "frontend/auth-client", th: "Session ฝั่ง client", en: "Client session" },
      { path: "frontend/permissions-client", th: "สิทธิ์บน UI", en: "Permissions in the UI" },
    ],
  },
  {
    key: "backend",
    th: "แบ็กเอนด์",
    en: "Backend",
    items: [
      { path: "backend/overview", th: "ภาพรวมแบ็กเอนด์", en: "Backend overview" },
      { path: "backend/validation", th: "Validation (zod pipe)", en: "Validation (zod pipe)" },
      { path: "backend/prisma", th: "Prisma & data access", en: "Prisma & data access" },
      { path: "backend/openapi", th: "OpenAPI / Swagger", en: "OpenAPI / Swagger" },
      { path: "backend/caching", th: "Caching (Redis)", en: "Caching (Redis)" },
      { path: "backend/jobs", th: "งานเบื้องหลัง (jobs & queues)", en: "Background jobs & queues" },
      { path: "backend/file-storage", th: "จัดเก็บไฟล์", en: "File storage" },
      { path: "backend/email", th: "ส่งอีเมล", en: "Transactional email" },
    ],
  },
  {
    key: "features",
    th: "หน้าผลิตภัณฑ์",
    en: "Product features",
    items: [
      { path: "features/dashboard", th: "แดชบอร์ด", en: "Dashboard" },
      { path: "features/settings-users", th: "ตั้งค่า · จัดการผู้ใช้", en: "Settings · User management" },
      { path: "features/settings-roles", th: "ตั้งค่า · Role & permission", en: "Settings · Roles & permissions" },
      { path: "features/settings-theme", th: "ตั้งค่า · ธีม", en: "Settings · Theme" },
      { path: "features/profile", th: "โปรไฟล์", en: "Profile" },
    ],
  },
  {
    key: "quality",
    th: "คุณภาพโค้ด",
    en: "Quality",
    items: [
      { path: "quality/testing", th: "กลยุทธ์การเทส", en: "Testing strategy" },
      { path: "quality/code-quality", th: "Lint, format & type-check", en: "Lint, format & type-check" },
    ],
  },
  {
    key: "ops",
    th: "ปฏิบัติการ",
    en: "Operations",
    items: [
      { path: "ops/local-development", th: "พัฒนาบนเครื่อง", en: "Local development" },
      { path: "ops/docker-traefik", th: "Docker & Traefik", en: "Docker & Traefik" },
      { path: "ops/ci-cd", th: "CI/CD", en: "CI/CD" },
      { path: "ops/deployment", th: "Deployment", en: "Deployment" },
      { path: "ops/database-ops", th: "งานปฏิบัติการฐานข้อมูล", en: "Database operations" },
    ],
  },
  {
    key: "reference",
    th: "อ้างอิง",
    en: "Reference",
    collapsed: true,
    items: [
      { path: "reference/status-legend", th: "ความหมายของสถานะ", en: "Status legend" },
      { path: "reference/error-codes", th: "Error code catalog", en: "Error code catalog" },
      { path: "reference/env-vars", th: "Environment variables", en: "Environment variables" },
      { path: "reference/api-endpoints", th: "API endpoint catalog", en: "API endpoint catalog" },
      { path: "reference/contracts", th: "Contract schema catalog", en: "Contract schema catalog" },
    ],
  },
  {
    key: "adr",
    th: "ADR",
    en: "ADR",
    collapsed: true,
    items: [
      { path: "adr/overview", th: "สารบัญ ADR", en: "ADR index" },
      { path: "adr/0001-record-architecture-decisions", th: "0001 · บันทึก ADR", en: "0001 · Record ADRs" },
      { path: "adr/0002-pnpm-turborepo-monorepo", th: "0002 · pnpm + Turborepo", en: "0002 · pnpm + Turborepo" },
      { path: "adr/0003-shared-zod-contracts", th: "0003 · Shared zod contracts", en: "0003 · Shared zod contracts" },
      { path: "adr/0004-modular-monolith", th: "0004 · Modular monolith", en: "0004 · Modular monolith" },
      { path: "adr/0005-jwt-refresh-rotation", th: "0005 · Refresh rotation", en: "0005 · Refresh rotation" },
      { path: "adr/0006-token-storage-httponly-cookie", th: "0006 · เก็บ token ใน cookie", en: "0006 · httpOnly cookie storage" },
      { path: "adr/0007-casl-authorization", th: "0007 · CASL", en: "0007 · CASL" },
      { path: "adr/0008-error-envelope-and-trace-id", th: "0008 · Error envelope + trace id", en: "0008 · Error envelope + trace id" },
      { path: "adr/0011-thai-default-locale", th: "0011 · ไทยเป็น default locale", en: "0011 · Thai default locale" },
      { path: "adr/0015-docs-as-bilingual-ssot", th: "0015 · docs เป็น SSOT สองภาษา", en: "0015 · Bilingual docs SSOT" },
    ],
  },
];

/** กลุ่มที่ยกขึ้นมาเป็นเมนูหลักบน navbar (นอกนั้นอยู่ใน dropdown "คู่มือ") */
export const primaryNavKeys = ["start", "architecture", "reference", "adr"];
export const guideNavKeys = [
  "conventions",
  "platform",
  "auth",
  "frontend",
  "backend",
  "features",
  "quality",
  "ops",
];
