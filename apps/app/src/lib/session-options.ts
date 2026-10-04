export function sessionOptions(production: boolean, expiresIn: number) {
  return {
    name: production ? "__Host-rawan-session" : "rawan-session",
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(0, Math.min(expiresIn, 604800)),
  };
}
