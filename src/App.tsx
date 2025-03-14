import { useState, useRef, useEffect } from "react";
import { Message } from "./types/chat";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { loadMessages, saveMessages } from "./utils/storage";
import { streamChatResponse } from "./utils/api";
import "./App.css";

/**
 * 채팅 애플리케이션의 메인 컴포넌트
 */
function App() {
  // 상태 관리
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 현재 스트리밍 중인 메시지를 위한 ref
  const currentMessageRef = useRef<Message>({ role: "assistant", content: "" });

  // 메시지가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  /**
   * 채팅 메시지 전송 및 응답 처리
   * @param e - 폼 제출 이벤트
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // 새로운 assistant 메시지 초기화
    currentMessageRef.current = { role: "assistant", content: "" };
    setMessages(prev => [...prev, currentMessageRef.current]);

    // API 호출 및 스트리밍 처리
    await streamChatResponse(
      [...messages, userMessage],
      (content) => {
        // 청크 데이터 처리
        currentMessageRef.current.content += content;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { ...currentMessageRef.current }
        ]);
      },
      (errorMessage) => {
        // 에러 처리
        setError(errorMessage);
        setMessages(prev => prev.slice(0, -1)); // 실패한 assistant 메시지 제거
      }
    );

    setIsLoading(false);
  };

  /**
   * 모든 메시지 삭제
   */
  const handleClearMessages = () => {
    setMessages([]);
    saveMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>GPT 채팅</h1>
        <button 
          onClick={handleClearMessages}
          className="clear-button"
          disabled={isLoading || messages.length === 0}
        >
          대화 내용 지우기
        </button>
      </div>
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        error={error}
        currentMessage={currentMessageRef.current}
      />
      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default App;
