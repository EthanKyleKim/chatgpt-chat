import { Message } from '../types/chat';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

/**
 * 개별 채팅 메시지를 표시하는 컴포넌트
 * @param message - 표시할 메시지 객체
 */
export const ChatMessage = ({ message }: ChatMessageProps) => {
  return (
    <div className={`message ${message.role}`}>
      <div className="message-content">
        <ReactMarkdown>{message.content}</ReactMarkdown>
      </div>
    </div>
  );
}; 