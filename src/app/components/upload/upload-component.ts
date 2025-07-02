import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './upload-component.html',
  styleUrl: './upload-component.css'
})
export class UploadComponent {
  uploadedFiles = signal<UploadedFile[]>([]);
  isDragOver = signal(false);
  isProcessing = signal(false);
  analysisResult = signal<string>('');

  private readonly allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain'
  ];

  private readonly allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  private readonly defaultUserId = 'user-123';

  constructor(private difyService: DifyService) {}

  onUploadZoneClick(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onDragOver(event: DragEvent): void {
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
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelect(event: Event): void {
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

    this.difyService.uploadFile(uploadedFile.file, this.defaultUserId)
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

  processDocuments(): void {
    const successfulFiles = this.getSuccessfulUploads();
    if (successfulFiles.length === 0) {
      alert('Aucun fichier à traiter. Veuillez d\'abord télécharger des fichiers.');
      return;
    }

    const fileIds = successfulFiles
      .map(file => file.id)
      .filter(id => id !== undefined) as string[];

    if (fileIds.length === 0) {
      alert('Aucun ID de fichier disponible pour le traitement.');
      return;
    }

    this.isProcessing.set(true);
    this.analysisResult.set('');

    // Mark files as processing
    successfulFiles.forEach(file => {
      this.updateFileStatus(file, 'processing');
    });

    const query = `Analysez ces ${fileIds.length} document(s) et fournissez:
1. Un résumé détaillé du contenu
2. Les points clés identifiés
3. Les recommandations ou conclusions importantes
4. Une synthèse globale si plusieurs documents sont analysés`;

    this.difyService.processDocuments(fileIds, query, this.defaultUserId)
      .subscribe({
        next: (response) => {
          this.isProcessing.set(false);
          this.analysisResult.set(response.answer);
          
          // Mark files as processed
          successfulFiles.forEach(file => {
            file.analysisResult = response.answer;
            this.updateFileStatus(file, 'processed');
          });
        },
        error: (error) => {
          this.isProcessing.set(false);
          const errorMessage = error.error?.message || 'Erreur lors du traitement des documents';
          this.analysisResult.set(`Erreur: ${errorMessage}`);
          
          // Revert files to success status
          successfulFiles.forEach(file => {
            this.updateFileStatus(file, 'success');
          });
          
          alert(`Erreur lors du traitement: ${errorMessage}`);
        }
      });
  }

  removeFile(index: number): void {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearAllFiles(): void {
    this.uploadedFiles.set([]);
    this.analysisResult.set('');
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

  getProcessedFiles(): UploadedFile[] {
    return this.uploadedFiles().filter(file => file.status === 'processed');
  }

  canProcessDocuments(): boolean {
    return this.getSuccessfulUploads().length > 0 && !this.isProcessing();
  }
}