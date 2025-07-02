import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DifyWorkflowComponent } from './components/dify-workflow/dify-workflow-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DifyWorkflowComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'Smart_Analyser';
}