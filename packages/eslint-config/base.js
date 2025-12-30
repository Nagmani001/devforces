import js from "@eslint/js";

// As suggested here : https://turborepo.com/docs/reference/eslint-config-turbo  
import turboConfig from 'eslint-config-turbo/flat';

import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [

  // As suggested here : https://turborepo.com/docs/reference/eslint-config-turbo  
  ...turboConfig,

  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    // As suggested here : https://turborepo.com/docs/reference/eslint-config-turbo  
    rules: {
      'turbo/no-undeclared-env-vars': [
        'error',
        {
          allowList: ['^ENV_[A-Z]+$'],
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
