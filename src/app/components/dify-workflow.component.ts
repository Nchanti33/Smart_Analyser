import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DifyService, DifyWorkflowRequest, DifyStreamEvent } from '../services/dify.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dify-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dify-workflow-container">
      <div class="config-section">
        <h2>Dify Workflow Configuration</h2>
        
        <div class="form-group">
          <label for="apiKey">API Key:</label>
          <input 
            type="password" 
            id="apiKey" 
            [(ngModel)]="apiKey" 
            placeholder="Enter your Dify API key"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="userId">User ID:</label>
          <input 
            type="text" 
            id="userId" 
            [(ngModel)]="userId" 
            placeholder="Enter user identifier"
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="responseMode">Response Mode:</label>
          <select id="responseMode" [(ngModel)]="responseMode" class="form-control">
            <option value="blocking">Blocking</option>
            <option value="streaming">Streaming</option>
          </select>
        </div>

        <div class="form-group">
          <label for="inputs">Workflow Inputs (JSON):</label>
          <textarea 
            id="inputs" 
            [(ngModel)]="inputsJson" 
            placeholder='{"key": "value"}'
            class="form-control"
            rows="4"
          ></textarea>
        </div>

        <div class="button-group">
          <button 
            (click)="executeWorkflow()" 
            [disabled]="isLoading || !apiKey || !userId"
            class="btn btn-primary"
          >
            {{ isLoading ? 'Executing...' : 'Execute Workflow' }}
          </button>
          
          <button 
            (click)="stopWorkflow()" 
            [disabled]="!currentTaskId || responseMode !== 'streaming'"
            class="btn btn-secondary"
          >
            Stop Workflow
          </button>
        </div>
      </div>

      <div class="results-section">
        <h3>Results</h3>
        
        @if (error) {
          <div class="error-message">
            <strong>Error:</strong> {{ error }}
          </div>
        }

        @if (responseMode === 'streaming') {
          <div class="streaming-results">
            <h4>Streaming Events:</h4>
            <div class="events-container">
              @for (event of streamEvents; track $index) {
                <div class="event-item" [class]="'event-' + event.event">
                  <div class="event-header">
                    <span class="event-type">{{ event.event }}</span>
                    <span class="event-time">{{ formatTime(event.timestamp) }}</span>
                  </div>
                  <pre class="event-data">{{ formatEventData(event.data) }}</pre>
                </div>
              }
            </div>
          </div>
        } @else {
          @if (blockingResult) {
            <div class="blocking-result">
              <h4>Workflow Result:</h4>
              <pre class="result-data">{{ formatJson(blockingResult) }}</pre>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .dify-workflow-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .config-section {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .config-section h2 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 24px;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }

    .results-section {
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 24px;
    }

    .results-section h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 20px;
      font-weight: 600;
    }

    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      border: 1px solid #f5c6cb;
    }

    .events-container {
      max-height: 500px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 6px;
    }

    .event-item {
      border-bottom: 1px solid #e9ecef;
      padding: 12px;
    }

    .event-item:last-child {
      border-bottom: none;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .event-type {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .event-workflow_started .event-type {
      background: #d4edda;
      color: #155724;
    }

    .event-node_started .event-type {
      background: #cce5ff;
      color: #004085;
    }

    .event-text_chunk .event-type {
      background: #fff3cd;
      color: #856404;
    }

    .event-node_finished .event-type {
      background: #d1ecf1;
      color: #0c5460;
    }

    .event-workflow_finished .event-type {
      background: #d4edda;
      color: #155724;
    }

    .event-time {
      font-size: 12px;
      color: #6c757d;
    }

    .event-data, .result-data {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .blocking-result h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }
  `]
})
export class DifyWorkflowComponent implements OnInit, OnDestroy {
  apiKey = '';
  userId = 'user-123';
  responseMode: 'blocking' | 'streaming' = 'streaming';
  inputsJson = '{}';
  
  isLoading = false;
  error: string | null = null;
  currentTaskId: string | null = null;
  
  streamEvents: Array<DifyStreamEvent & { timestamp: Date }> = [];
  blockingResult: any = null;
  
  private streamSubscription?: Subscription;

  constructor(private difyService: DifyService) {}

  ngOnInit() {
    // Initialize with sample inputs
    this.inputsJson = JSON.stringify({
      query: "Hello, how are you?",
      // Add more sample inputs as needed
    }, null, 2);
  }

  ngOnDestroy() {
    this.streamSubscription?.unsubscribe();
  }

  async executeWorkflow() {
    if (!this.apiKey || !this.userId) {
      this.error = 'API Key and User ID are required';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.streamEvents = [];
    this.blockingResult = null;
    this.currentTaskId = null;

    try {
      this.difyService.setApiKey(this.apiKey);
      
      let inputs: any;
      try {
        inputs = JSON.parse(this.inputsJson);
      } catch (e) {
        throw new Error('Invalid JSON in inputs field');
      }

      const request: DifyWorkflowRequest = {
        inputs,
        response_mode: this.responseMode,
        user: this.userId
      };

      if (this.responseMode === 'streaming') {
        this.streamSubscription = this.difyService.executeWorkflowStream(request).subscribe({
          next: (event) => {
            this.streamEvents.push({
              ...event,
              timestamp: new Date()
            });
            
            if (event.task_id) {
              this.currentTaskId = event.task_id;
            }
          },
          error: (error) => {
            this.error = error.message || 'An error occurred during streaming';
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
            this.currentTaskId = null;
          }
        });
      } else {
        const result = await this.difyService.executeWorkflow(request);
        this.blockingResult = result;
        this.isLoading = false;
      }
    } catch (error: any) {
      this.error = error.message || 'An error occurred';
      this.isLoading = false;
    }
  }

  async stopWorkflow() {
    if (!this.currentTaskId) return;

    try {
      await this.difyService.stopWorkflow(this.currentTaskId, this.userId);
      this.streamSubscription?.unsubscribe();
      this.isLoading = false;
      this.currentTaskId = null;
    } catch (error: any) {
      this.error = error.message || 'Failed to stop workflow';
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  formatEventData(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}