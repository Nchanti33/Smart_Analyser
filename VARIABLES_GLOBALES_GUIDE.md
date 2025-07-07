# Variables Globales Angular - Guide d'Utilisation

Ce système de variables globales vous permet de créer et gérer des variables accessibles depuis n'importe quel composant de votre application Angular.

## Services Disponibles

### 1. AnalysisDataService

Service principal qui gère les variables globales via des `BehaviorSubject`.

### 2. GlobalVariablesService

Service simplifié qui encapsule `AnalysisDataService` et fournit des méthodes typées.

## Installation

Les services sont déjà configurés avec `providedIn: 'root'`, ils sont donc disponibles dans toute l'application.

## Utilisation Basique

### Injection du Service

```typescript
import { Component, OnInit } from "@angular/core";
import { GlobalVariablesService } from "./services/global-variables.service";

@Component({
  selector: "app-my-component",
  template: `...`,
})
export class MyComponent implements OnInit {
  constructor(private globalVars: GlobalVariablesService) {}
}
```

### Création de Variables

```typescript
ngOnInit() {
  // Créer une variable string
  this.globalVars.createString('username', 'John Doe');

  // Créer une variable number
  this.globalVars.createNumber('counter', 0);

  // Créer une variable boolean
  this.globalVars.createBoolean('isLoggedIn', false);

  // Créer une variable array
  this.globalVars.createArray<string>('todoList', ['Tâche 1', 'Tâche 2']);

  // Créer une variable object
  this.globalVars.createObject<UserProfile>('userProfile', {
    name: 'John',
    email: 'john@example.com',
    age: 30
  });
}
```

### Modification de Variables

```typescript
// Modifier une string
this.globalVars.setString("username", "Jane Doe");

// Modifier un number
this.globalVars.setNumber("counter", 10);

// Modifier un boolean
this.globalVars.setBoolean("isLoggedIn", true);

// Modifier un array
this.globalVars.setArray("todoList", ["Nouvelle tâche"]);

// Modifier un object
this.globalVars.setObject("userProfile", {
  name: "Jane",
  email: "jane@example.com",
  age: 25,
});
```

### Lecture de Variables

```typescript
// Obtenir la valeur actuelle
const username = this.globalVars.getString("username");
const counter = this.globalVars.getNumber("counter");
const isLoggedIn = this.globalVars.getBoolean("isLoggedIn");
const todos = this.globalVars.getArray<string>("todoList");
const profile = this.globalVars.getObject<UserProfile>("userProfile");
```

### Observation des Variables (Réactif)

```typescript
import { Subscription } from "rxjs";

export class MyComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // S'abonner aux changements
    const usernameObs = this.globalVars.getString$("username");
    if (usernameObs) {
      this.subscriptions.push(
        usernameObs.subscribe((value) => {
          console.log("Username changed:", value);
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
```

## Méthodes Pratiques

### Pour les Numbers

```typescript
// Incrémenter
this.globalVars.increment("counter"); // +1
this.globalVars.increment("counter", 5); // +5

// Décrémenter
this.globalVars.decrement("counter"); // -1
this.globalVars.decrement("counter", 3); // -3
```

### Pour les Booleans

```typescript
// Basculer la valeur
this.globalVars.toggle("isLoggedIn");
```

### Pour les Arrays

```typescript
// Ajouter un élément
this.globalVars.appendToArray("todoList", "Nouvelle tâche");

// Supprimer un élément
this.globalVars.removeFromArray("todoList", "Tâche à supprimer");

// Vider le tableau
this.globalVars.clearArray("todoList");
```

## Gestion des Variables

### Vérifier l'existence

```typescript
if (this.globalVars.exists("username")) {
  console.log("La variable username existe");
}
```

### Lister toutes les variables

```typescript
const allVariables = this.globalVars.listAll();
console.log("Variables disponibles:", allVariables);
```

### Supprimer une variable

```typescript
this.globalVars.remove("username");
```

### Supprimer toutes les variables

```typescript
this.globalVars.clearAll();
```

## Exemple Complet

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { GlobalVariablesService } from "./services/global-variables.service";

interface UserProfile {
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: "app-user-manager",
  template: `
    <div>
      <h2>Compteur: {{ counter }}</h2>
      <button (click)="incrementCounter()">+</button>
      <button (click)="decrementCounter()">-</button>

      <h2>Profil: {{ profile?.name }}</h2>
      <button (click)="updateProfile()">Mettre à jour</button>

      <h2>Statut: {{ isActive ? "Actif" : "Inactif" }}</h2>
      <button (click)="toggleStatus()">Basculer</button>
    </div>
  `,
})
export class UserManagerComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  counter: number = 0;
  profile: UserProfile | null = null;
  isActive: boolean = false;

  constructor(private globalVars: GlobalVariablesService) {}

  ngOnInit() {
    // Initialiser les variables globales
    this.globalVars.createNumber("appCounter", 0);
    this.globalVars.createObject<UserProfile>("currentUser", {
      name: "Utilisateur",
      email: "user@example.com",
      age: 25,
    });
    this.globalVars.createBoolean("userActive", false);

    // S'abonner aux changements
    this.subscribeToGlobalVariables();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private subscribeToGlobalVariables() {
    // Counter
    const counterObs = this.globalVars.getNumber$("appCounter");
    if (counterObs) {
      this.subscriptions.push(counterObs.subscribe((value) => (this.counter = value || 0)));
    }

    // Profile
    const profileObs = this.globalVars.getObject$<UserProfile>("currentUser");
    if (profileObs) {
      this.subscriptions.push(profileObs.subscribe((value) => (this.profile = value || null)));
    }

    // Active status
    const activeObs = this.globalVars.getBoolean$("userActive");
    if (activeObs) {
      this.subscriptions.push(activeObs.subscribe((value) => (this.isActive = value || false)));
    }
  }

  incrementCounter() {
    this.globalVars.increment("appCounter");
  }

  decrementCounter() {
    this.globalVars.decrement("appCounter");
  }

  updateProfile() {
    this.globalVars.setObject("currentUser", {
      name: "Utilisateur Mis à Jour",
      email: "updated@example.com",
      age: 30,
    });
  }

  toggleStatus() {
    this.globalVars.toggle("userActive");
  }
}
```

## Bonnes Pratiques

1. **Nommage**: Utilisez des noms descriptifs pour vos variables globales
2. **Types**: Définissez des interfaces TypeScript pour vos objets complexes
3. **Cleanup**: N'oubliez pas de vous désabonner dans `ngOnDestroy`
4. **Initialisation**: Initialisez vos variables dans `ngOnInit`
5. **Vérification**: Vérifiez l'existence des observables avant de vous y abonner

## Avantages

- ✅ **Simplicité**: Interface simple et intuitive
- ✅ **Typage**: Support complet de TypeScript
- ✅ **Réactivité**: Utilise RxJS pour la réactivité
- ✅ **Centralisé**: Gestion centralisée de l'état global
- ✅ **Persistance**: Les variables persistent entre les navigations
- ✅ **Performance**: Utilise BehaviorSubject pour l'optimisation

## Cas d'Usage

- Configuration globale de l'application
- Informations utilisateur
- Préférences utilisateur
- État de l'interface utilisateur
- Données partagées entre composants
- Cache de données
- Compteurs et statistiques globales
