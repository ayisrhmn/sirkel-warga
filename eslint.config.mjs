import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Dependency rules between layers (see docs/ARCHITECTURE.md). Imports only
// point "down": templates -> organisms -> molecules -> atoms, and components
// never touch data access.
const dataAccess = {
  group: ["@/lib/db", "@/lib/queries/*", "@/lib/auth", "@/app/*"],
  message: "Components are presentational: fetch data in a page and pass it down as props.",
};
const layer = (...forbidden) => ({
  group: forbidden.map((name) => `@/components/${name}/*`),
  message: "Atomic design: a layer may only import from the layers below it.",
});
const restrict = (files, ...patterns) => ({
  files,
  rules: { "no-restricted-imports": ["error", { patterns }] },
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  restrict(["src/components/atoms/**"], dataAccess, layer("molecules", "organisms", "templates")),
  restrict(["src/components/molecules/**"], dataAccess, layer("organisms", "templates")),
  restrict(["src/components/organisms/**"], dataAccess, layer("templates")),
  restrict(["src/components/templates/**"], dataAccess),
  // Pages and layouts compose; reading the database is the job of lib/queries.
  restrict(["src/app/**/page.tsx", "src/app/**/layout.tsx"], {
    group: ["@/lib/db"],
    message: "Read data through a function in src/lib/queries instead of querying in a page.",
  }),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
