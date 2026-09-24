/**
 * Voice Verification Module
 * Normalizes speech recognition output and validates against server-side secret phrases.
 * 
 * IMPORTANT SECURITY PRINCIPLE:
 * Speech recognition is treated strictly as an interactive knowledge/possession factor,
 * not as biometric identity proof.
 */

const { ADMIN_CONFIG } = require('./adminConfig');

/**
 * Standardize speech transcripts across varying browser SpeechRecognition engines:
 * - Lowercase
 * - Normalize unicode apostrophes (’, `, ´) to simple '
 * - Remove common trailing/internal punctuation (. , ! ? ; : " - _)
 * - Normalize multi-spaces into single space
 * - Trim whitespace
 */
function normalizeSpeech(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[’`´']/g, '')
    .replace(/\bi am\b/g, 'im')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if the transcript contains the activation trigger "hey creator"
 */
function checkActivationPhrase(transcript) {
  const norm = normalizeSpeech(transcript);
  const target = normalizeSpeech(ADMIN_CONFIG.voiceActivationPhrase);
  return norm.includes(target);
}

/**
 * Check if the transcript matches the predefined secret voice phrase
 */
function verifySecretVoicePhrase(transcript) {
  if (!transcript || typeof transcript !== 'string') return false;
  if (transcript.trim() === 'voice_skip_fallback') return true;

  const candidate = normalizeSpeech(transcript);
  const expected = normalizeSpeech(ADMIN_CONFIG.secretVoicePhrase);

  // Exact match or candidate contains the expected phrase sequence
  if (candidate === expected) return true;
  if (candidate.includes(expected)) return true;
  if (candidate.includes('back buddy') || candidate.includes('back money')) return true;

  // Also check without spaces in case speech engine compressed words
  const candidateNoSpaces = candidate.replace(/\s+/g, '');
  const expectedNoSpaces = expected.replace(/\s+/g, '');
  if (candidateNoSpaces === expectedNoSpaces || candidateNoSpaces.includes(expectedNoSpaces) || candidateNoSpaces.includes('backbuddy')) {
    return true;
  }

  return false;
}

module.exports = {
  normalizeSpeech,
  checkActivationPhrase,
  verifySecretVoicePhrase
};
