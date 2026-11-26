# buch2

To install dependencies:

```bash
bun install
```

To run (HTTP/2 with TLS on https://localhost:3000; once before: `bun run tls:generate` for the
self-signed certificate in `tls/`):

```bash
bun run start
```

With curl: `curl --http2 -k https://localhost:3000/books`

To start PostgreSQL and Keycloak (once before: `cp .env.example .env`):

```bash
docker compose up
```

Keycloak runs at http://localhost:8880 (admin console: `admin` / `p`). On the first start the
realm `javascript` is imported from `keycloak/javascript-realm.json`: client `javascript-client`
(secret = `CLIENT_SECRET` in `.env`), client roles `admin` and `user`, users `admin` and `user`
(password `p`). To get an access token:

```bash
curl -X POST http://localhost:8880/realms/javascript/protocol/openid-connect/token -d grant_type=password -d username=admin -d password=p -d client_id=javascript-client -d client_secret=$(grep -oP '^CLIENT_SECRET=\K.*' .env)
```

To type check:

```bash
bun check
```

To generate the database:

```bash
bun run db:generate:migration
```

To migrate the database:

```bash
bun run db:migrate
```

To seed the database:

```bash
bun run db:seed
```

To see the database:

```bash
bun run db:studio
```

Run `bun fmt` to format the code.

This project was created using `bun init` in bun v1.4.5. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
