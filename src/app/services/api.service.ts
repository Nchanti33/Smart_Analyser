import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  FileUploadResponse,
  DocumentProcessResponse,
  WorkflowInputs,
} from './api.types';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = 'https://api.dify.ai/v1';
  private readonly authToken = 'app-3l2yJBxafYta2TTNJAyC3OQ0';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Generic POST request to Dify API
   * @param endpoint - API endpoint (without base URL)
   * @param data - Request body data
   * @returns Observable with response data
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    // console.log('🚀 Making POST request to:', `${this.baseUrl}${endpoint}`);
    // console.log('📤 Request payload:', JSON.stringify(data, null, 2));

    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap({
          next: (response) => {
            console.log('✅ API Response received:', response);
            //   if (
            //     response &&
            //     typeof response === 'object' &&
            //     'data' in response &&
            //     (response as any).data &&
            //     'outputs' in (response as any).data &&
            //     (response as any).data.outputs &&
            //     'Sortie' in (response as any).data.outputs &&
            //     (response as any).data.outputs.Sortie
            //   ) {
            //     console.log(
            //       '📥 Full response details:',
            //       JSON.stringify((response as any).data.outputs.Sortie, null, 2)
            //     );
            //   }
          },
          error: (error) => {
            console.error('❌ API Error:', error);
            console.error('🔍 Error details:', JSON.stringify(error, null, 2));
            if (error.error) {
              console.error(
                '🔍 Error body:',
                JSON.stringify(error.error, null, 2)
              );
            }
          },
        })
      );
  }

  /**
   * Upload document to Dify API
   * @param file - File to upload
   * @returns Observable with upload response
   */
  uploadDocument(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', 'user'); // Required user field

    // Headers for file upload (without Content-Type to let browser set it)
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`,
    });

    return this.http.post<FileUploadResponse>(
      `${this.baseUrl}/files/upload`,
      formData,
      {
        headers: headers,
      }
    );
  }

  /**
   * Process uploaded document using workflow
   * @param fileId - ID of the uploaded file
   * @param query - Optional query to process with the document
   * @returns Observable with processing response
   */
  processDocument(
    fileId: string,
    query: string = ''
  ): Observable<DocumentProcessResponse> {
    // console.log('🔄 Processing document with ID:', fileId);
    // console.log('📋 Query provided:', query);

    // Le workflow attend spécifiquement "Document_entree" comme un objet fichier
    const data = {
      inputs: {
        Document_entree: {
          transfer_method: 'local_file',
          upload_file_id: fileId,
          type: 'document',
        },
      },
      response_mode: 'blocking',
      user: 'user',
    };

    // console.log(
    //   '📤 Sending workflow request with payload:',
    //   JSON.stringify(data, null, 2)
    // );
    // console.log('🔑 File ID being sent:', fileId);

    return this.post<DocumentProcessResponse>('/workflows/run', data);
  }

  /**
   * Process document with specific variable name
   * @param fileId - ID of the uploaded file
   * @param variableName - The exact variable name from workflow configuration
   * @param additionalInputs - Any additional inputs for the workflow
   * @returns Observable with processing response
   */
  processDocumentWithVariableName(
    fileId: string,
    variableName: string,
    additionalInputs: { [key: string]: any } = {}
  ): Observable<DocumentProcessResponse> {
    const data = {
      inputs: {
        [variableName]: fileId,
        ...additionalInputs,
      },
      response_mode: 'blocking',
      user: 'user',
    };

    return this.post<DocumentProcessResponse>('/workflows/run', data);
  }

  /**
   * Simple test method to check workflow with minimal inputs
   * @param fileId - ID of the uploaded file
   * @returns Observable with processing response
   */
  testWorkflow(fileId: string): Observable<DocumentProcessResponse> {
    const data = {
      inputs: {},
      response_mode: 'blocking',
      user: 'user',
    };

    // console.log('Testing workflow with payload:', data);
    return this.post<DocumentProcessResponse>('/workflows/run', data);
  }

  /**
   * Get workflow parameters to understand input variables
   * @returns Observable with workflow parameters
   */
  getWorkflowParameters(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/parameters`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authToken}`,
      }),
    });
  }

  /**
   * Get application info to understand the workflow configuration
   * @returns Observable with app info
   */
  getAppInfo(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/info`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.authToken}`,
      }),
    });
  }

  /**
   * Process document with Dify's recommended file format
   * @param fileId - ID of the uploaded file
   * @param variableName - The workflow variable name for the file
   * @param query - Optional query
   * @returns Observable with processing response
   */
  processDocumentWithFileFormat(
    fileId: string,
    variableName: string = 'Document_entree',
    query: string = ''
  ): Observable<DocumentProcessResponse> {
    // console.log('🔄 Processing document with file format');
    // console.log('🔑 File ID:', fileId);
    // console.log('📋 Variable name:', variableName);
    // console.log('📝 Query:', query);

    const data = {
      inputs: {
        [variableName]: {
          transfer_method: 'local_file',
          upload_file_id: fileId,
          type: 'document',
        },
      },
      response_mode: 'blocking',
      user: 'user',
    };

    // console.log(
    //   '📤 Sending workflow with file format:',
    //   JSON.stringify(data, null, 2)
    // );

    return this.post<DocumentProcessResponse>('/workflows/run', data);
  }
}
