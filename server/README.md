# Server — Local dev

Run the server locally during development:

1. Copy env vars from root `.env.example` to `.env` and adjust `DATABASE_URL`.
2. Start Postgres for dev: `docker-compose -f ../docker-compose.dev.yml up -d`
3. From project root run:

```zsh
cd server
yarn install
yarn dev
```

The server will start on the port configured in `.env` (default 4000).
