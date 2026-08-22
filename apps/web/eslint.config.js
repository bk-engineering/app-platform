import boundaries from "eslint-plugin-boundaries";
import { reactConfig } from "@app-platform/config/eslint/react";

/**
 * Enforces the core/entities/features/shared module boundary:
 * - shared has no internal deps
 * - core may only depend on shared
 * - entities may depend on core/shared
 * - features may depend on entities/core/shared, but NOT on other features
 * - only app (routes) may depend on everything
 * Cross-module imports must go through a module's index.ts (its public API).
 */
export default [
  ...reactConfig,
  {
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*.{ts,tsx}"],
      "boundaries/ignore": ["**/*.spec.ts", "**/*.test.ts"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "core", pattern: "src/core/*", capture: ["family"] },
        { type: "entities", pattern: "src/entities/*", capture: ["family"] },
        { type: "features", pattern: "src/features/*", capture: ["family"] },
        { type: "shared", pattern: "src/shared/*", capture: ["family"] },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message: "{{file.type}} may not import {{dependency.type}} ({{dependency.source}}) — see apps/docs/conventions/structure-web.md",
          policies: [
            {
              from: { element: { type: "core" } },
              allow: [
                { to: { element: { type: "shared" } } },
                { to: { element: { type: "core", captured: { family: "{{family}}" } } } },
              ],
            },
            {
              from: { element: { type: "entities" } },
              allow: [
                { to: { element: { type: "shared" } } },
                { to: { element: { type: "core" } } },
                { to: { element: { type: "entities", captured: { family: "{{family}}" } } } },
              ],
            },
            {
              from: { element: { type: "features" } },
              allow: [
                { to: { element: { type: "shared" } } },
                { to: { element: { type: "core" } } },
                { to: { element: { type: "entities" } } },
                { to: { element: { type: "features", captured: { family: "{{family}}" } } } },
              ],
            },
            {
              from: { element: { type: "app" } },
              allow: [
                { to: { element: { type: "shared" } } },
                { to: { element: { type: "core" } } },
                { to: { element: { type: "entities" } } },
                { to: { element: { type: "features" } } },
                { to: { element: { type: "app" } } },
              ],
            },
          ],
        },
      ],
      "boundaries/entry-point": [
        "error",
        {
          default: "disallow",
          message: "Import from {{dependency.type}}'s index.ts, not its internal files",
          rules: [{ target: ["core", "entities", "features", "shared"], allow: "index.{ts,tsx}" }],
        },
      ],
      "boundaries/no-unknown": "off",
      "boundaries/no-unknown-files": "off",
    },
  },
];
