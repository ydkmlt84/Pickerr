"use client";
/**
 * plex.tv Authentication
 * See - https://forums.plex.tv/t/authenticating-with-plex/609370
 */

const APP_NAME = "MovieMatch";

const getClientId = (): string | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("plexClientId");
  if (stored) return stored;

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const clientId = Array.from({ length: 30 })
    .map(() => characters[Math.floor(Math.random() * characters.length)])
    .join("");

  localStorage.setItem("plexClientId", clientId);
  return clientId;
};

export class PlexPINExpiredError extends Error {}

export interface PlexPIN {
  id: string;
  code: string;
  authToken: string | null;
  expiresAt: string;
}

export const signIn = async () => {
  if (typeof window === "undefined") return;

  const clientId = getClientId();
  if (!clientId) return;

  const pinReq = await fetch(`https://plex.tv/api/v2/pins`, {
    method: "POST",
    headers: {
      accept: "application/json",
    },
    body: new URLSearchParams({
      strong: "true",
      "X-Plex-Product": APP_NAME,
      "X-Plex-Client-Identifier": clientId,
    }),
  });

  if (pinReq.ok) {
    const pin: PlexPIN = await pinReq.json();
    localStorage.setItem("plexTvPin", JSON.stringify(pin));

    const search = new URLSearchParams({
      clientID: clientId,
      code: pin.code,
      "context[device][product]": APP_NAME,
      forwardUrl: location.href,
    });

    location.href = `https://app.plex.tv/auth#?${String(search)}`;
  }
};

export const verifyPin = async (pin: PlexPIN) => {
  if (typeof window === "undefined") return null;

  const clientId = getClientId();
  if (!clientId) return null;

  if (Number(new Date(pin.expiresAt)) > Date.now() && !pin.authToken) {
    const search = new URLSearchParams({
      strong: "true",
      "X-Plex-Client-Identifier": clientId,
      code: pin.code,
    });

    const req = await fetch(
      `https://plex.tv/api/v2/pins/${pin.id}?${String(search)}`,
      {
        headers: {
          accept: "application/json",
        },
      }
    );

    if (!req.ok) {
      throw new Error(`${req.status}: ${await req.text()}`);
    }

    const data: PlexPIN = await req.json();

    if (!data.authToken) {
      throw new Error("Login failed...");
    } else {
      localStorage.removeItem("plexTvPin");
      localStorage.setItem("plexToken", data.authToken);
    }

    return {
      clientId,
      token: data.authToken,
    };
  } else {
    throw new PlexPINExpiredError();
  }
};

export const getLogin = (): { pin: PlexPIN } | { token: string; clientId: string } | null => {
  if (typeof window === "undefined") return null;

  const clientId = getClientId();
  if (!clientId) return null;

  const token = localStorage.getItem("plexToken");
  const pinRaw = localStorage.getItem("plexTvPin");

  if (token) return { token, clientId };
  if (pinRaw) return { pin: JSON.parse(pinRaw) };
  return null;
};
