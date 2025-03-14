import { Message } from '../types/chat';

const STORAGE_KEY = 'chat_messages';

/**
 * 로컬 스토리지에서 메시지 목록을 불러옵니다.
 * @returns 저장된 메시지 배열 또는 빈 배열
 */
export const loadMessages = (): Message[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return [];
  }
};

/**
 * 메시지 목록을 로컬 스토리지에 저장합니다.
 * @param messages - 저장할 메시지 배열
 */
export const saveMessages = (messages: Message[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
}; 