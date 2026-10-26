import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getChatStorageKey,
  getStoredChatHistory,
  setStoredChatHistory,
  clearStoredChatHistory,
  sanitizeChatMessages,
  getStoredPracticeScenario,
  setStoredPracticeScenario,
} from '../src/utils/storage.js';

// Mock localStorage for Node test runner
const createMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
  };
};

const mockStorage = createMockStorage();
globalThis.localStorage = mockStorage;

test('1. Chat message persistence and restoration in localStorage', () => {
  mockStorage.clear();
  const userId = 'user_test_001';

  const sampleMessages = [
    {
      id: 'msg_1',
      role: 'user',
      content: 'How do you say "Water" in Kannada?',
      timestamp: '2026-10-25T10:00:00.000Z',
    },
    {
      id: 'msg_2',
      role: 'model',
      content: 'In Kannada, "Water" is "ನೀರು" (Nīru).',
      timestamp: '2026-10-25T10:00:02.000Z',
      model: 'gemini-3.5-flash-lite',
    },
  ];

  setStoredChatHistory(userId, 'chat', sampleMessages);

  const restored = getStoredChatHistory(userId, 'chat');
  assert.equal(restored.length, 2);
  assert.equal(restored[0].id, 'msg_1');
  assert.equal(restored[0].role, 'user');
  assert.equal(restored[0].content, 'How do you say "Water" in Kannada?');
  assert.equal(restored[1].id, 'msg_2');
  assert.equal(restored[1].role, 'model');
  assert.equal(restored[1].model, 'gemini-3.5-flash-lite');
  assert.equal(restored[1].content, 'In Kannada, "Water" is "ನೀರು" (Nīru).');
});

test('2. Ask Tutor and Conversation Practice histories remain completely separate', () => {
  mockStorage.clear();
  const userId = 'user_test_002';

  const chatMessages = [
    { id: 'c1', role: 'user', content: 'What is "Hegiddira"?' },
    { id: 'c2', role: 'model', content: '"Hegiddira" means "How are you?".' },
  ];

  const practiceMessages = [
    { id: 'p1', role: 'model', content: 'Namaskara! Coffee thagolra?' },
    { id: 'p2', role: 'user', content: 'Houdhu, ondu filter coffee kodi.' },
  ];

  setStoredChatHistory(userId, 'chat', chatMessages);
  setStoredChatHistory(userId, 'practice', practiceMessages);

  const restoredChat = getStoredChatHistory(userId, 'chat');
  const restoredPractice = getStoredChatHistory(userId, 'practice');

  assert.equal(restoredChat.length, 2);
  assert.equal(restoredChat[0].content, 'What is "Hegiddira"?');

  assert.equal(restoredPractice.length, 2);
  assert.equal(restoredPractice[0].content, 'Namaskara! Coffee thagolra?');

  // Verify separate localStorage keys
  const chatKey = getChatStorageKey(userId, 'chat');
  const practiceKey = getChatStorageKey(userId, 'practice');
  assert.notEqual(chatKey, practiceKey);
  assert.ok(mockStorage.getItem(chatKey));
  assert.ok(mockStorage.getItem(practiceKey));
});

test('3. Clearing Ask Tutor does not delete Conversation Practice, and vice versa', () => {
  mockStorage.clear();
  const userId = 'user_test_003';

  setStoredChatHistory(userId, 'chat', [{ id: 'c1', role: 'user', content: 'Hello' }]);
  setStoredChatHistory(userId, 'practice', [{ id: 'p1', role: 'user', content: 'Auto bekithu' }]);

  // Clear chat only
  clearStoredChatHistory(userId, 'chat');

  assert.deepEqual(getStoredChatHistory(userId, 'chat'), []);
  assert.equal(getStoredChatHistory(userId, 'practice').length, 1);
  assert.equal(getStoredChatHistory(userId, 'practice')[0].content, 'Auto bekithu');

  // Clear practice only
  clearStoredChatHistory(userId, 'practice');
  assert.deepEqual(getStoredChatHistory(userId, 'practice'), []);
});

test('4. User-specific storage isolation (User A vs User B vs Guest)', () => {
  mockStorage.clear();

  const userAlice = 'alice_uid_111';
  const userBob = 'bob_uid_222';

  // Guest stores messages
  setStoredChatHistory(null, 'chat', [{ id: 'g1', role: 'user', content: 'Guest question' }]);
  // Alice stores messages
  setStoredChatHistory(userAlice, 'chat', [{ id: 'a1', role: 'user', content: 'Alice private question' }]);
  // Bob stores messages
  setStoredChatHistory(userBob, 'chat', [{ id: 'b1', role: 'user', content: 'Bob private question' }]);

  const guestRestored = getStoredChatHistory(null, 'chat');
  const aliceRestored = getStoredChatHistory(userAlice, 'chat');
  const bobRestored = getStoredChatHistory(userBob, 'chat');

  assert.equal(guestRestored.length, 1);
  assert.equal(guestRestored[0].content, 'Guest question');

  assert.equal(aliceRestored.length, 1);
  assert.equal(aliceRestored[0].content, 'Alice private question');

  assert.equal(bobRestored.length, 1);
  assert.equal(bobRestored[0].content, 'Bob private question');

  // Verify keys are completely isolated
  assert.ok(getChatStorageKey(null, 'chat').includes('guest'));
  assert.ok(getChatStorageKey(userAlice, 'chat').includes('alice_uid_111'));
  assert.ok(getChatStorageKey(userBob, 'chat').includes('bob_uid_222'));
});

test('5. Safe recovery from missing, invalid, or corrupted localStorage data', () => {
  mockStorage.clear();
  const userId = 'corrupt_test_user';

  // Non-existent key
  assert.deepEqual(getStoredChatHistory(userId, 'chat'), []);

  // Corrupted raw JSON
  mockStorage.setItem(getChatStorageKey(userId, 'chat'), '{ invalid json [[[}}');
  assert.deepEqual(getStoredChatHistory(userId, 'chat'), []);

  // Valid JSON but non-array / non-message object
  mockStorage.setItem(getChatStorageKey(userId, 'chat'), JSON.stringify({ randomKey: 123 }));
  assert.deepEqual(getStoredChatHistory(userId, 'chat'), []);

  // Array of corrupt / non-object items
  mockStorage.setItem(
    getChatStorageKey(userId, 'chat'),
    JSON.stringify([null, 42, 'bad', { role: 'unknown' }, { content: '' }])
  );
  assert.deepEqual(getStoredChatHistory(userId, 'chat'), []);

  // Object wrapper with messages array
  mockStorage.setItem(
    getChatStorageKey(userId, 'chat'),
    JSON.stringify({ messages: [{ role: 'user', content: 'Recovered message' }] })
  );
  const recovered = getStoredChatHistory(userId, 'chat');
  assert.equal(recovered.length, 1);
  assert.equal(recovered[0].content, 'Recovered message');
  assert.equal(recovered[0].role, 'user');
});

test('6. Deduplication and message sanitization guarantees', () => {
  const rawList = [
    { id: 'dup_1', role: 'user', content: 'First message' },
    { id: 'dup_1', role: 'user', content: 'Duplicate message id' },
    { id: 'msg_valid', role: 'assistant', content: 'Assistant response' },
    { id: 'msg_no_role', content: 'No role' },
    { id: 'msg_empty', role: 'user', content: '   ' },
  ];

  const sanitized = sanitizeChatMessages(rawList);
  assert.equal(sanitized.length, 2);
  assert.equal(sanitized[0].id, 'dup_1');
  assert.equal(sanitized[0].content, 'First message');
  assert.equal(sanitized[1].id, 'msg_valid');
  assert.equal(sanitized[1].role, 'model'); // converted from assistant to model
  assert.equal(sanitized[1].content, 'Assistant response');
});

test('7. No secrets or private API keys stored in conversation history', () => {
  mockStorage.clear();
  const userId = 'security_test_user';

  const messagesWithSecrets = [
    {
      id: 'm1',
      role: 'user',
      content: 'Hello',
      apiKey: 'AIzaSySecret123',
      password: 'myPassword!',
      token: 'bearer-xyz',
    },
  ];

  setStoredChatHistory(userId, 'chat', messagesWithSecrets);
  const rawStored = mockStorage.getItem(getChatStorageKey(userId, 'chat'));

  assert.ok(!rawStored.includes('AIzaSySecret123'));
  assert.ok(!rawStored.includes('myPassword!'));
  assert.ok(!rawStored.includes('bearer-xyz'));

  const restored = getStoredChatHistory(userId, 'chat');
  assert.equal(restored[0].apiKey, undefined);
  assert.equal(restored[0].password, undefined);
  assert.equal(restored[0].token, undefined);
});

test('8. Practice scenario selection persistence', () => {
  mockStorage.clear();
  const userId = 'scenario_user';

  assert.equal(getStoredPracticeScenario(userId), null);

  setStoredPracticeScenario(userId, 'ordering_food');
  assert.equal(getStoredPracticeScenario(userId), 'ordering_food');

  setStoredPracticeScenario(userId, 'auto_rickshaw');
  assert.equal(getStoredPracticeScenario(userId), 'auto_rickshaw');

  // Guest scenario persistence
  setStoredPracticeScenario(null, 'asking_directions');
  assert.equal(getStoredPracticeScenario(null), 'asking_directions');
  assert.equal(getStoredPracticeScenario(userId), 'auto_rickshaw');
});
