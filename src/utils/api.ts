import { Message } from '../types/chat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MAX_RETRIES = Number(import.meta.env.VITE_MAX_RETRIES) || 3;
const RETRY_DELAY = Number(import.meta.env.VITE_RETRY_DELAY) || 1000;

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
 */
export const streamChatResponse = async (
  messages: Message[],
  onChunk: (content: string) => void,
  onError: (error: string) => void
) => {
  let retries = 0;

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
        if (done) break;

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
                onChunk(parsed.content);
              }
            } catch (e) {
              console.error('Failed to parse chunk:', data, e);
            }
          }
        }
      }

      return; // 성공적으로 완료되면 함수 종료
    } catch (error) {
      retries++;
      console.error(`Error (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries === MAX_RETRIES) {
        onError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } else {
        await delay(RETRY_DELAY * retries); // 재시도 간격을 점진적으로 증가
      }
    }
  }
}; 