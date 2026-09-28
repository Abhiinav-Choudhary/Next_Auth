
import jwt from "jsonwebtoken";

export function verifyAccessToken(request) {
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    // Reject refresh tokens used as access tokens
    if (payload.type !== "access" || !payload.userId) {
      return null;
    }

    return payload;
  } catch {
    // Invalid or expired token
    return null;
  }
}