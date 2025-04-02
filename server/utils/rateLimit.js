import { getRequestIP, setResponseStatus } from "h3";
import { getServerSession } from "#auth"; // Sidebase Auth.js

const requests = new Map();

export default async function rateLimit(event, maxRequests = 20, windowMs = 60 * 1000) {
  const session = await getServerSession(event);
  const userId = session?.user?.id || null;
  const ip = getRequestIP(event) || "unknown";
  const key = userId || ip; // Use user ID if logged in, otherwise fallback to IP
  const now = Date.now();

  // 🧹 Clean up old entries
  for (const [key, value] of requests) {
    if (now - value.timestamp > windowMs) {
      requests.delete(key);
    }
  }

  if (!requests.has(key)) {
    requests.set(key, { count: 1, timestamp: now });
  } else {
    const requestInfo = requests.get(key);

    if (now - requestInfo.timestamp < windowMs) {
      requestInfo.count++;
      if (requestInfo.count > maxRequests) {

        console.warn(`🚨 Rate limit exceeded for key: ${key} (IP: ${ip}, User ID: ${userId})`);

        // Set response status for rate limiting
        setResponseStatus(event, 429, "Too Many Requests");

        // Return a consistent error message so the frontend can handle it
        return {
          error: "Rate limit exceeded. Try again later.",
        };
      }
    } else {
      requests.set(key, { count: 1, timestamp: now });
    }
  }

  // Return no error message if rate limit is not exceeded
  return null;
}
