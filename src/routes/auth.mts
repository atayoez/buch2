import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { loginSchema } from "../schemas/auth.schema.ts";
import { requestToken } from "../security/keycloak.mts";
import { problemDetails, validationProblem } from "../utils/problem-details.mts";

export const authRouter = new Hono();

// POST: Access Token für Benutzername und Passwort von Keycloak holen
authRouter.post(
  "/token",
  zValidator("json", loginSchema, (result, c) => {
    if (!result.success) {
      return validationProblem(c, result.error);
    }
  }),
  async (c) => {
    const { username, password } = c.req.valid("json");

    const token = await requestToken(username, password);
    if (token === undefined) {
      return problemDetails(c, 401, "Unauthorized", "Benutzername oder Passwort ist falsch");
    }

    return c.json(token, 200);
  },
);
