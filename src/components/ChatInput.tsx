import { FormEvent } from 'react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
}

/**
 * 채팅 입력 폼 컴포넌트
 * @param input - 입력 필드의 현재 값
 * @param isLoading - 로딩 상태
 * @param onInputChange - 입력값 변경 핸들러
 * @param onSubmit - 폼 제출 핸들러
 */
export const ChatInput = ({
  input,
  isLoading,
  onInputChange,
  onSubmit
}: ChatInputProps) => {
  return (
    <form onSubmit={onSubmit} className="chat-input-form">
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="메시지를 입력하세요..."
        className="chat-input"
        disabled={isLoading}
      />
      <button type="submit" className="send-button" disabled={isLoading}>
        전송
      </button>
    </form>
  );
}; 