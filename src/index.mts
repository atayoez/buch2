import { readFile } from "node:fs/promises";
import { createSecureServer } from "node:http2";
import process from "node:process";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { authRouter } from "./routes/auth.mts";
import { booksRouter } from "./routes/books.mts";
import { problemDetails } from "./utils/problem-details.mts";

export const app = new Hono();

// Books-Routen registrieren
app.route("/books", booksRouter);

// Login: Access Token von Keycloak
app.route("/auth", authRouter);

// Unbekannte Pfade: Problem Details (RFC 9457) statt Text "404 Not Found"
app.notFound((c) => problemDetails(c, 404, "Not Found", `Der Pfad ${c.req.path} existiert nicht`));

// Alle nicht behandelten Fehler: Problem Details statt Text "Internal Server Error"
app.onError((err, c) => {
  // z.B. fehlerhaftes JSON im Request-Body
  if (err instanceof HTTPException) {
    return problemDetails(c, err.status, "Request Error", err.message);
  }

  console.error(err);
  return problemDetails(c, 500, "Internal Server Error", "Ein unerwarteter Fehler ist aufgetreten");
});

export const port = 3000;

// HTTP/2 gibt es nur mit TLS: selbst-signiertes Zertifikat, erzeugt durch "bun run tls:generate"
const tlsDir = new URL("../tls/", import.meta.url);

const readTlsFile = async (name: string) => {
  try {
    return await readFile(new URL(name, tlsDir), { encoding: "utf8" });
  } catch {
    console.error(`TLS-Datei tls/${name} fehlt: zuerst "bun run tls:generate" ausführen`);
    process.exit(1);
  }
};

const key = await readTlsFile("key.pem");
const cert = await readTlsFile("certificate.crt");

// Kein "export default app" und kein Bun.serve: Bun.serve kann nur HTTP/1.1.
// HTTP/2 durch node:http2, das auch von Bun unterstützt wird.
serve(
  {
    fetch: app.fetch,
    port,
    createServer: createSecureServer,
    serverOptions: {
      key,
      cert,
      // Bruno kann nur HTTP/1.1: https://github.com/usebruno/bruno/issues/1728
      allowHTTP1: true,
    },
  },
  (info) => {
    console.log(`Server läuft mit HTTP/2 auf https://localhost:${info.port}`);
  },
);
