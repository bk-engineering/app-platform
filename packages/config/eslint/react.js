import reactHooks from "eslint-plugin-react-hooks";
import { baseConfig } from "./base.js";

/** @type {import("eslint").Linter.Config[]} */
export const reactConfig = [
  ...baseConfig,
  reactHooks.configs["recommended-latest"],
];

export default reactConfig;
