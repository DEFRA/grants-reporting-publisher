import { neostandard, resolveIgnoresFromGitignore } from "neostandard";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  ...neostandard({
    env: ["node", "vitest"],
    ignores: [...resolveIgnoresFromGitignore()],
    noJsx: true,
    noStyle: true,
  }),
  eslintConfigPrettier,
];
