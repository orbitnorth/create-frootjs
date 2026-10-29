/**
 * Template definition types for create-frootjs.
 */

export interface TemplateFileMap {
  [filePath: string]: string;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  generate: (projectName: string) => TemplateFileMap;
}

/** Common .gitignore for all templates */
export const COMMON_GITIGNORE = `# Dependencies
node_modules/
.pnpm-store/

# Build Output
dist/
*.tsbuildinfo

# Logs & Environment
*.log
.env
.env.local

# Editor
.vscode/
.idea/
.DS_Store
`;

/** Common tsconfig.json for all templates */
export const COMMON_TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "jsx": "react-jsx",
    "jsxImportSource": "frootjs"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;
