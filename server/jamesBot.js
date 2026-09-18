/**
 * JamesBot Adapter (Backward Compatibility Layer)
 * Bridges the legacy interface to the new autonomous JamesAgent architecture.
 */

const { JamesAgent, JAMES_PROFILE } = require('./james/agent');

class JamesBot extends JamesAgent {
  constructor(io, addMessageCallback, options = {}) {
    super(io, addMessageCallback, options);
  }
}

module.exports = {
  JamesBot,
  JamesAgent,
  JAMES_PROFILE
};
