import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';

export interface UploadResponse {
  id: string;
}

export interface ProcessResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class DifyService {
  private readonly apiKey = 'Bearer app-3l2yJBxafYta2TTNJAyC3OQ0';
  private readonly baseUrl = 'https://api.dify.ai/v1';

  constructor(private http: HttpClient) {}

  uploadFile(file: File, user: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', user);

    const headers = new HttpHeaders({
      'Authorization': this.apiKey
    });

    return this.http.post<UploadResponse>(`${this.baseUrl}/files/upload`, formData, { headers });
  }

  processDocuments(fileIds: string[], query: string, user: string): Observable<ProcessResponse> {
    const headers = new HttpHeaders({
      'Authorization': this.apiKey,
      'Content-Type': 'application/json'
    });

    const workflowBody = {
      inputs: {
        document: fileIds.length === 1 ? {
          transfer_method: 'local_file',
          upload_file_id: fileIds[0],
          type: 'document'
        } : fileIds.map(id => ({
          transfer_method: 'local_file',
          upload_file_id: id,
          type: 'document'
        })),
        query: query
      },
      response_mode: 'blocking',
      user: user
    };

    return this.http.post<ProcessResponse>(`${this.baseUrl}/workflows/run`, workflowBody, { headers });
  }

  /**
   * Send document to external API with fallback strategies
   * Adapted from the React component's external API service
   */
  public sendDocumentToExternalApi(
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
      
      // 1. Upload the file to Dify
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('user', user);

      const uploadRes = await fetch(`${this.baseUrl}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
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
          'Authorization': this.apiKey,
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
            'Authorization': this.apiKey,
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
              'Authorization': this.apiKey,
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
}