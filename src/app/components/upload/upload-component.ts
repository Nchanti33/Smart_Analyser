import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DifyService } from '../../services/dify.service';

interface UploadedFile {
  file: File;
  id?: string;
  status: 'uploading' | 'success' | 'error' | 'processing' | 'processed';
  progress: number;
  errorMessage?: string;
  analysisResult?: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-component.html',
  styleUrl: './upload-component.css'
})
export class UploadComponent {
  // File management
  uploadedFiles = signal<UploadedFile[]>([]);
  isDragOver = signal(false);
  isProcessing = signal(false);
  analysisResult = signal<string>('');

  // Configuration fields (matching React component)
  user = signal<string>('');
  workflowVarName = signal<string>('');
  workflowId = signal<string>('');

  private readonly allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  private readonly allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];

  constructor(private difyService: DifyService) {}

  // Method to get upload zone classes (matching React cn() function)
  getUploadZoneClasses(): string {
    const baseClasses = 'upload-zone-base';
    const dragClasses = this.isDragOver() && !this.hasUploadedFile() && !this.isProcessing() 
      ? 'border-primary bg-primary' 
      : 'border-muted-foreground';
    const fileClasses = this.hasUploadedFile() ? 'border-green-500 bg-green-500' : '';
    const loadingClasses = this.isProcessing() ? 'opacity-50 cursor-not-allowed' : '';
    
    return `${baseClasses} ${dragClasses} ${fileClasses} ${loadingClasses}`.trim();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    if (this.hasUploadedFile() || this.isProcessing()) {
      event.dataTransfer!.dropEffect = 'none';
      return;
    }
    
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    if (this.hasUploadedFile() || this.isProcessing()) {
      return;
    }
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelect(event: Event): void {
    if (this.hasUploadedFile() || this.isProcessing()) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);
    
    // Reset input value to allow selecting the same file again
    input.value = '';
  }

  private handleFiles(files: File[]): void {
    if (files.length === 0) return;

    // Take only the first file
    const file = files[0];
    
    console.log('📁 Handling file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    if (!this.isValidFile(file)) {
      const errorMsg = `Format de fichier non supporté: ${file.type}. Seuls les formats PDF, DOCX et TXT sont acceptés.`;
      console.error('❌ Invalid file type:', errorMsg);
      alert(errorMsg);
      return;
    }

    const uploadedFile: UploadedFile = {
      file,
      status: 'success', // Set directly to success for immediate processing
      progress: 100
    };

    console.log('✅ File validation passed');
    this.uploadedFiles.set([uploadedFile]);
  }

  private isValidFile(file: File): boolean {
    const isValidType = this.allowedTypes.includes(file.type);
    const hasValidExtension = this.allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    return isValidType || hasValidExtension;
  }

  handleFileUpload(): void {
    console.log('🤖 Starting document upload and processing...');
    
    // Validation des champs requis (matching React component requirements)
    if (!this.user().trim()) {
      alert('Please provide User field.');
      return;
    }

    if (!this.workflowVarName().trim()) {
      alert('Please provide Workflow Variable Name field.');
      return;
    }

    if (!this.workflowId().trim()) {
      alert('Please provide Workflow ID field.');
      return;
    }
    
    const successfulFiles = this.getSuccessfulUploads();
    if (successfulFiles.length === 0) {
      alert('Please select a file first.');
      return;
    }

    const file = successfulFiles[0].file;
    
    console.log('📄 Processing file with configuration:', {
      fileName: file.name,
      user: this.user(),
      workflowVarName: this.workflowVarName(),
      workflowId: this.workflowId()
    });

    this.isProcessing.set(true);
    this.analysisResult.set('');

    // Mark files as processing
    successfulFiles.forEach(file => {
      this.updateFileStatus(file, 'processing');
    });

    // Use the external API service function (matching React component behavior)
    this.difyService.sendDocumentToExternalApi(
      file,
      this.user(),
      this.workflowVarName()
    ).subscribe({
      next: (response: any) => {
        console.log('✅ Document processing successful:', response);
        this.isProcessing.set(false);
        
        // Extract the answer from the workflow response
        let analysisText = '';
        if (response.data && response.data.outputs) {
          const outputs = response.data.outputs;
          analysisText = outputs.text || outputs.result || outputs.answer || JSON.stringify(outputs, null, 2);
        } else {
          analysisText = JSON.stringify(response, null, 2);
        }
        
        this.analysisResult.set(analysisText);
        
        // Mark files as processed
        successfulFiles.forEach(file => {
          file.analysisResult = analysisText;
          this.updateFileStatus(file, 'processed');
        });
      },
      error: (error: any) => {
        console.error('❌ Document processing failed:', error);
        this.isProcessing.set(false);
        
        let errorMessage = 'Error sending document to external API';
        if (error.message) {
          errorMessage = error.message;
        }
        
        this.analysisResult.set(`Error: ${errorMessage}`);
        
        // Revert files to success status
        successfulFiles.forEach(file => {
          this.updateFileStatus(file, 'success');
        });
        
        console.error('Error sending document to external API:', errorMessage);
      }
    });
  }

  private updateFileStatus(
    uploadedFile: UploadedFile, 
    status: 'uploading' | 'success' | 'error' | 'processing' | 'processed',
    errorMessage?: string
  ): void {
    uploadedFile.status = status;
    if (errorMessage) {
      uploadedFile.errorMessage = errorMessage;
    }
    
    // Trigger change detection
    this.uploadedFiles.update(files => [...files]);
  }

  removeFile(): void {
    console.log('🗑️ Removing file');
    this.uploadedFiles.set([]);
    this.analysisResult.set('');
  }

  hasUploadedFile(): boolean {
    return this.uploadedFiles().length > 0;
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'docx':
      case 'doc':
        return '📝';
      case 'txt':
        return '📋';
      default:
        return '📁';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSuccessfulUploads(): UploadedFile[] {
    return this.uploadedFiles().filter(file => 
      file.status === 'success' || file.status === 'processing' || file.status === 'processed'
    );
  }

  canUpload(): boolean {
    return this.user().trim() !== '' && 
           this.workflowVarName().trim() !== '' && 
           this.workflowId().trim() !== '' &&
           this.hasUploadedFile() &&
           !this.isProcessing();
  }
}