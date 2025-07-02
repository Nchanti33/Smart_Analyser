import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DifyService } from '../../services/dify.service';

interface UploadedFile {
  file: File;
  id?: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload-component.html',
  styleUrl: './upload-component.css'
})
export class UploadComponent {
  apiKey = signal('');
  userId = signal('user-123');
  uploadedFiles = signal<UploadedFile[]>([]);
  isDragOver = signal(false);
  showApiKey = signal(false);

  private readonly allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  private readonly allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];

  constructor(private difyService: DifyService) {
    // Set the default API key from the service
    this.apiKey.set(this.difyService.getDefaultApiKey());
  }

  toggleApiKeyVisibility(): void {
    this.showApiKey.update(show => !show);
    
    // Update input type
    const input = document.getElementById('apiKey') as HTMLInputElement;
    if (input) {
      input.type = this.showApiKey() ? 'text' : 'password';
    }
  }

  onUploadZoneClick(): void {
    if (!this.apiKey() || !this.userId()) {
      alert('Veuillez d\'abord remplir la clé API et l\'identifiant utilisateur.');
      return;
    }
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onDragOver(event: DragEvent): void {
    if (!this.apiKey() || !this.userId()) {
      event.dataTransfer!.dropEffect = 'none';
      return;
    }
    
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    if (!this.apiKey() || !this.userId()) {
      alert('Veuillez d\'abord remplir la clé API et l\'identifiant utilisateur.');
      return;
    }
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelect(event: Event): void {
    if (!this.apiKey() || !this.userId()) {
      alert('Veuillez d\'abord remplir la clé API et l\'identifiant utilisateur.');
      return;
    }
    
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);
    
    // Reset input value to allow selecting the same file again
    input.value = '';
  }

  private handleFiles(files: File[]): void {
    const validFiles = files.filter(file => this.isValidFile(file));
    
    if (validFiles.length !== files.length) {
      alert('Certains fichiers ont été ignorés. Seuls les formats PDF, DOCX et TXT sont acceptés.');
    }

    validFiles.forEach(file => {
      const uploadedFile: UploadedFile = {
        file,
        status: 'uploading',
        progress: 0
      };

      this.uploadedFiles.update(files => [...files, uploadedFile]);
      this.uploadFile(uploadedFile);
    });
  }

  private isValidFile(file: File): boolean {
    const isValidType = this.allowedTypes.includes(file.type);
    const hasValidExtension = this.allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    return isValidType || hasValidExtension;
  }

  private uploadFile(uploadedFile: UploadedFile): void {
    // Simulate progress
    const progressInterval = setInterval(() => {
      uploadedFile.progress = Math.min(uploadedFile.progress + 10, 90);
    }, 200);

    const apiKey = this.apiKey() || undefined;
    this.difyService.uploadFile(uploadedFile.file, this.userId(), apiKey)
      .subscribe({
        next: (response) => {
          clearInterval(progressInterval);
          uploadedFile.progress = 100;
          uploadedFile.id = response.id;
          this.updateFileStatus(uploadedFile, 'success');
        },
        error: (error) => {
          clearInterval(progressInterval);
          const errorMessage = error.error?.message || 'Erreur lors du téléchargement';
          this.updateFileStatus(uploadedFile, 'error', errorMessage);
        }
      });
  }

  private updateFileStatus(
    uploadedFile: UploadedFile, 
    status: 'uploading' | 'success' | 'error',
    errorMessage?: string
  ): void {
    uploadedFile.status = status;
    if (errorMessage) {
      uploadedFile.errorMessage = errorMessage;
    }
    
    // Trigger change detection
    this.uploadedFiles.update(files => [...files]);
  }

  removeFile(index: number): void {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearAllFiles(): void {
    this.uploadedFiles.set([]);
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
    return this.uploadedFiles().filter(file => file.status === 'success');
  }
}