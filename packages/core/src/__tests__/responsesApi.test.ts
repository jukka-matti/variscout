import { describe, it, expect } from 'vitest';
import { ConversationHistory } from '../ai/responsesApi';

describe('ConversationHistory', () => {
  it('should accumulate messages alongside previous_response_id', () => {
    const history = new ConversationHistory();
    history.addUserMessage('What is the Cpk?');
    history.addAssistantMessage('The Cpk is 1.33', 'resp_abc123');

    expect(history.messages).toHaveLength(2);
    expect(history.previousResponseId).toBe('resp_abc123');
    expect(history.toFallbackInput()).toEqual([
      { role: 'user', content: 'What is the Cpk?' },
      { role: 'assistant', content: 'The Cpk is 1.33' },
    ]);
  });

  it('should track multiple turns', () => {
    const history = new ConversationHistory();
    history.addUserMessage('Hello');
    history.addAssistantMessage('Hi there', 'resp_1');
    history.addUserMessage('What is variation?');
    history.addAssistantMessage('Variation is...', 'resp_2');

    expect(history.messages).toHaveLength(4);
    expect(history.previousResponseId).toBe('resp_2');
  });

  it('should clear all state', () => {
    const history = new ConversationHistory();
    history.addUserMessage('test');
    history.addAssistantMessage('reply', 'resp_1');
    history.clear();

    expect(history.messages).toHaveLength(0);
    expect(history.previousResponseId).toBeNull();
    expect(history.toFallbackInput()).toEqual([]);
  });
});
