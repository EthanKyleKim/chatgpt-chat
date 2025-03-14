/**
 * 채팅 메시지의 역할을 정의하는 타입
 */
export type MessageRole = "user" | "assistant";

/**
 * 채팅 메시지의 구조를 정의하는 인터페이스
 */
export interface Message {
  role: MessageRole;
  content: string;
} 