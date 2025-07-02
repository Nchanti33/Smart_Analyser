import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { tap } from 'rxjs/operators';

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
  private readonly baseUrl = '/api'; // Utilise le proxy local
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
    console.log('🚀 Sending conversation message:', request);
    
    return this.http.post<DifyConversationResponse>(
      `${this.baseUrl}/chat-messages`,
      request,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Conversation response received:', response);
      })
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

    console.log('📄 Processing documents with request:', request);
    return this.sendConversationMessage(request);
  }

  /**
   * Run a Dify workflow
   */
  runWorkflow(
    request: DifyWorkflowRequest
  ): Observable<DifyWorkflowResponse> {
    const headers = this.getHeaders();
    console.log('⚙️ Running workflow with request:', request);
    
    return this.http.post<DifyWorkflowResponse>(
      `${this.baseUrl}/workflows/run`,
      request,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Workflow response received:', response);
      })
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

    console.log('📄⚙️ Running workflow with documents:', request);
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
    console.log('📤 Starting document upload to external API:', {
      fileName: file.name,
      fileSize: file.size,
      user: user,
      workflowVarName: workflowVarName
    });
    
    return from(this.sendDocumentToExternalApiAsync(file, user, workflowVarName));
  }

  private async sendDocumentToExternalApiAsync(
    file: File,
    user: string,
    workflowVarName: string
  ): Promise<any> {
    try {
      console.log('📁 Step 1: Uploading file to Dify...');
      
      // 1. Upload the file to Dify via proxy
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
        console.error('❌ File upload failed:', errText);
        throw new Error('File upload failed: ' + errText);
      }

      const uploadData = await uploadRes.json();
      console.log('✅ File uploaded successfully:', uploadData);
      const fileId = uploadData.id;

      // 2. Run the workflow with the uploaded file using fallback strategies
      console.log('⚙️ Step 2: Running workflow with uploaded file...');
      
      let workflowBody: any;
      let triedArray = false;
      let triedDirectId = false;
      let workflowRes: Response;
      let workflowResult: any;

      // Strategy 1: Try with single object (Dify doc alternative)
      console.log('🔄 Strategy 1: Trying with single object...');
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

      console.log('📤 Workflow request body (Strategy 1):', workflowBody);

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
        console.error('❌ Workflow execution failed (single object):', errText);

        // Strategy 2: Try with array of objects
        console.log('🔄 Strategy 2: Trying with array of objects...');
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

        console.log('📤 Workflow request body (Strategy 2):', workflowBody);
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
          console.error('❌ Workflow execution failed (array of objects):', errText2);

          // Strategy 3: Try with direct fileId
          console.log('🔄 Strategy 3: Trying with direct fileId...');
          workflowBody = {
            inputs: {
              [workflowVarName]: fileId,
            },
            response_mode: 'blocking',
            user: user,
          };

          console.log('📤 Workflow request body (Strategy 3):', workflowBody);
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
            console.error('❌ Workflow execution failed (direct fileId):', errText3);
            throw new Error('Workflow execution failed: ' + errText3);
          }
        }
      }

      workflowResult = await workflowRes.json();
      console.log('✅ Workflow executed successfully:', workflowResult);

      // Log which strategy worked
      if (triedDirectId) {
        console.log('🎯 Workflow succeeded with direct fileId strategy');
      } else if (triedArray) {
        console.log('🎯 Workflow succeeded with array of objects strategy');
      } else {
        console.log('🎯 Workflow succeeded with single object strategy');
      }

      return workflowResult;
    } catch (error) {
      console.error('💥 sendDocumentToExternalApi error:', error);
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
    
    console.log('💬 Getting conversation messages:', { conversationId, user, firstId, limit });
    
    return this.http.get(
      `${this.baseUrl}/messages?conversation_id=${conversationId}&${params}`,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Conversation messages received:', response);
      })
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

    console.log('📋 Getting conversations:', { user, lastId, limit, pinned });

    return this.http.get(
      `${this.baseUrl}/conversations?${params}`,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Conversations received:', response);
      })
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
    console.log('✏️ Renaming conversation:', { conversationId, name, user });
    
    return this.http.post(
      `${this.baseUrl}/conversations/${conversationId}/name`,
      { name, user },
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Conversation renamed:', response);
      })
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
    console.log('🗑️ Deleting conversation:', { conversationId, user });
    
    return this.http.delete(
      `${this.baseUrl}/conversations/${conversationId}?user=${user}`,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Conversation deleted:', response);
      })
    );
  }

  /**
   * Get application parameters
   */
  getApplicationParameters(user: string): Observable<any> {
    const headers = this.getHeaders();
    console.log('⚙️ Getting application parameters for user:', user);
    
    return this.http.get(
      `${this.baseUrl}/parameters?user=${user}`,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Application parameters received:', response);
      })
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

    console.log('📤 Uploading file:', { fileName: file.name, fileSize: file.size, user });

    return this.http.post(
      `${this.baseUrl}/files/upload`,
      formData,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ File uploaded successfully:', response);
      })
    );
  }

  /**
   * Get file upload status
   */
  getFileUploadStatus(fileId: string, user: string): Observable<any> {
    const headers = this.getHeaders();
    console.log('📊 Getting file upload status:', { fileId, user });
    
    return this.http.get(
      `${this.baseUrl}/files/${fileId}?user=${user}`,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ File upload status received:', response);
      })
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
    console.log('📊 Getting workflow run status:', { workflowRunId, user });
    
    return this.http.get(
      `${this.baseUrl}/workflows/run/${workflowRunId}?user=${user}`,
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Workflow run status received:', response);
      })
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
    console.log('⏹️ Stopping workflow run:', { workflowRunId, user });
    
    return this.http.post(
      `${this.baseUrl}/workflows/run/${workflowRunId}/stop`,
      { user },
      { headers }
    ).pipe(
      tap(response => {
        console.log('✅ Workflow run stopped:', response);
      })
    );
  }
}