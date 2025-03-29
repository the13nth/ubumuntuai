declare module '@langchain/langgraph-sdk/react-ui/types' {
  export interface Message {
    id: string;
    type: string;
    content: string;
  }

  export interface UIMessage {
    id: string;
    type: "ui";
    name: string;
    props: Record<string, unknown>;
    metadata: {
      [key: string]: unknown;
      run_id: string;
      message_id?: string;
    };
  }

  export interface Thread {
    messages: Message[];
  }
}

declare module '@langchain/langgraph-sdk/react' {
  export interface UseStreamResult<T> {
    thread: Thread;
    values: T;
  }

  export function useStream<T>(config: { apiUrl: string; assistantId: string }): UseStreamResult<T>;
} 