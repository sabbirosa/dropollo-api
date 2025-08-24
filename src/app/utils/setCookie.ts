import { Response } from "express";
import { envVars } from "../config/env";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: envVars.NODE_ENV === "production",
      sameSite: "none",
    });
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: envVars.NODE_ENV === "production",
      sameSite: "none",
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  console.log("Server: Clearing auth cookies...");

  // Clear cookies with the same options used when setting them
  const cookieOptions = {
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: "none" as const,
    path: "/",
  };

  // Clear with path
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);

  // Clear without path for broader coverage
  const cookieOptionsNoPath = {
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: "none" as const,
  };

  res.clearCookie("accessToken", cookieOptionsNoPath);
  res.clearCookie("refreshToken", cookieOptionsNoPath);

  // Clear with different domain options for production
  if (envVars.NODE_ENV === "production") {
    const cookieOptionsWithDomain = {
      ...cookieOptions,
      domain: undefined, // Let the browser determine the domain
    };

    res.clearCookie("accessToken", cookieOptionsWithDomain);
    res.clearCookie("refreshToken", cookieOptionsWithDomain);
  }

  // Force expire cookies by setting them to past date
  const pastDate = new Date(0);
  res.cookie("accessToken", "", {
    expires: pastDate,
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: "none" as const,
    path: "/",
  });

  res.cookie("refreshToken", "", {
    expires: pastDate,
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: "none" as const,
    path: "/",
  });

  // Add cache control headers to prevent caching
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  console.log("Server: Auth cookies cleared");
};
