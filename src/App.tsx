import { useState, useRef, useEffect } from "react";
import { Message } from "./types/chat";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { loadMessages, saveMessages } from "./utils/storage";
import { streamChatResponse } from "./utils/api";
import type { PerformanceMetrics } from "./utils/api";
import "./App.css";

/**
 * 채팅 애플리케이션의 메인 컴포넌트
 */
function App() {
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBuffering, setUseBuffering] = useState(true);
  const [lastMetrics, setLastMetrics] = useState<PerformanceMetrics | null>(null);
  
  // 현재 스트리밍 중인 메시지를 위한 ref
  const currentMessageRef = useRef<Message>({ role: "assistant", content: "" });

  // 메시지가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  /**
   * 성능 측정 결과 처리
   */
  const handleMetrics = (metrics: PerformanceMetrics) => {
    setLastMetrics(metrics);
    console.log('Performance Metrics:', {
      '첫 응답까지 걸린 시간': `${metrics.firstChunkTime}ms`,
      '전체 응답 시간': `${metrics.totalTime}ms`,
      '총 청크 수': metrics.chunkCount,
      '실제 업데이트 횟수': metrics.updateCount,
      '평균 청크 간격': `${Math.round(metrics.averageChunkInterval)}ms`,
      '버퍼링 사용': metrics.useBuffering ? '예' : '아니오'
    });
  };

  /**
   * 채팅 메시지 전송 및 응답 처리
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
        setMessages(prev => prev.slice(0, -1));
      },
      handleMetrics,
      useBuffering
    );

    setIsLoading(false);
  };

  /**
   * 모든 메시지 삭제
   */
  const handleClearMessages = () => {
    setMessages([]);
    saveMessages([]);
    setLastMetrics(null);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-left">
          <h1>GPT 채팅</h1>
          <label className="buffering-toggle">
            <input
              type="checkbox"
              checked={useBuffering}
              onChange={(e) => setUseBuffering(e.target.checked)}
              disabled={isLoading}
            />
            버퍼링 사용
          </label>
        </div>
        <button 
          onClick={handleClearMessages}
          className="clear-button"
          disabled={isLoading || messages.length === 0}
        >
          대화 내용 지우기
        </button>
      </div>
      {lastMetrics && (
        <div className="metrics-panel">
          <h3>마지막 응답 성능</h3>
          <div className="metrics-grid">
            <div>첫 응답: {lastMetrics.firstChunkTime}ms</div>
            <div>총 시간: {lastMetrics.totalTime}ms</div>
            <div>청크 수: {lastMetrics.chunkCount}</div>
            <div>업데이트: {lastMetrics.updateCount}회</div>
            <div>평균 간격: {Math.round(lastMetrics.averageChunkInterval)}ms</div>
            <div>버퍼링: {lastMetrics.useBuffering ? '사용' : '미사용'}</div>
          </div>
        </div>
      )}
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
