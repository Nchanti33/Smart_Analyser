import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DifyService, DifyWorkflowRequest, DifyStreamEvent } from '../../services/dify.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dify-workflow',
  imports: [CommonModule, FormsModule],
  templateUrl: './dify-workflow-component.html',
  styleUrl: './dify-workflow-component.css'
})
export class DifyWorkflowComponent implements OnInit, OnDestroy {
  apiKey = '';
  userId = 'user-123';
  inputs: Record<string, any> = {};
  responseMode: 'streaming' | 'blocking' = 'streaming';
  
  isLoading = false;
  result: any = null;
  streamEvents: DifyStreamEvent[] = [];
  error: string | null = null;
  
  private streamSubscription?: Subscription;

  constructor(private difyService: DifyService) {}

  ngOnInit(): void {
    // Initialize component
  }

  ngOnDestroy(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
    }
  }

  setApiKey(): void {
    if (this.apiKey.trim()) {
      this.difyService.setApiKey(this.apiKey.trim());
    }
  }

  async executeWorkflow(): Promise<void> {
    if (!this.apiKey.trim()) {
      this.error = 'Please enter your API key first';
      return;
    }

    this.setApiKey();
    this.isLoading = true;
    this.error = null;
    this.result = null;
    this.streamEvents = [];

    const request: DifyWorkflowRequest = {
      inputs: this.inputs,
      response_mode: this.responseMode,
      user: this.userId
    };

    try {
      if (this.responseMode === 'blocking') {
        this.result = await this.difyService.executeWorkflow(request);
      } else {
        this.streamSubscription = this.difyService.executeWorkflowStream(request).subscribe({
          next: (event) => {
            this.streamEvents.push(event);
            if (event.event === 'workflow_finished') {
              this.isLoading = false;
            }
          },
          error: (error) => {
            this.error = error.message;
            this.isLoading = false;
          },
          complete: () => {
            this.isLoading = false;
          }
        });
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'An error occurred';
      this.isLoading = false;
    }
  }

  addInput(): void {
    const key = prompt('Enter input key:');
    if (key && key.trim()) {
      this.inputs[key.trim()] = '';
    }
  }

  removeInput(key: string): void {
    delete this.inputs[key];
  }

  clearResults(): void {
    this.result = null;
    this.streamEvents = [];
    this.error = null;
  }

  getInputKeys(): string[] {
    return Object.keys(this.inputs);
  }
}