/**
 * SSRF (Server-Side Request Forgery) Defense Guard & URL Hasher
 * Validates external outbound URLs to prevent access to cloud metadata, local services,
 * loopback interfaces, and private subnet IP ranges.
 */

const dns = require('dns');
const crypto = require('crypto');

function isPrivateIpv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 100.64.0.0/10 (Carrier-Grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local, AWS/GCP/Azure Cloud Metadata: 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 – 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  return false;
}

function isPrivateIpv6(ip) {
  const norm = ip.toLowerCase();

  // Loopback & Unspecified
  if (norm === '::' || norm === '::1') return true;

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  if (norm.startsWith('::ffff:')) {
    const v4 = norm.replace('::ffff:', '');
    return isPrivateIpv4(v4);
  }

  // Unique Local Address (fc00::/7)
  if (norm.startsWith('fc') || norm.startsWith('fd')) return true;

  // Link-Local (fe80::/10)
  if (norm.startsWith('fe8') || norm.startsWith('fe9') || norm.startsWith('fea') || norm.startsWith('feb')) return true;

  return false;
}

function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  if (ip.includes(':')) {
    return isPrivateIpv6(ip);
  }
  return isPrivateIpv4(ip);
}

/**
 * Validates that a candidate target URL is safe to fetch:
 * - Only http: and https: protocols
 * - Resolves all DNS records to ensure no DNS rebinding to internal addresses
 * - Computes a deterministic SHA-256 hash for secure cache keying
 */
async function validateSafeExternalUrl(rawUrl, serverPort = 5000) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Invalid URL provided.');
  }

  let cleanUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'https://' + cleanUrl;
  }

  let parsed;
  try {
    parsed = new URL(cleanUrl);
  } catch (e) {
    throw new Error('Malformed URL syntax.');
  }

  // Disallow non-HTTP protocols (e.g., file:, gopher:, dict:, ftp:, data:)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Forbidden protocol: ${parsed.protocol}. Only http and https are allowed.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Explicit blacklist for cloud metadata & internal identifiers
  const blockedHostnames = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    'metadata.google.internal',
    'instance-data',
    'metadata'
  ];

  if (blockedHostnames.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error(`SSRF Guard: Prohibited hostname '${hostname}'. Access denied.`);
  }

  // Check if port targets this server's own listening port
  const targetPort = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  if (targetPort === serverPort || targetPort === 5173) {
    throw new Error(`SSRF Guard: Targeted port (${targetPort}) matches internal application port.`);
  }

  // Resolve hostname using DNS to prevent DNS rebinding
  try {
    const addresses = await dns.promises.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      throw new Error(`DNS resolution failed for hostname '${hostname}'.`);
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        throw new Error(`SSRF Guard: Host resolves to protected private IP address (${record.address}). Request blocked.`);
      }
    }
  } catch (dnsErr) {
    // If it's our own error, rethrow
    if (dnsErr.message.includes('SSRF Guard')) throw dnsErr;
    throw new Error(`Unable to resolve destination domain: ${dnsErr.message}`);
  }

  // Generate safe SHA-256 URL hash
  const urlHash = crypto.createHash('sha256').update(cleanUrl).digest('hex');

  return {
    safeUrl: cleanUrl,
    urlHash,
    hostname,
    protocol: parsed.protocol,
    port: targetPort
  };
}

module.exports = {
  isPrivateIp,
  validateSafeExternalUrl
};
