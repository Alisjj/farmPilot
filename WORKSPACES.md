# Workspaces (pnpm)

We use pnpm workspaces to manage `client/`, `server/`, and `shared/` packages.

Quick start

1. Install pnpm (if not already):

```bash
npm install -g pnpm
```

2. Install dependencies for all workspaces from the repo root:

```bash
pnpm install
```

3. Run the server in development:

```bash
pnpm dev:server
```

4. Run the client in development:

```bash
pnpm dev:client
```

Notes

- Root `package.json` is configured as a workspace root. Individual workspace packages should have their own `package.json` files.
- We keep the file architecture consistent with `legacy/` so migrating code is incremental.
