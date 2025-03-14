import { Message } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_RETRIES = Number(import.meta.env.VITE_MAX_RETRIES) || 3;
const RETRY_DELAY = Number(import.meta.env.VITE_RETRY_DELAY) || 1000;
const UPDATE_INTERVAL = 100; // 100ms 간격으로 업데이트

export interface PerformanceMetrics {
  firstChunkTime: number;      // 첫 청크까지 걸린 시간
  totalTime: number;           // 전체 응답 시간
  chunkCount: number;          // 총 청크 수
  updateCount: number;         // 실제 업데이트 횟수
  averageChunkInterval: number;// 평균 청크 간격
  useBuffering: boolean;       // 버퍼링 사용 여부
}

/**
 * 지정된 시간만큼 대기합니다.
 * @param ms - 대기할 시간 (밀리초)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * API 요청에 대한 응답을 스트리밍으로 처리합니다.
 * @param messages - 채팅 메시지 배열
 * @param onChunk - 청크 데이터를 처리할 콜백 함수
 * @param onError - 에러를 처리할 콜백 함수
 * @param onMetrics - 성능 측정 데이터를 처리할 콜백 함수
 * @param useBuffering - 버퍼링 사용 여부
 */
export const streamChatResponse = async (
  messages: Message[],
  onChunk: (content: string) => void,
  onError: (error: string) => void,
  onMetrics?: (metrics: PerformanceMetrics) => void,
  useBuffering: boolean = true
) => {
  let retries = 0;
  let accumulatedContent = '';
  let lastUpdateTime = Date.now();

  // 성능 측정을 위한 변수들
  const startTime = Date.now();
  let firstChunkTime = 0;
  let chunkCount = 0;
  let updateCount = 0;
  let lastChunkTime = startTime;
  let totalChunkInterval = 0;

  const updateContent = () => {
    if (accumulatedContent) {
      onChunk(accumulatedContent);
      accumulatedContent = '';
      updateCount++;
    }
  };

  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('응답을 읽을 수 없습니다.');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          updateContent();
          // 성능 측정 데이터 전송
          if (onMetrics) {
            const totalTime = Date.now() - startTime;
            onMetrics({
              firstChunkTime,
              totalTime,
              chunkCount,
              updateCount,
              averageChunkInterval: chunkCount > 1 ? totalChunkInterval / (chunkCount - 1) : 0,
              useBuffering
            });
          }
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(5).trim();
            
            if (data === '[DONE]') continue;
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                // 첫 청크 시간 기록
                if (chunkCount === 0) {
                  firstChunkTime = Date.now() - startTime;
                } else {
                  // 청크 간격 측정
                  const currentTime = Date.now();
                  totalChunkInterval += currentTime - lastChunkTime;
                  lastChunkTime = currentTime;
                }
                chunkCount++;

                if (useBuffering) {
                  accumulatedContent += parsed.content;
                  const currentTime = Date.now();
                  if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
                    updateContent();
                    lastUpdateTime = currentTime;
                  }
                } else {
                  // 버퍼링 없이 즉시 업데이트
                  onChunk(parsed.content);
                  updateCount++;
                }
              }
            } catch (e) {
              console.error('Failed to parse chunk:', data, e);
            }
          }
        }
      }

      return;
    } catch (error) {
      retries++;
      console.error(`Error (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries === MAX_RETRIES) {
        onError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } else {
        await delay(RETRY_DELAY * retries);
      }
    }
  }
}; 