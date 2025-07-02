import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface DifyWorkflowRequest {
  inputs: Record<string, any>;
  response_mode: 'streaming' | 'blocking';
  user: string;
}

export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs?: any;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    total_steps?: number;
    created_at: number;
    finished_at?: number;
  };
}

export interface DifyStreamEvent {
  event: 'workflow_started' | 'node_started' | 'text_chunk' | 'node_finished' | 'workflow_finished' | 'tts_message' | 'tts_message_end' | 'ping';
  task_id: string;
  workflow_run_id: string;
  data: any;
}

export interface DifyFileUploadRequest {
  file: File;
  user: string;
  type?: string;
}

export interface DifyFileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

@Injectable({
  providedIn: 'root'
})
export class DifyService {
  private readonly baseUrl = 'https://api.dify.ai/v1';
  private apiKey = '';

  constructor() {}

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private getFileUploadHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  /**
   * Execute workflow in blocking mode
   */
  async executeWorkflow(request: DifyWorkflowRequest): Promise<DifyWorkflowResponse> {
    const response = await fetch(`${this.baseUrl}/workflows/run`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Execute workflow in streaming mode
   */
  executeWorkflowStream(request: DifyWorkflowRequest): Observable<DifyStreamEvent> {
    const subject = new Subject<DifyStreamEvent>();

    const streamRequest = {
      ...request,
      response_mode: 'streaming' as const
    };

    fetch(`${this.baseUrl}/workflows/run`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(streamRequest)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              subject.complete();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = line.slice(6); // Remove 'data: ' prefix
                  if (jsonData.trim()) {
                    const event = JSON.parse(jsonData) as DifyStreamEvent;
                    subject.next(event);
                  }
                } catch (parseError) {
                  console.warn('Failed to parse SSE data:', parseError);
                }
              }
            }
          }
        } catch (error) {
          subject.error(error);
        }
      };

      readStream();
    })
    .catch(error => {
      subject.error(error);
    });

    return subject.asObservable();
  }

  /**
   * Upload file for use in workflows
   */
  async uploadFile(request: DifyFileUploadRequest): Promise<DifyFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('user', request.user);
    
    if (request.type) {
      formData.append('type', request.type);
    }

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      headers: this.getFileUploadHeaders(),
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get workflow run details
   */
  async getWorkflowRun(workflowId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/workflows/run/${workflowId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Stop workflow execution (streaming mode only)
   */
  async stopWorkflow(taskId: string, user: string): Promise<{ result: string }> {
    const response = await fetch(`${this.baseUrl}/workflows/tasks/${taskId}/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ user })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get workflow logs
   */
  async getWorkflowLogs(params?: {
    keyword?: string;
    status?: 'succeeded' | 'failed' | 'stopped';
    page?: number;
    limit?: number;
    created_by_end_user_session_id?: string;
    created_by_account?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const url = `${this.baseUrl}/workflows/logs${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get application basic information
   */
  async getApplicationInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/info`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get application parameters information
   */
  async getApplicationParameters(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/parameters`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get application WebApp settings
   */
  async getApplicationSite(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/site`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}