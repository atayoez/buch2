import { createRemoteJWKSet, jwtVerify } from "jose";

// Keycloak aus docker-compose.yml: Realm, Client und Rollen siehe keycloak/javascript-realm.json
const baseUrl = process.env.KEYCLOAK_URL ?? "http://localhost:8880";
const realm = process.env.KEYCLOAK_REALM ?? "javascript";
export const clientId = process.env.KEYCLOAK_CLIENT_ID ?? "javascript-client";

const issuer = `${baseUrl}/realms/${realm}`;
const tokenUrl = `${issuer}/protocol/openid-connect/token`;

// Öffentliche Schlüssel von Keycloak: werden beim ersten Token geladen und von jose gecacht
const jwks = createRemoteJWKSet(new URL(`${issuer}/protocol/openid-connect/certs`));

type KeycloakPayload = {
  readonly resource_access?: Record<string, { readonly roles?: string[] }>;
};

/**
 * Signatur, Ablaufdatum und Aussteller eines Access Tokens prüfen.
 * @returns Die Rollen des Users beim Client "javascript-client"
 * @throws Fehler von jose, falls der Token ungültig oder abgelaufen ist
 */
export const verifyAccessToken = async (accessToken: string) => {
  const { payload } = await jwtVerify<KeycloakPayload>(accessToken, jwks, { issuer });
  return payload.resource_access?.[clientId]?.roles ?? [];
};

/**
 * Access Token mit Benutzername und Passwort bei Keycloak anfordern ("Direct Access Grant").
 * @returns Response von Keycloak, u.a. mit access_token, oder undefined bei falschen Login-Daten
 */
export const requestToken = async (username: string, password: string) => {
  const body = new URLSearchParams({
    grant_type: "password",
    username,
    password,
    client_id: clientId,
    client_secret: process.env.CLIENT_SECRET ?? "",
  });

  const response = await fetch(tokenUrl, { method: "POST", body });
  if (!response.ok) {
    return undefined;
  }
  return (await response.json()) as Record<string, unknown>;
};
