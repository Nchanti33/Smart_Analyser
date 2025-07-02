import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyConversationRequest {
  inputs: Record<string, any>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id?: string;
  user: string;
  files?: Array<{
    type: 'image' | 'document';
    transfer_method: 'remote_url' | 'local_file';
    url?: string;
    upload_file_id?: string;
  }>;
}

export interface DifyConversationResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  mode: string;
  answer: string;
  metadata: {
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    retriever_resources: any[];
  };
  created_at: number;
}

export interface DifyWorkflowRequest {
  inputs: Record<string, any>;
  response_mode: 'streaming' | 'blocking';
  user: string;
  files?: Array<{
    type: 'image' | 'document';
    transfer_method: 'remote_url' | 'local_file';
    url?: string;
    upload_file_id?: string;
  }>;
}

export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: 'running' | 'succeeded' | 'failed' | 'stopped';
    outputs: Record<string, any>;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DifyService {
  private readonly baseUrl = 'https://api.dify.ai/v1';
  private readonly defaultApiKey = 'app-3l2yJBxafYta2TTNJAyC3OQ0';

  constructor(private http: HttpClient) {}

  private getHeaders(apiKey?: string): HttpHeaders {
    const key = apiKey || this.defaultApiKey;
    return new HttpHeaders({
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Send a conversation message to a Dify chatbot
   */
  sendConversationMessage(
    request: DifyConversationRequest,
    apiKey?: string
  ): Observable<DifyConversationResponse> {
    const headers = this.getHeaders(apiKey);
    return this.http.post<DifyConversationResponse>(
      `${this.baseUrl}/chat-messages`,
      request,
      { headers }
    );
  }

  /**
   * Run a Dify workflow
   */
  runWorkflow(
    request: DifyWorkflowRequest,
    apiKey?: string
  ): Observable<DifyWorkflowResponse> {
    const headers = this.getHeaders(apiKey);
    return this.http.post<DifyWorkflowResponse>(
      `${this.baseUrl}/workflows/run`,
      request,
      { headers }
    );
  }

  /**
   * Get conversation messages
   */
  getConversationMessages(
    conversationId: string,
    user: string,
    firstId?: string,
    limit: number = 20,
    apiKey?: string
  ): Observable<any> {
    const headers = this.getHeaders(apiKey);
    let params = `user=${user}&limit=${limit}`;
    if (firstId) {
      params += `&first_id=${firstId}`;
    }
    
    return this.http.get(
      `${this.baseUrl}/messages?conversation_id=${conversationId}&${params}`,
      { headers }
    );
  }

  /**
   * Get conversations list
   */
  getConversations(
    user: string,
    lastId?: string,
    limit: number = 20,
    pinned?: boolean,
    apiKey?: string
  ): Observable<any> {
    const headers = this.getHeaders(apiKey);
    let params = `user=${user}&limit=${limit}`;
    if (lastId) {
      params += `&last_id=${lastId}`;
    }
    if (pinned !== undefined) {
      params += `&pinned=${pinned}`;
    }

    return this.http.get(
      `${this.baseUrl}/conversations?${params}`,
      { headers }
    );
  }

  /**
   * Rename a conversation
   */
  renameConversation(
    conversationId: string,
    name: string,
    user: string,
    apiKey?: string
  ): Observable<any> {
    const headers = this.getHeaders(apiKey);
    return this.http.post(
      `${this.baseUrl}/conversations/${conversationId}/name`,
      { name, user },
      { headers }
    );
  }

  /**
   * Delete a conversation
   */
  deleteConversation(
    conversationId: string,
    user: string,
    apiKey?: string
  ): Observable<any> {
    const headers = this.getHeaders(apiKey);
    return this.http.delete(
      `${this.baseUrl}/conversations/${conversationId}?user=${user}`,
      { headers }
    );
  }

  /**
   * Get application parameters
   */
  getApplicationParameters(user: string, apiKey?: string): Observable<any> {
    const headers = this.getHeaders(apiKey);
    return this.http.get(
      `${this.baseUrl}/parameters?user=${user}`,
      { headers }
    );
  }

  /**
   * Upload a file
   */
  uploadFile(file: File, user: string, apiKey?: string): Observable<any> {
    const key = apiKey || this.defaultApiKey;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${key}`
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);

    return this.http.post(
      `${this.baseUrl}/files/upload`,
      formData,
      { headers }
    );
  }

  /**
   * Get file upload status
   */
  getFileUploadStatus(fileId: string, user: string, apiKey?: string): Observable<any> {
    const headers = this.getHeaders(apiKey);
    return this.http.get(
      `${this.baseUrl}/files/${fileId}?user=${user}`,
      { headers }
    );
  }

  /**
   * Get workflow run status
   */
  getWorkflowRunStatus(
    workflowRunId: string,
    user: string,
    apiKey?: string
  ): Observable<any> {
    const headers = this.getHeaders(apiKey);
    return this.http.get(
      `${this.baseUrl}/workflows/run/${workflowRunId}?user=${user}`,
      { headers }
    );
  }

  /**
   * Stop a workflow run
   */
  stopWorkflowRun(
    workflowRunId: string,
    user: string,
    apiKey?: string
  ): Observable<any> {
    const headers = this.getHeaders(apiKey);
    return this.http.post(
      `${this.baseUrl}/workflows/run/${workflowRunId}/stop`,
      { user },
      { headers }
    );
  }

  /**
   * Get the default API key
   */
  getDefaultApiKey(): string {
    return this.defaultApiKey;
  }
}