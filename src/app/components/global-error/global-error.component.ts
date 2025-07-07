import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnalysisDataService } from '../../services/analysis-data.service';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-global-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-error.component.html',
  styleUrl: './global-error.component.css',
})
export class GlobalErrorComponent implements OnInit, OnDestroy {
  hasError = false;
  errorMessage = '';
  isRetrying = false;

  private hasErrorSubscription?: Subscription;
  private errorSubscription?: Subscription;

  constructor(
    private analysisDataService: AnalysisDataService,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to global error state
    this.hasErrorSubscription = this.analysisDataService.hasError$.subscribe(
      (hasError) => {
        this.hasError = hasError;
      }
    );

    // Subscribe to error message
    this.errorSubscription = this.analysisDataService.error$.subscribe(
      (error) => {
        this.errorMessage = error || '';
      }
    );
  }

  ngOnDestroy(): void {
    if (this.hasErrorSubscription) {
      this.hasErrorSubscription.unsubscribe();
    }
    if (this.errorSubscription) {
      this.errorSubscription.unsubscribe();
    }
  }

  onRetry(): void {
    this.isRetrying = true;
    const retryData = this.analysisDataService.getRetryData();

    if (retryData.isUploadError && retryData.file) {
      // Retry the entire upload process
      this.retryUpload(retryData.file);
    } else if (
      !retryData.isUploadError &&
      retryData.fileId &&
      retryData.fileName
    ) {
      // Retry only the processing step
      this.retryProcessing(retryData.fileId, retryData.fileName);
    } else {
      // No retry data available, redirect to upload page
      this.router.navigate(['/']);
      this.onReset();
    }
  }

  private retryUpload(file: File): void {
    this.analysisDataService.setLoading(true);
    this.analysisDataService.setHasError(false);

    this.apiService.uploadDocument(file).subscribe({
      next: (response) => {
        if (response.id) {
          // Update retry data
          this.analysisDataService.setRetryData(
            file,
            response.id,
            file.name,
            false
          );
          // Continue with processing
          this.retryProcessing(response.id, file.name);
        } else {
          this.handleRetryError('Upload successful but no file ID returned');
        }
      },
      error: (error) => {
        this.handleRetryError('Error uploading file. Please try again.');
      },
    });
  }

  private retryProcessing(fileId: string, fileName: string): void {
    this.analysisDataService.setLoading(true);
    this.analysisDataService.setHasError(false);

    this.apiService
      .processDocument(fileId, `Analyze the document: ${fileName}`)
      .subscribe({
        next: (response) => {
          // Validate the response
          if (!response || !response.data || !response.data.outputs) {
            this.handleRetryError('Invalid response format from API');
            return;
          }

          // Success - store result and navigate
          this.analysisDataService.setAnalysisResult(response);
          this.analysisDataService.setLoading(false);
          this.isRetrying = false;

          // Navigate to analysis page
          this.router.navigate(['/analysis']);
        },
        error: (error) => {
          this.handleRetryError('Error processing document. Please try again.');
        },
      });
  }

  private handleRetryError(message: string): void {
    this.isRetrying = false;
    this.analysisDataService.setLoading(false);
    this.analysisDataService.setError(message);
    this.analysisDataService.setHasError(true);
  }

  onReset(): void {
    this.isRetrying = false;
    this.analysisDataService.clearData();
    this.router.navigate(['/']);
  }
}
