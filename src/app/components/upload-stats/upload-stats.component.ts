import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GlobalVariablesService } from '../../services/global-variables.service';

interface UploadHistory {
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  success: boolean;
}

@Component({
  selector: 'app-upload-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-container">
      <h3>📊 Statistiques d'Upload</h3>

      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total uploads:</span>
          <span class="stat-value">{{ totalUploads }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Réussis:</span>
          <span class="stat-value success">{{ successfulUploads }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Échecs:</span>
          <span class="stat-value error">{{
            totalUploads - successfulUploads
          }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Taux de réussite:</span>
          <span class="stat-value">{{ getSuccessRate() }}%</span>
        </div>
      </div>

      <div class="current-status">
        <span class="status-label">Statut actuel:</span>
        <span class="status-value" [class]="getStatusClass()">{{
          currentStatus
        }}</span>
      </div>

      <div class="last-file" *ngIf="lastUploadedFile">
        <span class="file-label">Dernier fichier:</span>
        <span class="file-name">{{ lastUploadedFile }}</span>
      </div>

      <div class="history-section" *ngIf="uploadHistory.length > 0">
        <h4>📋 Historique récent</h4>
        <div class="history-list">
          <div
            *ngFor="let item of uploadHistory.slice(-5); let i = index"
            class="history-item"
            [class.success]="item.success"
            [class.error]="!item.success"
          >
            <span class="history-icon">{{ item.success ? '✅' : '❌' }}</span>
            <span class="history-filename">{{ item.fileName }}</span>
            <span class="history-size">{{
              formatFileSize(item.fileSize)
            }}</span>
            <span class="history-date">{{ formatDate(item.uploadDate) }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button (click)="refreshStats()" class="refresh-btn">
          🔄 Actualiser
        </button>
        <button (click)="clearHistory()" class="clear-btn">
          🗑️ Effacer l'historique
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-container {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border: 1px solid #e9ecef;
      }

      .stats-container h3 {
        margin: 0 0 15px 0;
        color: rgb(0, 174, 141);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
      }

      .stat-item {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .stat-label {
        font-size: 0.9em;
        color: #6c757d;
        margin-bottom: 5px;
      }

      .stat-value {
        font-size: 1.5em;
        font-weight: bold;
        color: #495057;
      }

      .stat-value.success {
        color: #28a745;
      }

      .stat-value.error {
        color: #dc3545;
      }

      .current-status {
        background: white;
        padding: 10px 15px;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .status-label {
        font-weight: 500;
        color: #495057;
      }

      .status-value {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.9em;
        font-weight: 500;
      }

      .status-value.idle {
        background: #f8f9fa;
        color: #6c757d;
      }

      .status-value.uploading {
        background: #fff3cd;
        color: #856404;
      }

      .status-value.processing {
        background: #d4edda;
        color: #155724;
      }

      .status-value.success {
        background: #d4edda;
        color: #155724;
      }

      .status-value.error {
        background: #f8d7da;
        color: #721c24;
      }

      .last-file {
        background: white;
        padding: 10px 15px;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .file-label {
        font-weight: 500;
        color: #495057;
      }

      .file-name {
        font-family: monospace;
        color: rgb(0, 174, 141);
        font-weight: 500;
      }

      .history-section {
        background: white;
        padding: 15px;
        border-radius: 6px;
        border: 1px solid #dee2e6;
        margin-bottom: 15px;
      }

      .history-section h4 {
        margin: 0 0 10px 0;
        color: #495057;
      }

      .history-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .history-item {
        display: grid;
        grid-template-columns: 30px 1fr auto auto;
        gap: 10px;
        align-items: center;
        padding: 8px;
        border-radius: 4px;
        font-size: 0.9em;
      }

      .history-item.success {
        background: #f8fff9;
        border: 1px solid #d4edda;
      }

      .history-item.error {
        background: #fdf8f8;
        border: 1px solid #f8d7da;
      }

      .history-icon {
        font-size: 1.2em;
      }

      .history-filename {
        font-weight: 500;
        color: #495057;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .history-size {
        color: #6c757d;
        font-size: 0.8em;
      }

      .history-date {
        color: #6c757d;
        font-size: 0.8em;
      }

      .actions {
        display: flex;
        gap: 10px;
      }

      .refresh-btn,
      .clear-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        transition: background-color 0.2s;
      }

      .refresh-btn {
        background: rgb(0, 174, 141);
        color: white;
      }

      .refresh-btn:hover {
        background: rgba(0, 174, 141, 0.8);
      }

      .clear-btn {
        background: #dc3545;
        color: white;
      }

      .clear-btn:hover {
        background: #c82333;
      }
    `,
  ],
})
export class UploadStatsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  totalUploads: number = 0;
  successfulUploads: number = 0;
  currentStatus: string = 'idle';
  lastUploadedFile: string = '';
  uploadHistory: UploadHistory[] = [];

  constructor(private globalVars: GlobalVariablesService) {}

  ngOnInit(): void {
    this.subscribeToGlobalVariables();
    this.refreshStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private subscribeToGlobalVariables(): void {
    // Subscribe to total uploads
    const totalUploadsObs = this.globalVars.getNumber$('totalUploads');
    if (totalUploadsObs) {
      this.subscriptions.push(
        totalUploadsObs.subscribe((value) => {
          this.totalUploads = value || 0;
        })
      );
    }

    // Subscribe to successful uploads
    const successfulUploadsObs =
      this.globalVars.getNumber$('successfulUploads');
    if (successfulUploadsObs) {
      this.subscriptions.push(
        successfulUploadsObs.subscribe((value) => {
          this.successfulUploads = value || 0;
        })
      );
    }

    // Subscribe to current status
    const statusObs = this.globalVars.getString$('currentUploadStatus');
    if (statusObs) {
      this.subscriptions.push(
        statusObs.subscribe((value) => {
          this.currentStatus = value || 'idle';
        })
      );
    }

    // Subscribe to last uploaded file
    const lastFileObs = this.globalVars.getString$('lastUploadedFile');
    if (lastFileObs) {
      this.subscriptions.push(
        lastFileObs.subscribe((value) => {
          this.lastUploadedFile = value || '';
        })
      );
    }

    // Subscribe to upload history
    const historyObs =
      this.globalVars.getArray$<UploadHistory>('uploadHistory');
    if (historyObs) {
      this.subscriptions.push(
        historyObs.subscribe((value) => {
          this.uploadHistory = value || [];
        })
      );
    }
  }

  getSuccessRate(): string {
    if (this.totalUploads === 0) return '0';
    return Math.round(
      (this.successfulUploads / this.totalUploads) * 100
    ).toString();
  }

  getStatusClass(): string {
    return `status-${this.currentStatus}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  refreshStats(): void {
    // Force refresh by reading current values
    this.totalUploads = this.globalVars.getNumber('totalUploads') || 0;
    this.successfulUploads =
      this.globalVars.getNumber('successfulUploads') || 0;
    this.currentStatus =
      this.globalVars.getString('currentUploadStatus') || 'idle';
    this.lastUploadedFile = this.globalVars.getString('lastUploadedFile') || '';
    this.uploadHistory =
      this.globalVars.getArray<UploadHistory>('uploadHistory') || [];
  }

  clearHistory(): void {
    if (confirm("Êtes-vous sûr de vouloir effacer l'historique ?")) {
      this.globalVars.setArray('uploadHistory', []);
      this.globalVars.setNumber('totalUploads', 0);
      this.globalVars.setNumber('successfulUploads', 0);
      this.globalVars.setString('lastUploadedFile', '');
      this.globalVars.setString('currentUploadStatus', 'idle');
    }
  }
}
