// The app that consumes this deep link ships in a later phase; the UI must say so.
export const MIN_APP_VERSION = '0.2';

// The app only accepts https, so the site refuses to generate anything else
// rather than producing a link that will be rejected after the app opens.
function requireHttpsUrl(packUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(packUrl);
  } catch {
    throw new Error(`pack url must be an absolute https url, received "${packUrl}"`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`pack url must use https, received "${parsed.protocol}"`);
  }
  // Return the parsed, normalized URL so this function emits precisely what it
  // validated — never the raw input, which could carry things (leading whitespace,
  // etc.) that URL silently strips during parsing.
  return parsed.toString();
}

export function buildInstallUrl(packUrl: string): string {
  return `agent-notifier://install?url=${encodeURIComponent(requireHttpsUrl(packUrl))}`;
}

// The command text lives here alone. The detail page must also render a command for
// a local http origin, and duplicating this template there would let the two drift.
export function formatCliCommand(packUrl: string): string {
  return `agent-notifier companion install ${packUrl}`;
}

export function buildCliCommand(packUrl: string): string {
  return formatCliCommand(requireHttpsUrl(packUrl));
}
