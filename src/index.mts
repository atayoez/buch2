// Einstiegspunkt des Appservers:
// - Hono-Anwendung mit den Routern für /books und /auth
// - zentrale Fehlerbehandlung mit Problem Details (RFC 9457)
// - Start als HTTP/2-Server mit TLS
//
// Start: bun run start

// Node-Module, die auch von Bun unterstützt werden
import { readFile } from "node:fs/promises";
import { createSecureServer } from "node:http2";
import process from "node:process";

// Hono als Web-Framework, @hono/node-server als Adapter für node:http2
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

// Eigene Module: Router und Hilfsfunktion für Fehlermeldungen
import { authRouter } from "./routes/auth.mts";
import { booksRouter } from "./routes/books.mts";
import { problemDetails } from "./utils/problem-details.mts";

// Die Hono-Anwendung: daran werden alle Router und Fehlerbehandlungen registriert
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

  // Alles andere ist ein Programmierfehler oder z.B. ein DB-Ausfall:
  // im Server protokollieren, aber keine internen Details an den Client schicken
  console.error(err);
  return problemDetails(c, 500, "Internal Server Error", "Ein unerwarteter Fehler ist aufgetreten");
});

// Port, auf dem der Server Requests entgegennimmt
export const port = 3000;

// HTTP/2 gibt es nur mit TLS: selbst-signiertes Zertifikat, erzeugt durch "bun run tls:generate"
const tlsDir = new URL("../tls/", import.meta.url);

// Privaten Schlüssel bzw. Zertifikat als Text einlesen.
// Falls die Datei fehlt: verständliche Fehlermeldung und Abbruch statt Stacktrace
const readTlsFile = async (name: string) => {
  try {
    return await readFile(new URL(name, tlsDir), { encoding: "utf8" });
  } catch {
    console.error(`TLS-Datei tls/${name} fehlt: zuerst "bun run tls:generate" ausführen`);
    process.exit(1);
  }
};

// Top-Level await: erst weitermachen, wenn beide Dateien eingelesen sind
const key = await readTlsFile("key.pem");
const cert = await readTlsFile("certificate.crt");

// Kein "export default app" und kein Bun.serve: Bun.serve kann nur HTTP/1.1.
// HTTP/2 durch node:http2, das auch von Bun unterstützt wird.
serve(
  {
    // Jeder Request wird an die Hono-Anwendung weitergereicht
    fetch: app.fetch,
    port,
    // HTTP/2-Server mit TLS aus node:http2 statt des HTTP/1.1-Servers als Default
    createServer: createSecureServer,
    serverOptions: {
      key,
      cert,
      // Bruno kann nur HTTP/1.1: https://github.com/usebruno/bruno/issues/1728
      allowHTTP1: true,
    },
  },
  // Callback, sobald der Server gestartet ist
  (info) => {
    console.log(`Server läuft mit HTTP/2 auf https://localhost:${info.port}`);
  },
);
