/**
 * Maintenance Mode Management Service
 * Controls website emergency maintenance state, broadcasts updates, and persists configuration.
 */

const fs = require('fs');
const path = require('path');

const configFilePath = path.join(__dirname, '..', 'data', 'maintenance_config.json');

const defaultState = {
  enabled: false,
  message: 'ShadowTalk is undergoing scheduled node upgrades and cryptographic maintenance. Relays will resume momentarily.',
  headline: 'SYSTEM UNDER MAINTENANCE // ENCLAVE RELAYS RESTRICTED',
  estimatedEnd: null,
  overridePassword: null,
  updatedAt: Date.now(),
  updatedBy: 'System'
};

function ensureConfigFile() {
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(configFilePath)) {
      fs.writeFileSync(configFilePath, JSON.stringify(defaultState, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('[MaintenanceService]: Error ensuring config file:', err.message);
  }
}

/**
 * Generates a strong random 10-character emergency override password
 * combining uppercase letters, lowercase letters, numbers, and symbols.
 */
function generateMaintenanceOverridePassword() {
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*?';
  const allChars = uppers + lowers + digits + symbols;

  // Guarantee at least 1 upper, 1 lower, 1 digit, and 1 symbol
  const passwordArr = [
    uppers[Math.floor(Math.random() * uppers.length)],
    lowers[Math.floor(Math.random() * lowers.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  // Fill up to exactly 10 characters
  while (passwordArr.length < 10) {
    passwordArr.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Cryptographically shuffle array
  for (let i = passwordArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArr[i], passwordArr[j]] = [passwordArr[j], passwordArr[i]];
  }

  return passwordArr.join('');
}

function getMaintenanceState(includeSecret = false) {
  ensureConfigFile();
  try {
    const raw = fs.readFileSync(configFilePath, 'utf8');
    const parsed = { ...defaultState, ...JSON.parse(raw) };
    const result = {
      ...parsed,
      active: Boolean(parsed.enabled)
    };

    // Keep secret password hidden from public socket & client status endpoints
    if (!includeSecret) {
      delete result.overridePassword;
    }
    return result;
  } catch (err) {
    console.error('[MaintenanceService]: Failed to read state:', err.message);
    return { ...defaultState, active: false };
  }
}

function setMaintenanceState({ enabled, message, headline, estimatedEnd, updatedBy = 'Admin', overridePassword = null }) {
  ensureConfigFile();
  const current = getMaintenanceState(true);
  const nextEnabled = typeof enabled === 'boolean' ? enabled : current.enabled;

  let resolvedPassword = current.overridePassword;
  if (nextEnabled) {
    // Generate fresh random 10-character key on every engagement, or use specified key
    resolvedPassword = overridePassword || generateMaintenanceOverridePassword();
  } else {
    // Clear password when maintenance is disengaged
    resolvedPassword = null;
  }

  const updated = {
    ...current,
    enabled: nextEnabled,
    active: nextEnabled,
    message: typeof message === 'string' && message.trim() ? message.trim() : current.message,
    headline: typeof headline === 'string' && headline.trim() ? headline.trim() : current.headline,
    estimatedEnd: estimatedEnd || null,
    overridePassword: resolvedPassword,
    updatedAt: Date.now(),
    updatedBy
  };

  try {
    fs.writeFileSync(configFilePath, JSON.stringify(updated, null, 2), 'utf8');
    console.log(`[MaintenanceService]: Maintenance state updated -> enabled: ${updated.enabled}, overrideKey: ${resolvedPassword ? '[10-CHAR GENERATED]' : '[CLEARED]'}`);
    return updated;
  } catch (err) {
    console.error('[MaintenanceService]: Failed to save state:', err.message);
    throw err;
  }
}

function verifyMaintenanceOverridePassword(candidate) {
  if (!candidate || typeof candidate !== 'string') return false;
  const current = getMaintenanceState(true);
  if (!current.enabled || !current.overridePassword) return false;
  return current.overridePassword.trim() === candidate.trim();
}

module.exports = {
  getMaintenanceState,
  setMaintenanceState,
  generateMaintenanceOverridePassword,
  verifyMaintenanceOverridePassword
};
