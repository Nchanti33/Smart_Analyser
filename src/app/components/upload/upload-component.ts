import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DifyService, UploadResponse, ProcessResponse } from '../../services/dify.service';

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
    if (this.hasUploadedFile()) {
      alert('Vous ne pouvez télécharger qu\'un seul document à la fois. Veuillez supprimer le fichier actuel avant d\'en télécharger un nouveau.');
      return;
    }

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    
    if (this.hasUploadedFile()) {
      event.dataTransfer!.dropEffect = 'none';
      return;
    }
    
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    if (this.hasUploadedFile()) {
      alert('Vous ne pouvez télécharger qu\'un seul document à la fois. Veuillez supprimer le fichier actuel avant d\'en télécharger un nouveau.');
      return;
    }
    
    const files = Array.from(event.dataTransfer?.files || []);
    this.handleFiles(files);
  }

  onFileSelect(event: Event): void {
    if (this.hasUploadedFile()) {
      alert('Vous ne pouvez télécharger qu\'un seul document à la fois. Veuillez supprimer le fichier actuel avant d\'en télécharger un nouveau.');
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
      type: file.type,
      lastModified: file.lastModified
    });
    
    if (!this.isValidFile(file)) {
      const errorMsg = `Format de fichier non supporté: ${file.type}. Seuls les formats PDF, DOCX et TXT sont acceptés.`;
      console.error('❌ Invalid file type:', errorMsg);
      alert(errorMsg);
      return;
    }

    if (files.length > 1) {
      console.warn('⚠️ Multiple files detected, only processing the first one');
      alert('Un seul fichier peut être téléchargé à la fois. Seul le premier fichier sera traité.');
    }

    const uploadedFile: UploadedFile = {
      file,
      status: 'uploading',
      progress: 0
    };

    console.log('✅ File validation passed, starting upload...');
    this.uploadedFiles.set([uploadedFile]);
    this.uploadFile(uploadedFile);
  }

  private isValidFile(file: File): boolean {
    const isValidType = this.allowedTypes.includes(file.type);
    const hasValidExtension = this.allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    console.log('🔍 File validation:', {
      fileName: file.name,
      fileType: file.type,
      isValidType,
      hasValidExtension,
      allowedTypes: this.allowedTypes,
      allowedExtensions: this.allowedExtensions
    });
    
    return isValidType || hasValidExtension;
  }

  private uploadFile(uploadedFile: UploadedFile): void {
    console.log('🚀 Starting file upload process...');
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      if (uploadedFile.progress < 90) {
        uploadedFile.progress = Math.min(uploadedFile.progress + 10, 90);
        console.log(`📊 Upload progress: ${uploadedFile.progress}%`);
        // Trigger change detection
        this.uploadedFiles.update(files => [...files]);
      }
    }, 200);

    this.difyService.uploadFile(uploadedFile.file, this.defaultUserId)
      .subscribe({
        next: (response: UploadResponse) => {
          console.log('✅ Upload successful:', response);
          clearInterval(progressInterval);
          uploadedFile.progress = 100;
          uploadedFile.id = response.id;
          this.updateFileStatus(uploadedFile, 'success');
        },
        error: (error: HttpErrorResponse) => {
          console.error('❌ Upload failed:', error);
          clearInterval(progressInterval);
          
          let errorMessage = 'Erreur lors du téléchargement';
          
          // Analyse détaillée de l'erreur
          if (error.status) {
            console.error('HTTP Status:', error.status);
            console.error('HTTP Status Text:', error.statusText);
          }
          
          if (error.error) {
            console.error('Error details:', error.error);
            if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.detail) {
              errorMessage = error.error.detail;
            }
          }
          
          if (error.message) {
            console.error('Error message:', error.message);
            errorMessage = error.message;
          }
          
          // Erreurs spécifiques
          if (error.status === 0) {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
          } else if (error.status === 401) {
            errorMessage = 'Erreur d\'authentification. Clé API invalide.';
          } else if (error.status === 413) {
            errorMessage = 'Fichier trop volumineux. Taille maximale dépassée.';
          } else if (error.status === 415) {
            errorMessage = 'Type de fichier non supporté par le serveur.';
          } else if (error.status >= 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }
          
          console.error('Final error message:', errorMessage);
          this.updateFileStatus(uploadedFile, 'error', errorMessage);
        }
      });
  }

  private updateFileStatus(
    uploadedFile: UploadedFile, 
    status: 'uploading' | 'success' | 'error' | 'processing' | 'processed',
    errorMessage?: string
  ): void {
    console.log(`📝 Updating file status to: ${status}`, errorMessage ? `Error: ${errorMessage}` : '');
    
    uploadedFile.status = status;
    if (errorMessage) {
      uploadedFile.errorMessage = errorMessage;
    }
    
    // Trigger change detection
    this.uploadedFiles.update(files => [...files]);
  }

  processDocuments(): void {
    console.log('🤖 Starting document processing...');
    
    const successfulFiles = this.getSuccessfulUploads();
    if (successfulFiles.length === 0) {
      const errorMsg = 'Aucun fichier à traiter. Veuillez d\'abord télécharger un fichier.';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }

    const fileIds = successfulFiles
      .map(file => file.id)
      .filter(id => id !== undefined) as string[];

    if (fileIds.length === 0) {
      const errorMsg = 'Aucun ID de fichier disponible pour le traitement.';
      console.error('❌', errorMsg);
      alert(errorMsg);
      return;
    }

    console.log('📄 Processing files with IDs:', fileIds);

    this.isProcessing.set(true);
    this.analysisResult.set('');

    // Mark files as processing
    successfulFiles.forEach(file => {
      this.updateFileStatus(file, 'processing');
    });

    const query = `Analysez ce document et fournissez:
1. Un résumé détaillé du contenu
2. Les points clés identifiés
3. Les recommandations ou conclusions importantes
4. Une synthèse globale du document`;

    console.log('📤 Sending processing request with query:', query);

    this.difyService.processDocuments(fileIds, query, this.defaultUserId)
      .subscribe({
        next: (response: ProcessResponse) => {
          console.log('✅ Document processing successful:', response);
          this.isProcessing.set(false);
          this.analysisResult.set(response.answer);
          
          // Mark files as processed
          successfulFiles.forEach(file => {
            file.analysisResult = response.answer;
            this.updateFileStatus(file, 'processed');
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('❌ Document processing failed:', error);
          this.isProcessing.set(false);
          
          let errorMessage = 'Erreur lors du traitement du document';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
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
    console.log('🗑️ Removing file at index:', index);
    this.uploadedFiles.set([]);
    this.analysisResult.set('');
  }

  clearAllFiles(): void {
    console.log('🗑️ Clearing all files');
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

  getProcessedFiles(): UploadedFile[] {
    return this.uploadedFiles().filter(file => file.status === 'processed');
  }

  canProcessDocuments(): boolean {
    return this.getSuccessfulUploads().length > 0 && !this.isProcessing();
  }
}