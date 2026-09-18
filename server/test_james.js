/**
 * Automated Verification Test Suite for James AI Autonomous Community Agent
 */

const assert = require('assert');
const { createAIProvider, FallbackProvider } = require('./james/aiProvider');
const { WebResearch } = require('./james/webResearch');
const { MemoryService } = require('./james/memory');
const { SocialAwareness } = require('./james/social');
const { ModerationEngine } = require('./james/moderation');
const { ToolRegistry } = require('./james/tools');
const { DecisionEngine } = require('./james/decisionEngine');
const { JamesAgent, JAMES_PROFILE } = require('./james/agent');

async function runTests() {
  console.log('=== Starting James AI Automated Verification Test Suite ===\n');

  // Test 1: AI Provider & Fallback
  console.log('[Test 1]: Verifying AI Provider & Fallback Provider...');
  const fallback = new FallbackProvider();
  const res1 = await fallback.chatCompletion([
    { role: 'user', content: 'Who are you?' }
  ]);
  assert(res1 && res1.content, 'Fallback should return a message content');
  assert(res1.content.includes('James'), 'Fallback response should introduce as James');
  assert(!res1.content.toLowerCase().includes('real person'), 'Fallback must NOT claim to be a real human');
  console.log('✓ AI Provider & Transparent Identity verified.');

  // Test 2: Web Research & Search
  console.log('\n[Test 2]: Verifying WebResearch (DuckDuckGo Search & Fetch)...');
  const webResearch = new WebResearch();
  const searchResults = await webResearch.search('Node.js javascript runtime', 3);
  console.log(`  Received ${searchResults.length} search results from web.`);
  if (searchResults.length > 0) {
    assert(searchResults[0].url, 'Search result should have a URL');
    assert(searchResults[0].snippet || searchResults[0].title, 'Search result should have title or snippet');
  }
  const pageResult = await webResearch.fetchUrl('https://example.com');
  assert(pageResult && (pageResult.title || pageResult.content), 'Page fetch should retrieve content');
  console.log('✓ WebResearch search and fetch verified.');

  // Test 3: Memory Service
  console.log('\n[Test 3]: Verifying MemoryService (History, Topics, User Memory)...');
  const memory = new MemoryService({ maxHistory: 10 });
  memory.addMessage({ id: 1, alias: 'Alice', userId: 'user_123', text: "I'm building a weather dashboard with React." });
  memory.addMessage({ id: 2, alias: 'James', userId: 'bot_james', text: "Nice! What weather API are you planning to use?" });
  memory.addMessage({ id: 3, alias: 'Alice', userId: 'user_123', text: "Open-Meteo." });

  const history = memory.getFormattedHistoryForLLM();
  assert.strictEqual(history.length, 3, 'Should format 3 history messages');
  assert.strictEqual(history[0].role, 'user');
  assert.strictEqual(history[1].role, 'assistant');

  // User memory note
  memory.saveUserNote('user_123', 'Alice', 'Building weather dashboard with React and Open-Meteo');
  const userMem = memory.getUserMemory('user_123', 'Alice');
  assert(userMem, 'User memory should be retrieved');
  assert(userMem.notes.includes('Building weather dashboard with React and Open-Meteo'), 'Saved note should match');
  console.log('✓ MemoryService multi-turn and user-specific context verified.');

  // Test 4: Social Awareness
  console.log('\n[Test 4]: Verifying SocialAwareness Modes...');
  let mockUserCount = 0;
  const social = new SocialAwareness(() => mockUserCount);
  assert.strictEqual(social.getSocialState().mode, 'DORMANT', '0 users should be DORMANT');

  mockUserCount = 1;
  assert.strictEqual(social.getSocialState().mode, 'COMPANION', '1 user should be COMPANION');

  mockUserCount = 3;
  assert.strictEqual(social.getSocialState().mode, 'PARTICIPANT', '3 users should be PARTICIPANT');

  mockUserCount = 8;
  assert.strictEqual(social.getSocialState().mode, 'OBSERVER', '8 users should be OBSERVER');
  console.log('✓ SocialAwareness modes (DORMANT, COMPANION, PARTICIPANT, OBSERVER) verified.');

  // Test 5: Moderation Engine (Deterministic Detection & AI Actions)
  console.log('\n[Test 5]: Verifying Moderation Engine (Flood & Duplicate Detection)...');
  const mod = new ModerationEngine();
  const spamUser = { userId: 'spammer_1', alias: 'Spammy', text: 'Spam text' };

  // Rapid flood test
  mod.checkDeterministicViolation(spamUser);
  mod.checkDeterministicViolation(spamUser);
  const v1 = mod.checkDeterministicViolation(spamUser);
  assert(v1.violation, 'Duplicate spam (3 times identical) should be flagged');
  assert.strictEqual(v1.type, 'duplicate');

  // AI warn action
  const warnRes = mod.warnUser('Spammy', 'Flooding chat');
  assert(warnRes.success, 'warnUser should succeed');
  assert.strictEqual(warnRes.warningCount, 1);
  console.log('✓ Moderation Engine deterministic filters and AI actions verified.');

  // Test 6: Tool Registry Schema & Execution
  console.log('\n[Test 6]: Verifying ToolRegistry Definitions and Execution...');
  const tools = new ToolRegistry({
    webResearch,
    memoryService: memory,
    socialAwareness: social,
    moderationEngine: mod,
    getOnlineUsersList: () => [{ alias: 'Alice', status: 'Online', isVerified: true }]
  });

  const defs = tools.getDefinitions();
  assert(defs.length >= 8, 'Should expose at least 8 tools');
  assert(defs.some(d => d.function.name === 'web_search'), 'web_search tool must be present');
  assert(defs.some(d => d.function.name === 'get_site_state'), 'get_site_state tool must be present');
  assert(defs.some(d => d.function.name === 'warn_user'), 'warn_user tool must be present');

  const siteStateJson = await tools.executeTool('get_site_state', {});
  const siteState = JSON.parse(siteStateJson);
  assert(siteState.mode, 'Site state should include mode');
  console.log('✓ ToolRegistry schema and execution verified.');

  // Test 7: Decision Engine
  console.log('\n[Test 7]: Verifying Decision Engine...');
  const decisionEngine = new DecisionEngine({
    socialAwareness: social,
    moderationEngine: mod
  });

  // Direct mention
  const d1 = decisionEngine.evaluate({ alias: 'Bob', text: 'Hey @James, can you help me?' });
  assert.strictEqual(d1.action, 'RESPOND');
  assert.strictEqual(d1.isDirect, true);

  // Encrypted message (must be ignored)
  const d2 = decisionEngine.evaluate({ alias: 'Bob', text: 'U2FsdGVkX1...', encrypted: true });
  assert.strictEqual(d2.action, 'IGNORE');
  assert.strictEqual(d2.reason, 'encrypted_payload');

  // Self message (must be ignored)
  const d3 = decisionEngine.evaluate({ alias: 'James', userId: 'bot_james', text: 'Hello' });
  assert.strictEqual(d3.action, 'IGNORE');
  console.log('✓ Decision Engine evaluates mentions, encryption, and self-messages correctly.');

  // Test 8: End-to-End JamesAgent Pipeline
  console.log('\n[Test 8]: Verifying JamesAgent End-to-End Pipeline...');
  const sentMessages = [];
  const emittedEvents = [];

  const mockIo = {
    emit: (event, payload) => {
      emittedEvents.push({ event, payload });
    }
  };

  const agent = new JamesAgent(mockIo, (msg) => {
    sentMessages.push(msg);
  }, {
    getUserCount: () => 1
  });

  assert.strictEqual(agent.profile.alias, 'James');
  assert(agent.profile.bio.includes('community member'), 'Profile bio must declare community member identity');

  // Welcome user test
  agent.welcomeUser('Charlie', 'socket_charles_1', 'user_charles');
  await new Promise(resolve => setTimeout(resolve, 2600));
  assert(sentMessages.some(m => m.alias === 'James' && m.text.includes('Charlie')), 'James should send welcome message to Charlie');

  // Direct question to James
  const questionMsg = {
    id: 101,
    alias: 'Charlie',
    userId: 'user_charles',
    text: '@James what is the purpose of useEffect cleanup in React?'
  };

  agent.handleUserMessage(questionMsg);
  // Wait for debounce (1400ms) + typing delay (~2200ms)
  await new Promise(resolve => setTimeout(resolve, 4800));

  const answers = sentMessages.filter(m => m.alias === 'James' && m.text.toLowerCase().includes('react'));
  assert(answers.length > 0, 'James should have generated a helpful answer about React');
  console.log('  James reply sample:', answers[0].text.substring(0, 80) + '...');
  console.log('✓ JamesAgent end-to-end conversation, welcoming, and typing verified.');

  // Test 9: Tool Calling Execution Loop
  console.log('\n[Test 9]: Verifying AI Provider Tool Calling Loop...');
  let toolCallExecuted = false;
  const mockToolProvider = {
    chatCompletion: async (msgs, tools) => {
      // First turn: model requests web_search tool call
      if (!msgs.some(m => m.role === 'tool')) {
        return {
          content: null,
          toolCalls: [{
            id: 'call_mock_1',
            type: 'function',
            function: {
              name: 'get_site_state',
              arguments: '{}'
            }
          }]
        };
      }
      // Second turn: model receives tool output and provides answer
      toolCallExecuted = true;
      const toolMsg = msgs.find(m => m.role === 'tool');
      return {
        content: `Current community mode is ${JSON.parse(toolMsg.content).mode}.`
      };
    }
  };

  agent.aiProvider = mockToolProvider;
  const testMsgs = [{ role: 'user', content: 'What is the current site state?' }];
  const loopResult = await agent.executeAILoop(testMsgs);
  const loopText = typeof loopResult === 'object' && loopResult ? loopResult.content : loopResult;
  assert(toolCallExecuted, 'Tool call should have been executed in loop');
  assert(loopText.includes('Current community mode'), 'Model should synthesize tool response');
  console.log('  Synthesized tool output:', loopText);
  console.log('✓ Tool Calling Loop verified successfully.');

  console.log('\n=== ALL 9 VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test failure:', err);
  process.exit(1);
});
