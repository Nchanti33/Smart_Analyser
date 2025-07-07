// API Response Interfaces for Dify API

export interface FileUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

export interface DocumentProcessResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: any;
    error?: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface WorkflowInputs {
  [key: string]: any;
}
