# Saber

Self-paced learning platform that takes a learner from zero programming knowledge to publishing a
React Native app with Expo and EAS. Static site built with Vite, React and MDX; progress is stored
in the browser.

## Requirements

- Node.js 22
- pnpm 9

## Run

```bash
pnpm install
pnpm dev      # development server
pnpm check    # format check, lint, typecheck, tests, content validation, build
```

Every push to `main` deploys `dist/` to GitHub Pages through `.github/workflows/deploy.yml`
(enable Pages with the "GitHub Actions" source in the repository settings).
