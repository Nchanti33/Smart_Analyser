import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { GlobalVariablesService } from '../../services/global-variables.service';

interface UserProfile {
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-global-variables-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="demo-container">
      <h2>Démonstration des Variables Globales</h2>

      <!-- String Variable -->
      <div class="variable-section">
        <h3>Variable String (userMessage)</h3>
        <input
          type="text"
          [(ngModel)]="localMessage"
          placeholder="Tapez un message"
          (input)="updateMessage()"
        />
        <p><strong>Valeur globale :</strong> {{ currentMessage }}</p>
        <button (click)="clearMessage()">Effacer</button>
      </div>

      <!-- Number Variable -->
      <div class="variable-section">
        <h3>Variable Number (counter)</h3>
        <p><strong>Compteur :</strong> {{ currentCounter }}</p>
        <button (click)="incrementCounter()">+1</button>
        <button (click)="decrementCounter()">-1</button>
        <button (click)="resetCounter()">Reset</button>
      </div>

      <!-- Boolean Variable -->
      <div class="variable-section">
        <h3>Variable Boolean (isActive)</h3>
        <p>
          <strong>État :</strong> {{ currentIsActive ? 'Actif' : 'Inactif' }}
        </p>
        <button (click)="toggleActive()">Basculer</button>
      </div>

      <!-- Array Variable -->
      <div class="variable-section">
        <h3>Variable Array (todoList)</h3>
        <div class="todo-input">
          <input
            type="text"
            [(ngModel)]="newTodo"
            placeholder="Nouvelle tâche"
            (keyup.enter)="addTodo()"
          />
          <button (click)="addTodo()">Ajouter</button>
        </div>
        <ul>
          <li *ngFor="let todo of currentTodos; let i = index">
            {{ todo }}
            <button (click)="removeTodo(todo)">Supprimer</button>
          </li>
        </ul>
        <button (click)="clearTodos()">Effacer tout</button>
      </div>

      <!-- Object Variable -->
      <div class="variable-section">
        <h3>Variable Object (userProfile)</h3>
        <div class="profile-inputs">
          <input
            type="text"
            [(ngModel)]="localProfile.name"
            placeholder="Nom"
            (input)="updateProfile()"
          />
          <input
            type="email"
            [(ngModel)]="localProfile.email"
            placeholder="Email"
            (input)="updateProfile()"
          />
          <input
            type="number"
            [(ngModel)]="localProfile.age"
            placeholder="Âge"
            (input)="updateProfile()"
          />
        </div>
        <div class="profile-display">
          <p><strong>Profil global :</strong></p>
          <pre>{{ currentProfile | json }}</pre>
        </div>
        <button (click)="clearProfile()">Effacer profil</button>
      </div>

      <!-- All Variables Display -->
      <div class="variable-section">
        <h3>Toutes les Variables</h3>
        <p>
          <strong>Variables existantes :</strong> {{ allVariables.join(', ') }}
        </p>
        <button (click)="refreshVariablesList()">Actualiser</button>
        <button (click)="clearAllVariables()">Effacer toutes</button>
      </div>
    </div>
  `,
  styles: [
    `
      .demo-container {
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
      }

      .variable-section {
        margin-bottom: 30px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }

      .variable-section h3 {
        margin-top: 0;
        color: rgb(0, 174, 141);
      }

      .todo-input {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }

      .todo-input input {
        flex: 1;
      }

      .profile-inputs {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }

      .profile-inputs input {
        flex: 1;
      }

      .profile-display {
        margin-top: 10px;
        padding: 10px;
        background-color: #fff;
        border-radius: 4px;
      }

      .profile-display pre {
        margin: 0;
        white-space: pre-wrap;
      }

      button {
        background-color: rgb(0, 174, 141);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
        margin-bottom: 5px;
      }

      button:hover {
        background-color: rgba(0, 174, 141, 0.8);
      }

      input {
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin-right: 10px;
      }

      ul {
        list-style-type: none;
        padding: 0;
      }

      li {
        padding: 5px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      p {
        margin: 10px 0;
      }
    `,
  ],
})
export class GlobalVariablesDemoComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  // Local variables for form inputs
  localMessage: string = '';
  newTodo: string = '';
  localProfile: UserProfile = { name: '', email: '', age: 0 };

  // Current values from global variables
  currentMessage: string = '';
  currentCounter: number = 0;
  currentIsActive: boolean = false;
  currentTodos: string[] = [];
  currentProfile: UserProfile = { name: '', email: '', age: 0 };
  allVariables: string[] = [];

  constructor(private globalVars: GlobalVariablesService) {}

  ngOnInit(): void {
    this.initializeGlobalVariables();
    this.subscribeToGlobalVariables();
    this.refreshVariablesList();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private initializeGlobalVariables(): void {
    // Initialize all global variables
    this.globalVars.createString('userMessage', 'Bonjour le monde !');
    this.globalVars.createNumber('counter', 0);
    this.globalVars.createBoolean('isActive', false);
    this.globalVars.createArray<string>('todoList', [
      'Première tâche',
      'Deuxième tâche',
    ]);
    this.globalVars.createObject<UserProfile>('userProfile', {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });
  }

  private subscribeToGlobalVariables(): void {
    // Subscribe to all global variables
    const messageObs = this.globalVars.getString$('userMessage');
    if (messageObs) {
      this.subscriptions.push(
        messageObs.subscribe((value) => {
          this.currentMessage = value || '';
          this.localMessage = value || '';
        })
      );
    }

    const counterObs = this.globalVars.getNumber$('counter');
    if (counterObs) {
      this.subscriptions.push(
        counterObs.subscribe((value) => {
          this.currentCounter = value || 0;
        })
      );
    }

    const activeObs = this.globalVars.getBoolean$('isActive');
    if (activeObs) {
      this.subscriptions.push(
        activeObs.subscribe((value) => {
          this.currentIsActive = value || false;
        })
      );
    }

    const todosObs = this.globalVars.getArray$<string>('todoList');
    if (todosObs) {
      this.subscriptions.push(
        todosObs.subscribe((value) => {
          this.currentTodos = value || [];
        })
      );
    }

    const profileObs = this.globalVars.getObject$<UserProfile>('userProfile');
    if (profileObs) {
      this.subscriptions.push(
        profileObs.subscribe((value) => {
          this.currentProfile = value || { name: '', email: '', age: 0 };
          this.localProfile = value
            ? { ...value }
            : { name: '', email: '', age: 0 };
        })
      );
    }
  }

  // String variable methods
  updateMessage(): void {
    this.globalVars.setString('userMessage', this.localMessage);
  }

  clearMessage(): void {
    this.globalVars.setString('userMessage', '');
  }

  // Number variable methods
  incrementCounter(): void {
    this.globalVars.increment('counter');
  }

  decrementCounter(): void {
    this.globalVars.decrement('counter');
  }

  resetCounter(): void {
    this.globalVars.setNumber('counter', 0);
  }

  // Boolean variable methods
  toggleActive(): void {
    this.globalVars.toggle('isActive');
  }

  // Array variable methods
  addTodo(): void {
    if (this.newTodo.trim()) {
      this.globalVars.appendToArray('todoList', this.newTodo.trim());
      this.newTodo = '';
    }
  }

  removeTodo(todo: string): void {
    this.globalVars.removeFromArray('todoList', todo);
  }

  clearTodos(): void {
    this.globalVars.clearArray('todoList');
  }

  // Object variable methods
  updateProfile(): void {
    this.globalVars.setObject('userProfile', { ...this.localProfile });
  }

  clearProfile(): void {
    this.globalVars.setObject('userProfile', { name: '', email: '', age: 0 });
  }

  // Utility methods
  refreshVariablesList(): void {
    this.allVariables = this.globalVars.listAll();
  }

  clearAllVariables(): void {
    this.globalVars.clearAll();
    this.allVariables = [];
  }
}
