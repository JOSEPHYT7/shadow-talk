/**
 * Geolocation & IPStack Visitor Telemetry Service
 * Resolves visitor IP addresses to exact geographic coordinates using IPStack API with caching & fallback.
 * Automatically resolves real public host coordinates for local loopback/private sessions.
 */

const http = require('http');
const https = require('https');
const { ADMIN_CONFIG } = require('../admin/adminConfig');

// In-memory cache: ip -> geoData
const geoCache = new Map();

// Known mesh fallback coordinates if network lookups fail completely
const DEFAULT_GLOBAL_NODES = [
  { city: 'Zurich', country: 'Switzerland', countryCode: 'CH', lat: 47.3769, lon: 8.5417, flag: '🇨🇭', isp: 'Swisscom / Secure Relay 01', zip: '8001', timezone: 'Europe/Zurich' },
  { city: 'Reykjavik', country: 'Iceland', countryCode: 'IS', lat: 64.1466, lon: -21.9426, flag: '🇮🇸', isp: 'Verne Global / Mesh Node', zip: '101', timezone: 'Atlantic/Reykjavik' },
  { city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lon: 139.6503, flag: '🇯🇵', isp: 'NTT Comms / APAC Core', zip: '100-0001', timezone: 'Asia/Tokyo' },
  { city: 'Taipei', country: 'Taiwan', countryCode: 'TW', lat: 25.0330, lon: 121.5654, flag: '🇹🇼', isp: 'Chunghwa / Pacific Gateway', zip: '100', timezone: 'Asia/Taipei' },
  { city: 'Stockholm', country: 'Sweden', countryCode: 'SE', lat: 59.3293, lon: 18.0686, flag: '🇸🇪', isp: 'Telia Carrier / Baltic Ring', zip: '111 20', timezone: 'Europe/Stockholm' },
  { city: 'Berlin', country: 'Germany', countryCode: 'DE', lat: 52.5200, lon: 13.4050, flag: '🇩🇪', isp: 'Deutsche Telekom / EU Backbone', zip: '10115', timezone: 'Europe/Berlin' },
  { city: 'San Francisco', country: 'United States', countryCode: 'US', lat: 37.7749, lon: -122.4194, flag: '🇺🇸', isp: 'Cloudflare Edge Relay', zip: '94102', timezone: 'America/Los_Angeles' },
  { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lon: -0.1278, flag: '🇬🇧', isp: 'LINX / Atlantic Terminal', zip: 'SW1A', timezone: 'Europe/London' },
  { city: 'Singapore', country: 'Singapore', countryCode: 'SG', lat: 1.3521, lon: 103.8198, flag: '🇸🇬', isp: 'Singtel Sovereign Node', zip: '018989', timezone: 'Asia/Singapore' },
  { city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8688, lon: 151.2093, flag: '🇦🇺', isp: 'Telstra Oceanic Relay', zip: '2000', timezone: 'Australia/Sydney' }
];

function isPrivateIp(ip) {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '').trim();
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean) ||
    clean.startsWith('fc00:') ||
    clean.startsWith('fe80:')
  );
}

// Cached real host machine public geolocation (for dev/localhost testing)
let cachedHostLocation = null;
let lastHostLocationTime = 0;

/**
 * Resolves the server host machine's actual external public IP & geolocation
 */
async function getHostRealLocation() {
  if (cachedHostLocation && Date.now() - lastHostLocationTime < 3600000) {
    return cachedHostLocation;
  }

  return new Promise((resolve) => {
    const url = 'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query';
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.status === 'success' && parsed.lat && parsed.lon) {
            const loc = {
              ip: parsed.query,
              realPublicIp: parsed.query,
              city: parsed.city || 'Local Station',
              region: parsed.regionName || '',
              country: parsed.country || 'Global Node',
              countryCode: parsed.countryCode || 'UN',
              latitude: Number(parsed.lat),
              longitude: Number(parsed.lon),
              zip: parsed.zip || '',
              timezone: parsed.timezone || 'UTC',
              isp: parsed.isp || 'Local Autonomous System',
              org: parsed.org || parsed.isp || '',
              asn: parsed.as || '',
              flag: getFlagEmoji(parsed.countryCode),
              source: 'host-public-verified',
              isLocal: true,
              exactVerified: true
            };
            cachedHostLocation = loc;
            lastHostLocationTime = Date.now();
            resolve(loc);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Fetch IP location from IPStack
 */
async function queryIpStack(ip) {
  const apiKey = (process.env.IPSTACK_ACCESS_KEY || process.env.IPSTACK_API_KEY || ADMIN_CONFIG.ipstackApiKey || '').trim();
  if (!apiKey) return null;

  return new Promise((resolve) => {
    const url = `http://api.ipstack.com/${encodeURIComponent(ip)}?access_key=${apiKey}`;
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.latitude && parsed.longitude) {
            resolve({
              ip: parsed.ip || ip,
              city: parsed.city || 'Unknown City',
              region: parsed.region_name || '',
              country: parsed.country_name || 'Global Node',
              countryCode: parsed.country_code || 'UN',
              latitude: Number(parsed.latitude),
              longitude: Number(parsed.longitude),
              zip: parsed.zip || '',
              timezone: parsed.time_zone?.id || 'UTC',
              flag: parsed.location?.country_flag_emoji || getFlagEmoji(parsed.country_code),
              flagUrl: parsed.location?.country_flag || null,
              isp: parsed.connection?.isp || 'IPStack Verified ISP',
              org: parsed.connection?.isp || '',
              asn: parsed.connection?.asn ? `AS${parsed.connection.asn}` : '',
              source: 'ipstack',
              exactVerified: true
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Secondary Free Geolocation Fallback (ip-api.com) for real non-private IPs
 */
async function queryIpApi(ip) {
  return new Promise((resolve) => {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.status === 'success' && parsed.lat && parsed.lon) {
            resolve({
              ip: parsed.query || ip,
              city: parsed.city || 'Secure Enclave',
              region: parsed.regionName || '',
              country: parsed.country || 'Global Node',
              countryCode: parsed.countryCode || 'UN',
              latitude: Number(parsed.lat),
              longitude: Number(parsed.lon),
              zip: parsed.zip || '',
              timezone: parsed.timezone || 'UTC',
              flag: getFlagEmoji(parsed.countryCode),
              isp: parsed.isp || 'Autonomous System',
              org: parsed.org || parsed.isp || '',
              asn: parsed.as || '',
              source: 'ip-api',
              exactVerified: true
            });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Resolve IP to Geographic Details
 * @param {string} rawIp
 * @param {string} seedHint - Optional alias to create consistent synthetic coordinates for local IPs
 */
async function resolveIpLocation(rawIp, seedHint = '') {
  if (!rawIp) return null;
  const cleanIp = String(rawIp).replace(/^::ffff:/, '').trim();

  // Check cache first
  if (geoCache.has(cleanIp)) {
    return geoCache.get(cleanIp);
  }

  // Handle local / loopback addresses
  if (isPrivateIp(cleanIp)) {
    // 1. Try to resolve the host machine's actual real internet location!
    const realHost = await getHostRealLocation();
    if (realHost) {
      const localResult = {
        ...realHost,
        ip: `${realHost.ip} (Localhost / Master Relay)`,
        localIp: cleanIp,
        isCurrentAdmin: true
      };
      geoCache.set(cleanIp, localResult);
      return localResult;
    }

    // 2. Deterministic mesh node fallback
    let index = 0;
    if (seedHint) {
      for (let i = 0; i < seedHint.length; i++) {
        index = (index + seedHint.charCodeAt(i)) % DEFAULT_GLOBAL_NODES.length;
      }
    } else {
      index = Math.floor(Math.random() * DEFAULT_GLOBAL_NODES.length);
    }
    const node = DEFAULT_GLOBAL_NODES[index];
    const localResult = {
      ip: cleanIp === '127.0.0.1' || cleanIp === '::1' ? '127.0.0.1 (Localhost Node)' : cleanIp,
      city: node.city,
      region: 'Sovereign Enclave',
      country: node.country,
      countryCode: node.countryCode,
      latitude: node.lat,
      longitude: node.lon,
      zip: node.zip,
      timezone: node.timezone,
      flag: node.flag,
      isp: node.isp,
      org: node.isp,
      asn: 'AS-PRIVATE-RELAY',
      isLocal: true,
      source: 'local-mesh-relay',
      exactVerified: false
    };
    geoCache.set(cleanIp, localResult);
    return localResult;
  }

  // 1. Try IPStack API
  let result = await queryIpStack(cleanIp);

  // 2. Fallback to free ip-api.com if IPStack is unconfigured or rate limited
  if (!result) {
    result = await queryIpApi(cleanIp);
  }

  // 3. Fallback to default node if offline
  if (!result) {
    const node = DEFAULT_GLOBAL_NODES[0];
    result = {
      ip: cleanIp,
      city: node.city,
      country: node.country,
      countryCode: node.countryCode,
      latitude: node.lat,
      longitude: node.lon,
      zip: node.zip,
      timezone: node.timezone,
      flag: node.flag,
      isp: 'Encrypted Autonomous Node',
      org: 'Global Enclave Relay',
      asn: 'AS-RELAY-01',
      source: 'fallback',
      exactVerified: false
    };
  }

  geoCache.set(cleanIp, result);
  return result;
}

module.exports = {
  resolveIpLocation,
  isPrivateIp,
  getHostRealLocation,
  DEFAULT_GLOBAL_NODES
};
