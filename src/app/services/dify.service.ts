import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';

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

export interface DocumentProcessingRequest {
  query: string;
  user: string;
  files: Array<{
    type: 'document';
    transfer_method: 'local_file';
    upload_file_id: string;
  }>;
  inputs?: Record<string, any>;
  response_mode?: 'streaming' | 'blocking';
}

@Injectable({
  providedIn: 'root'
})
export class DifyService {
  private readonly baseUrl = 'https://api.dify.ai/v1';
  private readonly apiKey = 'app-3l2yJBxafYta2TTNJAyC3OQ0';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Send a conversation message to a Dify chatbot
   */
  sendConversationMessage(
    request: DifyConversationRequest
  ): Observable<DifyConversationResponse> {
    const headers = this.getHeaders();
    return this.http.post<DifyConversationResponse>(
      `${this.baseUrl}/chat-messages`,
      request,
      { headers }
    );
  }

  /**
   * Process documents with Dify API
   */
  processDocuments(
    fileIds: string[],
    query: string = 'Analysez ces documents et fournissez un résumé détaillé.',
    user: string
  ): Observable<DifyConversationResponse> {
    const request: DifyConversationRequest = {
      inputs: {},
      query: query,
      response_mode: 'blocking',
      user: user,
      files: fileIds.map(fileId => ({
        type: 'document' as const,
        transfer_method: 'local_file' as const,
        upload_file_id: fileId
      }))
    };

    return this.sendConversationMessage(request);
  }

  /**
   * Run a Dify workflow
   */
  runWorkflow(
    request: DifyWorkflowRequest
  ): Observable<DifyWorkflowResponse> {
    const headers = this.getHeaders();
    return this.http.post<DifyWorkflowResponse>(
      `${this.baseUrl}/workflows/run`,
      request,
      { headers }
    );
  }

  /**
   * Run workflow with documents
   */
  runWorkflowWithDocuments(
    fileIds: string[],
    inputs: Record<string, any> = {},
    user: string
  ): Observable<DifyWorkflowResponse> {
    const request: DifyWorkflowRequest = {
      inputs: inputs,
      response_mode: 'blocking',
      user: user,
      files: fileIds.map(fileId => ({
        type: 'document' as const,
        transfer_method: 'local_file' as const,
        upload_file_id: fileId
      }))
    };

    return this.runWorkflow(request);
  }

  /**
   * Send document to external API with fallback strategies
   * Adapté de la méthode externalApiService.ts
   */
  sendDocumentToExternalApi(
    file: File,
    user: string,
    workflowVarName: string
  ): Observable<any> {
    return from(this.sendDocumentToExternalApiAsync(file, user, workflowVarName));
  }

  private async sendDocumentToExternalApiAsync(
    file: File,
    user: string,
    workflowVarName: string
  ): Promise<any> {
    try {
      // 1. Upload the file to Dify
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('user', user);

      const uploadRes = await fetch(`${this.baseUrl}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: uploadForm,
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error('File upload failed:', errText);
        throw new Error('File upload failed: ' + errText);
      }

      const uploadData = await uploadRes.json();
      const fileId = uploadData.id;

      // 2. Run the workflow with the uploaded file using fallback strategies
      let workflowBody: any;
      let triedArray = false;
      let triedDirectId = false;
      let workflowRes: Response;
      let workflowResult: any;

      // Strategy 1: Try with single object (Dify doc alternative)
      workflowBody = {
        inputs: {
          [workflowVarName]: {
            transfer_method: 'local_file',
            upload_file_id: fileId,
            type: 'document',
          },
        },
        response_mode: 'blocking',
        user: user,
      };

      workflowRes = await fetch(`${this.baseUrl}/workflows/run`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowBody),
      });

      if (!workflowRes.ok) {
        const errText = await workflowRes.text();
        console.error('Workflow execution failed (single object):', errText);

        // Strategy 2: Try with array of objects
        workflowBody = {
          inputs: {
            [workflowVarName]: [
              {
                transfer_method: 'local_file',
                upload_file_id: fileId,
                type: 'document',
              },
            ],
          },
          response_mode: 'blocking',
          user: user,
        };

        triedArray = true;
        workflowRes = await fetch(`${this.baseUrl}/workflows/run`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflowBody),
        });

        if (!workflowRes.ok) {
          const errText2 = await workflowRes.text();
          console.error('Workflow execution failed (array of objects):', errText2);

          // Strategy 3: Try with direct fileId
          workflowBody = {
            inputs: {
              [workflowVarName]: fileId,
            },
            response_mode: 'blocking',
            user: user,
          };

          triedDirectId = true;
          workflowRes = await fetch(`${this.baseUrl}/workflows/run`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflowBody),
          });

          if (!workflowRes.ok) {
            const errText3 = await workflowRes.text();
            console.error('Workflow execution failed (direct fileId):', errText3);
            throw new Error('Workflow execution failed: ' + errText3);
          }
        }
      }

      workflowResult = await workflowRes.json();

      // Log which strategy worked
      if (triedDirectId) {
        console.log('Workflow succeeded with direct fileId strategy');
      } else if (triedArray) {
        console.log('Workflow succeeded with array of objects strategy');
      } else {
        console.log('Workflow succeeded with single object strategy');
      }

      return workflowResult;
    } catch (error) {
      console.error('sendDocumentToExternalApi error:', error);
      throw error;
    }
  }

  /**
   * Get conversation messages
   */
  getConversationMessages(
    conversationId: string,
    user: string,
    firstId?: string,
    limit: number = 20
  ): Observable<any> {
    const headers = this.getHeaders();
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
    pinned?: boolean
  ): Observable<any> {
    const headers = this.getHeaders();
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
    user: string
  ): Observable<any> {
    const headers = this.getHeaders();
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
    user: string
  ): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(
      `${this.baseUrl}/conversations/${conversationId}?user=${user}`,
      { headers }
    );
  }

  /**
   * Get application parameters
   */
  getApplicationParameters(user: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(
      `${this.baseUrl}/parameters?user=${user}`,
      { headers }
    );
  }

  /**
   * Upload a file
   */
  uploadFile(file: File, user: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`
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
  getFileUploadStatus(fileId: string, user: string): Observable<any> {
    const headers = this.getHeaders();
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
    user: string
  ): Observable<any> {
    const headers = this.getHeaders();
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
    user: string
  ): Observable<any> {
    const headers = this.getHeaders();
    return this.http.post(
      `${this.baseUrl}/workflows/run/${workflowRunId}/stop`,
      { user },
      { headers }
    );
  }
}