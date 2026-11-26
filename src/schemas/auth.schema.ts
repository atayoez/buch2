// Zod-Schema für den Request-Body beim Login

import { z } from "zod";

// Validierung für den Login mit POST /auth/token
export const loginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});
