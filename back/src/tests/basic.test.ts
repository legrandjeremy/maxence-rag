import { describe, it, expect } from '@jest/globals';

describe('Basic Tests', () => {
  it('should pass this test', () => {
    expect(true).toBe(true);
  });
  
  it('should correctly add two numbers', () => {
    expect(2 + 2).toBe(4);
  });
}); 