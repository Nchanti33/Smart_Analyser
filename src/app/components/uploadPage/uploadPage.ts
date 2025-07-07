import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AnalysisDataService } from '../../services/analysis-data.service';
import { GlobalVariablesService } from '../../services/global-variables.service';
import { UploadState } from '../../types/upload.types';
import { UploadStatsComponent } from '../upload-stats/upload-stats.component';

interface UploadHistory {
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  success: boolean;
}

@Component({
  selector: 'app-upload-page',
  standalone: true,
  imports: [CommonModule, UploadStatsComponent],
  templateUrl: './uploadPage.html',
  styleUrl: './uploadPage.css',
})
export class UploadPageComponent {
  protected title = 'Smart Analyser';
  isLoading = false;
  uploadState: UploadState = { status: 'idle' };

  // Properties for retry functionality
  private lastFile: File | null = null;
  private lastFileId: string | null = null;
  private lastFileName: string | null = null;
  private isUploadError = false; // true if error during upload, false if error during processing

  // Properties from DocumentUploadComponent
  dragActive: boolean = false;
  file: File | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private analysisDataService: AnalysisDataService,
    private globalVars: GlobalVariablesService
  ) {
    // Initialize global variables
    this.initializeGlobalVariables();

    // Subscribe to errors from the analysis data service
    this.analysisDataService.error$.subscribe((error) => {
      if (error) {
        this.handleUploadError(error);
      }
    });
  }

  private initializeGlobalVariables(): void {
    // Initialize global variables for upload tracking
    this.globalVars.createArray<UploadHistory>('uploadHistory', []);
    this.globalVars.createNumber('totalUploads', 0);
    this.globalVars.createNumber('successfulUploads', 0);
    this.globalVars.createString('lastUploadedFile', '');
    this.globalVars.createString('currentUploadStatus', 'idle');

    console.log('✅ Global variables initialized');
  }

  onFileUpload(file: File): void {
    // Update global variables
    this.globalVars.increment('totalUploads');
    this.globalVars.setString('lastUploadedFile', file.name);
    this.globalVars.setString('currentUploadStatus', 'uploading');

    // Store retry data globally
    this.analysisDataService.setRetryData(file, null, null, true);

    this.lastFile = file; // Store file for retry
    this.isUploadError = true; // Assume upload error until processing starts
    this.isLoading = true;
    this.uploadState = {
      status: 'uploading',
      message: `Uploading ${file.name}...`,
    };

    // console.log('File uploaded:', file);

    // Upload the file to Dify API
    this.apiService.uploadDocument(file).subscribe({
      next: (response) => {
        // console.log('File uploaded successfully:', response);
        this.isUploadError = false; // Upload succeeded, so any future error is processing error

        // Update global status
        this.globalVars.setString('currentUploadStatus', 'processing');

        this.uploadState = {
          status: 'processing',
          message: 'Processing document...',
        };

        // If the upload was successful, process the document
        if (response.id) {
          this.lastFileId = response.id; // Store file ID for retry
          this.lastFileName = file.name; // Store file name for retry

          // Update global retry data
          this.analysisDataService.setRetryData(
            file,
            response.id,
            file.name,
            false
          );

          this.processUploadedDocument(response.id, file.name);
        } else {
          this.handleUploadError('Upload successful but no file ID returned');
        }
      },
      error: (error) => {
        console.error('Error uploading file:', error);

        // Handle different types of errors
        let errorMessage = 'Error uploading file. Please try again.';

        if (error.status === 413) {
          errorMessage = 'File too large. Please select a smaller file.';
        } else if (error.status === 415) {
          errorMessage =
            'File type not supported. Please select a PDF, DOCX, or TXT file.';
        } else if (error.status === 401) {
          errorMessage =
            'Authentication failed. Please check your API configuration.';
        } else if (error.status === 429) {
          errorMessage =
            'Too many requests. Please wait a moment before trying again.';
        }

        this.handleUploadError(errorMessage);
      },
    });
  }

  private processUploadedDocument(fileId: string, fileName: string): void {
    this.uploadState = {
      status: 'processing',
      message: 'Running workflow...',
    };

    // Set loading state in the analysis service (but don't navigate yet)
    this.analysisDataService.setLoading(true);
    this.analysisDataService.clearData();

    // console.log('=== WORKFLOW DEBUG INFO ===');
    // console.log('File ID:', fileId);
    // console.log('File Name:', fileName);
    // console.log('=========================');
    // console.log('Attempting workflow with file ID:', fileId);

    // Use the correct format directly
    this.apiService
      .processDocument(fileId, `Analyze the document: ${fileName}`)
      .subscribe({
        next: (response) => {
          // console.log('✅ Document processed successfully:', response);

          // Validate the response before proceeding
          if (!response || !response.data || !response.data.outputs) {
            this.handleWorkflowError({
              status: 200,
              message: 'Invalid response format from API',
              error: { message: 'Missing required data fields in response' },
            });
            return;
          }

          this.handleWorkflowSuccess(response);
        },
        error: (error) => {
          console.error('❌ Workflow failed:', error);
          this.analysisDataService.setLoading(false);
          this.handleWorkflowError(error);
        },
      });
  }

  private handleWorkflowSuccess(response: any): void {
    // Update global variables for successful upload
    this.globalVars.increment('successfulUploads');
    this.globalVars.setString('currentUploadStatus', 'success');

    // Add to upload history
    const history =
      this.globalVars.getArray<UploadHistory>('uploadHistory') || [];
    const newEntry: UploadHistory = {
      fileName: this.lastFileName || 'Unknown',
      fileSize: this.lastFile?.size || 0,
      uploadDate: new Date(),
      success: true,
    };
    this.globalVars.appendToArray('uploadHistory', newEntry);

    this.uploadState = {
      status: 'success',
      message: 'Document analyzed successfully!',
      result: response,
    };
    this.isLoading = false;

    // Store the analysis result in the service
    this.analysisDataService.setAnalysisResult(response);
    this.analysisDataService.setLoading(false);

    console.log('✅ Document analysis completed!');
    console.log('� Global stats updated:', {
      totalUploads: this.globalVars.getNumber('totalUploads'),
      successfulUploads: this.globalVars.getNumber('successfulUploads'),
      historyCount: this.globalVars.getArray('uploadHistory')?.length,
    });

    // Navigate to analysis page AFTER receiving API response
    setTimeout(() => {
      this.router.navigate(['/analysis']);
    }, 500); // Small delay to show success message
  }

  private handleWorkflowError(error: any): void {
    // Update global variables for failed upload
    this.globalVars.setString('currentUploadStatus', 'error');

    // Add to upload history
    const history =
      this.globalVars.getArray<UploadHistory>('uploadHistory') || [];
    const newEntry: UploadHistory = {
      fileName: this.lastFileName || 'Unknown',
      fileSize: this.lastFile?.size || 0,
      uploadDate: new Date(),
      success: false,
    };
    this.globalVars.appendToArray('uploadHistory', newEntry);

    console.error('Error processing document:', error);
    console.error('Error details:', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message,
      url: error.url,
    });

    // Log the exact error response from the API
    if (error.error) {
      console.error('API Error Response:', error.error);
    }

    let errorMessage = 'Error processing document. Please try again.';

    if (error.status === 400) {
      errorMessage =
        'Invalid request. Please check if the workflow is configured correctly.';
      // Try to extract more specific error information
      if (error.error && error.error.message) {
        errorMessage += ` API says: ${error.error.message}`;
      }
    } else if (error.status === 401) {
      errorMessage = 'Authentication failed. Please check your API key.';
    } else if (error.status === 422) {
      errorMessage =
        'Invalid input parameters. The workflow may require different inputs.';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    }

    // Call handleUploadError to properly set the error state and show retry button
    this.handleUploadError(errorMessage);
  }

  private handleUploadError(message: string): void {
    console.log('🚨 handleUploadError called with message:', message);
    this.uploadState = {
      status: 'error',
      message: message,
    };
    this.isLoading = false;

    // Set global error state
    this.analysisDataService.setHasError(true);
    this.analysisDataService.setError(message);

    console.error('📢 Upload Error:', message);
    console.log('🚨 Upload state after error:', this.uploadState);

    // Don't auto-reset state to allow retry button to be shown
    // User can manually reset by trying again or using retry button
  }

  onReset(): void {
    this.uploadState = { status: 'idle' };
    this.lastFile = null;
    this.lastFileId = null;
    this.lastFileName = null;
    this.isUploadError = false;

    // Clear global error state and retry data
    this.analysisDataService.setHasError(false);
    this.analysisDataService.clearData();
  }

  onRetry(): void {
    if (this.isUploadError && this.lastFile) {
      // Retry the entire upload process
      this.onFileUpload(this.lastFile);
    } else if (!this.isUploadError && this.lastFileId && this.lastFileName) {
      // Retry only the processing step
      this.retryProcessing();
    }
  }

  private retryProcessing(): void {
    if (!this.lastFileId || !this.lastFileName) return;

    this.isLoading = true;
    this.uploadState = {
      status: 'processing',
      message: 'Retrying document processing...',
    };

    this.processUploadedDocument(this.lastFileId, this.lastFileName);
  }

  // Methods from DocumentUploadComponent
  handleDrag(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      this.dragActive = true;
    } else if (event.type === 'dragleave') {
      this.dragActive = false;
    }
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragActive = false;

    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      this.handleFile(target.files[0]);
    }
  }

  handleFile(file: File): void {
    this.file = file;
    this.onFileUpload(file);
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'file-pdf';
      case 'docx':
      case 'doc':
        return 'file-doc';
      default:
        return 'file-text';
    }
  }

  getFileIconColor(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'text-red-500';
      case 'docx':
      case 'doc':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }

  getFileSize(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  removeFile(): void {
    this.file = null;
    this.uploadState = { status: 'idle' };
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById(
      'file-upload'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  getDragClass(): string {
    let baseClass = 'upload-area';

    if (this.dragActive) {
      baseClass += ' drag-active';
    }

    if (this.file) {
      baseClass += ' has-file';
    }

    if (this.isLoading) {
      baseClass += ' loading';
    }

    return baseClass;
  }
}
