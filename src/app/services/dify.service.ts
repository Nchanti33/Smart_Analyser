import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  
  // TODO: Replace with your actual workflow ID and variable names
  private readonly workflowId = 'your-workflow-id';
  private readonly workflowVarName = 'document';

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

    // Try different payload formats as in the original function
    const workflowBody = {
      inputs: {
        [this.workflowVarName]: fileIds.length === 1 ? {
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
}

// Keep the original function for backward compatibility if needed
export async function sendDocumentToExternalApi(
  file: File,
  user: string,
  workflowVarName: string,
  workflowId: string
): Promise<any> {
  try {
    // 1. Upload the file to Dify
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("user", user);
    const uploadRes = await fetch("https://api.dify.ai/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: "Bearer app-3l2yJBxafYta2TTNJAyC3OQ0",
      },
      body: uploadForm,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("File upload failed:", errText);
      throw new Error("File upload failed: " + errText);
    }
    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;

    // 2. Run the workflow with the uploaded file
    let workflowBody;
    let triedArray = false;
    let triedDirectId = false;
    let workflowRes, workflowResult;
    // Try with single object (Dify doc alternative)
    workflowBody = {
      inputs: {
        [workflowVarName]: {
          transfer_method: "local_file",
          upload_file_id: fileId,
          type: "document",
        },
      },
      response_mode: "blocking",
      user: user,
    };
    workflowRes = await fetch(`https://api.dify.ai/v1/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: "Bearer app-3l2yJBxafYta2TTNJAyC3OQ0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowBody),
    });
    if (!workflowRes.ok) {
      const errText = await workflowRes.text();
      console.error("Workflow execution failed (single object):", errText);
      // Try with array of object
      workflowBody = {
        inputs: {
          [workflowVarName]: [
            {
              transfer_method: "local_file",
              upload_file_id: fileId,
              type: "document",
            },
          ],
        },
        response_mode: "blocking",
        user: user,
      };
      triedArray = true;
      workflowRes = await fetch(`https://api.dify.ai/v1/workflows/run`, {
        method: "POST",
        headers: {
          Authorization: "Bearer app-3l2yJBxafYta2TTNJAyC3OQ0",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowBody),
      });
      if (!workflowRes.ok) {
        const errText2 = await workflowRes.text();
        console.error("Workflow execution failed (array of object):", errText2);
        // Try with direct fileId if second attempt fails
        workflowBody = {
          inputs: {
            [workflowVarName]: fileId,
          },
          response_mode: "blocking",
          user: user,
        };
        triedDirectId = true;
        workflowRes = await fetch(`https://api.dify.ai/v1/workflows/run`, {
          method: "POST",
          headers: {
            Authorization: "Bearer app-3l2yJBxafYta2TTNJAyC3OQ0",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflowBody),
        });
        if (!workflowRes.ok) {
          const errText3 = await workflowRes.text();
          console.error("Workflow execution failed (direct fileId):", errText3);
          throw new Error("Workflow execution failed: " + errText3);
        }
      }
    }
    workflowResult = await workflowRes.json();
    if (triedDirectId) {
      console.log("Succeeded with direct fileId");
    } else if (triedArray) {
      console.log("Succeeded with array of objects");
    } else {
      console.log("Succeeded with single object");
    }
    return workflowResult;
  } catch (error) {
    console.error("sendDocumentToExternalApi error:", error);
    throw error;
  }
}