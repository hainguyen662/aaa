## Build Commands

To build this project, run the following commands:

```bash
npm ci
npm install @docusaurus/theme-live-codeblock --save-exact
npm install remark-math rehype-katex katex
node scripts/create-search-index.js
npm run build
```

## Development

For local development:

```bash
npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## CI/CD Guideline 

### Deployment

Guideline: [CI/CD guideline](https://docs.google.com/document/d/1A1TvdZ_tL4CUelSHlkrNid-pWeQ_npozw_M7lsocvOU/edit)

Deploy to:

- **Non-Production** environment:
```
    deploy: stag
```

- **Production** environment:
```
    deploy: prod
```

## Documentation Management

### Creating Quick Navigation Links in intro.md

When adding new documentation files or reorganizing the structure, you need to update the **Interactive Documentation Tree** in `/docs/intro.md`. Here's how to create proper links:

#### Link Path Structure

**Basic format:**
```
[Display Name](./Category/Subfolder/Filename.md)
```

**Important rules:**

```
Spaces in folder/file names must be encoded as `%20`
Always start with `./` for relative paths
Case sensitive match exact folder/file names
Special characters like hyphens and parentheses are preserved
```

#### Examples

**File location:** `docs/Systems/Feed/Operations Manual.md`

**Link syntax:**
```
[Operations Manual](./Systems/Feed/Operations%20Manual.md)
```

**File location:** `docs/DevOps And Tooling/CI-CD GitLab/Setup GitLab and Runners.md`

**Link syntax:**
```
[Setup GitLab and Runners](./DevOps%20And%20Tooling/CI-CD%20GitLab/Setup%20GitLab%20and%20Runners.md)
```