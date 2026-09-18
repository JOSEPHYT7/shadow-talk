/**
 * Social Awareness Engine for James Agent.
 * Understands room dynamics: 0 users (dormant), 1 user (companion),
 * 2-4 users (participant), 5+ users (quiet observer).
 */

class SocialAwareness {
  constructor(getUserCountFn) {
    this.getUserCount = getUserCountFn || (() => 1);
    this.lastJamesSpokeTime = 0;
    this.lastRoomMessageTime = Date.now();
    this.lastSpontaneousTime = 0;
    this.recentMessageTimestamps = [];
  }

  /**
   * Record that a room message occurred.
   */
  recordMessage() {
    const now = Date.now();
    this.lastRoomMessageTime = now;
    this.recentMessageTimestamps.push(now);

    // Keep only last 2 minutes of timestamps for velocity calculation
    const twoMinutesAgo = now - 120000;
    this.recentMessageTimestamps = this.recentMessageTimestamps.filter(t => t > twoMinutesAgo);
  }

  /**
   * Record that James spoke.
   */
  recordJamesSpoke() {
    const now = Date.now();
    this.lastJamesSpokeTime = now;
  }

  /**
   * Get messages per minute over the last 2 minutes.
   */
  getMessageVelocity() {
    const count = this.recentMessageTimestamps.length;
    return (count / 2).toFixed(1); // msgs per minute
  }

  /**
   * Evaluate the social mode of the room.
   * Modes:
   * - 'DORMANT': 0 users online.
   * - 'COMPANION': Exactly 1 user online. James acts as a warm, responsive, non-intrusive companion.
   * - 'PARTICIPANT': 2 to 4 users. James is naturally conversational when relevant.
   * - 'OBSERVER': 5+ users or high velocity. James observes quietly and only intervenes when mentioned or asked.
   */
  getSocialState() {
    const now = Date.now();
    const userCount = typeof this.getUserCount === 'function' ? this.getUserCount() : 1;
    const quietSeconds = Math.floor((now - this.lastRoomMessageTime) / 1000);
    const jamesQuietSeconds = Math.floor((now - this.lastJamesSpokeTime) / 1000);
    const velocity = parseFloat(this.getMessageVelocity());

    let mode = 'PARTICIPANT';
    if (userCount <= 0) {
      mode = 'DORMANT';
    } else if (userCount === 1) {
      mode = 'COMPANION';
    } else if (userCount >= 5 || velocity > 12) {
      mode = 'OBSERVER';
    } else {
      mode = 'PARTICIPANT';
    }

    return {
      mode,
      userCount,
      quietSeconds,
      jamesQuietSeconds,
      velocity
    };
  }

  /**
   * Determine if James should spontaneously chime in during long quiet periods.
   * Strict cooldowns applied.
   */
  canInitiateSpontaneous() {
    const now = Date.now();
    const state = this.getSocialState();

    if (state.mode === 'DORMANT') return false;

    // Must be quiet for at least 25 minutes
    if (state.quietSeconds < 25 * 60) return false;

    // James must not have spoken in the last 25 minutes
    if (state.jamesQuietSeconds < 25 * 60) return false;

    // Cooldown between spontaneous messages: at least 45 minutes
    if (now - this.lastSpontaneousTime < 45 * 60 * 1000) return false;

    this.lastSpontaneousTime = now;
    return true;
  }
}

module.exports = { SocialAwareness };
