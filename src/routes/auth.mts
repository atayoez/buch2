// REST-Schnittstelle für den Login:
// - POST /auth/token  Access Token für Benutzername und Passwort

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { loginSchema } from "../schemas/auth.schema.ts";
import { requestToken } from "../security/keycloak.mts";
import { problemDetails, validationProblem } from "../utils/problem-details.mts";

// Router für alle Pfade unterhalb von /auth, wird in index.mts registriert
export const authRouter = new Hono();

// POST: Access Token für Benutzername und Passwort von Keycloak holen
authRouter.post(
  "/token",
  // Validierung des Request-Bodys: 400 mit den Fehlern von Zod
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  async (c) => {
    const { username, password } = c.req.valid("json");

    // Login-Daten an Keycloak weiterreichen
    const token = await requestToken(username, password);
    if (token === undefined) {
      return problemDetails(c, 401, "Unauthorized", "Benutzername oder Passwort ist falsch");
    }

    // Response von Keycloak unverändert zurückgeben: access_token, expires_in, refresh_token, ...
    return c.json(token, 200);
  },
);
