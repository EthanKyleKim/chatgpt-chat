import { Message } from '../types/chat';
import { ChatMessage } from './ChatMessage';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentMessage: Message;
}

/**
 * 채팅 메시지 목록을 표시하는 컴포넌트
 * @param messages - 메시지 배열
 * @param isLoading - 로딩 상태
 * @param error - 에러 메시지
 * @param currentMessage - 현재 스트리밍 중인 메시지
 */
export const ChatMessages = ({
  messages,
  isLoading,
  error,
  currentMessage
}: ChatMessagesProps) => {
  return (
    <div className="chat-messages">
      {messages.map((message, index) => (
        <ChatMessage key={index} message={message} />
      ))}
      {isLoading && !currentMessage.content && (
        <div className="message assistant">
          <div className="message-content">생각하는 중...</div>
        </div>
      )}
      {error && (
        <div className="message error">
          <div className="message-content">{error}</div>
        </div>
      )}
    </div>
  );
}; 