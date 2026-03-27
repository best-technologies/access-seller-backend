function parseCommaEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export default () => ({
  appName: process.env.APP_NAME || 'DefaultAppName',
  port: parseInt(process.env.PORT || '3000', 10),
  /**
   * Comma-separated developer emails — any feature (A-Vendor, etc.) can treat these as trusted
   * bootstrap accounts (e.g. bypass platform gates in dev). Parsed lowercase.
   */
  developerBootstrapEmails: parseCommaEmails(process.env.DEVELOPER_BOOTSTRAP_EMAILS),
});