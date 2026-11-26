import { createMiddleware } from "hono/factory";

import { problemDetails } from "../utils/problem-details.mts";
import { verifyAccessToken } from "./keycloak.mts";

const bearerPrefix = "Bearer ";

/**
 * Middleware für geschützte Routen: der Request braucht im Header "Authorization" einen
 * gültigen Access Token von Keycloak, und der User muss eine der angegebenen Rollen haben.
 * - 401 Unauthorized: kein oder ungültiger Token
 * - 403 Forbidden: gültiger Token, aber keine passende Rolle
 */
export const rolesRequired = (...requiredRoles: string[]) =>
  createMiddleware(async (c, next) => {
    const authorization = c.req.header("Authorization");

    if (!authorization?.startsWith(bearerPrefix)) {
      c.header("WWW-Authenticate", "Bearer");
      return problemDetails(c, 401, "Unauthorized", "Access Token fehlt");
    }

    let roles: string[];
    try {
      roles = await verifyAccessToken(authorization.slice(bearerPrefix.length));
    } catch {
      c.header("WWW-Authenticate", 'Bearer error="invalid_token"');
      return problemDetails(c, 401, "Unauthorized", "Access Token ist ungültig oder abgelaufen");
    }

    if (!requiredRoles.some((role) => roles.includes(role))) {
      return problemDetails(
        c,
        403,
        "Forbidden",
        `Eine der Rollen ist erforderlich: ${requiredRoles.join(", ")}`,
      );
    }

    await next();
  });
