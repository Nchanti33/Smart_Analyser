import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UploadComponent } from './components/upload/upload-component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UploadComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
<<<<<<< HEAD
  protected title = 'Smart Analyser';
}
=======
  protected title = 'Smart_Analyser';
}
>>>>>>> a2ce3dc3bf568ad0b7f6b7d305d04986ef8dfe70
