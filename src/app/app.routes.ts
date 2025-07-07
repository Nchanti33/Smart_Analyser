import { Routes } from '@angular/router';
import { AnalyserDisplayComponent } from './components/analyserDisplay/analyserDisplay';
import { UploadPageComponent } from './components/uploadPage/uploadPage';
import { GlobalVariablesDemoComponent } from './components/global-variables-demo/global-variables-demo.component';
import { TestParserComponent } from './components/test-parser/test-parser.component';

export const routes: Routes = [
  { path: '', component: UploadPageComponent },
  { path: 'upload', redirectTo: '', pathMatch: 'full' },
  { path: 'analysis', component: AnalyserDisplayComponent },
  { path: 'demo', component: GlobalVariablesDemoComponent },
  { path: 'test-parser', component: TestParserComponent },
  { path: '**', redirectTo: '' },
];
