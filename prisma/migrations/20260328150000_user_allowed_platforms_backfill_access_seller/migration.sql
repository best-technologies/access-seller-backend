-- User: optional platform tags for segmentation (same enum as admin platforms).
ALTER TABLE "User" ADD COLUMN "allowedPlatformsForUser" "AllowedPlatformTypeForAdmin"[] NOT NULL DEFAULT ARRAY[]::"AllowedPlatformTypeForAdmin"[];

-- Existing rows: ensure Access Seller is present (append if missing; keeps any other platforms).
UPDATE "User"
SET "allowedPlatformsForUser" = array_append("allowedPlatformsForUser", 'access_seller'::"AllowedPlatformTypeForAdmin")
WHERE NOT ('access_seller'::"AllowedPlatformTypeForAdmin" = ANY("allowedPlatformsForUser"));
