import { v2 as cloudinary } from "cloudinary";

const FALLBACK_CLOUD_NAME = "dbfkavpxa";
const FALLBACK_API_KEY = "498137587259741";
const FALLBACK_API_SECRET = "Jxxwumb3uemykHkXtfVdSzRMqxw";

function cleanEnvValue(value) {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/^['"]+|['"]+$/g, "").trim();
}

function resolveCloudName() {
  const raw = cleanEnvValue(
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  );
  if (!raw) return FALLBACK_CLOUD_NAME;

  // A valid Cloudinary cloud_name contains only alphanumeric characters, hyphens, or underscores.
  // If a full URL or malformed path with "/" was accidentally set in production env vars,
  // Cloudinary returns a 404 HTML page ("Unexpected token '<', <!DOCTYPE...").
  if (/^[a-zA-Z0-9_-]+$/.test(raw)) {
    return raw;
  }

  // Try extracting cloud_name if someone pasted a Cloudinary URL like https://res.cloudinary.com/<cloud_name>/...
  const urlMatch = raw.match(/cloudinary\.com\/(?:v1_1\/)?([a-zA-Z0-9_-]+)/i);
  if (urlMatch?.[1]) {
    console.warn(
      `[Cloudinary] Extracted cloud_name "${urlMatch[1]}" from URL-formatted env var.`
    );
    return urlMatch[1];
  }

  console.warn(
    `[Cloudinary] Invalid cloud_name in environment ("${raw}"). Falling back to default cloud_name.`
  );
  return FALLBACK_CLOUD_NAME;
}

const cloudName = resolveCloudName();
const apiKey =
  cleanEnvValue(process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY) ||
  FALLBACK_API_KEY;
const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET) || FALLBACK_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
