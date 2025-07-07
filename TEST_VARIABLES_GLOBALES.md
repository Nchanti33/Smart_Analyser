# 🌍 Variables Globales - Test et Utilisation

## Système implémenté

J'ai créé un système complet de variables globales pour votre application Angular qui permet de créer, modifier et observer des variables depuis n'importe quel composant.

## Fichiers créés/modifiés

### 1. Services principaux

- **`analysis-data.service.ts`** : Service principal avec gestion des variables globales
- **`global-variables.service.ts`** : Service simplifié avec méthodes typées
- **`upload-stats.component.ts`** : Composant de démonstration des statistiques

### 2. Intégration dans l'existant

- **`uploadPage.ts`** : Ajout du tracking des uploads via variables globales
- **`uploadPage.html`** : Affichage des statistiques en temps réel
- **`app.routes.ts`** : Route pour la page de démonstration

## Variables globales implémentées

### Dans le composant d'upload

- `uploadHistory` : Historique des uploads (Array)
- `totalUploads` : Nombre total d'uploads (Number)
- `successfulUploads` : Nombre d'uploads réussis (Number)
- `lastUploadedFile` : Nom du dernier fichier uploadé (String)
- `currentUploadStatus` : Statut actuel (String: 'idle', 'uploading', 'processing', 'success', 'error')

## Comment tester

### 1. Utilisation normale

1. Démarrez l'application
2. Uploadez un document
3. Observez les statistiques qui s'affichent en temps réel sous la zone d'upload
4. Les variables globales sont automatiquement mises à jour

### 2. Page de démonstration

1. Allez sur `http://localhost:4200/demo`
2. Testez toutes les fonctionnalités :
   - Variables String, Number, Boolean, Array, Object
   - Observables réactifs
   - Méthodes utilitaires (increment, toggle, append, etc.)

### 3. Exemple d'utilisation dans un nouveau composant

```typescript
import { Component, OnInit } from "@angular/core";
import { GlobalVariablesService } from "./services/global-variables.service";

@Component({
  selector: "app-test",
  template: `
    <div>
      <h2>Total uploads: {{ totalUploads }}</h2>
      <h2>Statut: {{ currentStatus }}</h2>
      <button (click)="addTestUpload()">Ajouter test upload</button>
    </div>
  `,
})
export class TestComponent implements OnInit {
  totalUploads = 0;
  currentStatus = "";

  constructor(private globalVars: GlobalVariablesService) {}

  ngOnInit() {
    // S'abonner aux variables globales
    const totalObs = this.globalVars.getNumber$("totalUploads");
    if (totalObs) {
      totalObs.subscribe((value) => {
        this.totalUploads = value || 0;
      });
    }

    const statusObs = this.globalVars.getString$("currentUploadStatus");
    if (statusObs) {
      statusObs.subscribe((value) => {
        this.currentStatus = value || "idle";
      });
    }
  }

  addTestUpload() {
    // Incrémenter le compteur global
    this.globalVars.increment("totalUploads");

    // Ajouter à l'historique
    this.globalVars.appendToArray("uploadHistory", {
      fileName: "test.pdf",
      fileSize: 1024,
      uploadDate: new Date(),
      success: true,
    });
  }
}
```

## Fonctionnalités disponibles

### Création de variables

```typescript
// Types basiques
this.globalVars.createString("myString", "valeur initiale");
this.globalVars.createNumber("myNumber", 42);
this.globalVars.createBoolean("myBoolean", true);
this.globalVars.createArray("myArray", ["item1", "item2"]);
this.globalVars.createObject("myObject", { key: "value" });
```

### Modification de variables

```typescript
// Setters
this.globalVars.setString("myString", "nouvelle valeur");
this.globalVars.setNumber("myNumber", 100);
this.globalVars.setBoolean("myBoolean", false);

// Méthodes utilitaires
this.globalVars.increment("myNumber"); // +1
this.globalVars.increment("myNumber", 5); // +5
this.globalVars.decrement("myNumber"); // -1
this.globalVars.toggle("myBoolean"); // inverse
this.globalVars.appendToArray("myArray", "item3");
this.globalVars.removeFromArray("myArray", "item1");
```

### Lecture de variables

```typescript
// Valeurs actuelles
const str = this.globalVars.getString("myString");
const num = this.globalVars.getNumber("myNumber");
const bool = this.globalVars.getBoolean("myBoolean");

// Observables (réactifs)
this.globalVars.getString$("myString")?.subscribe((value) => {
  console.log("String changed:", value);
});
```

### Gestion des variables

```typescript
// Utilitaires
this.globalVars.exists("myString"); // true/false
this.globalVars.listAll(); // ['myString', 'myNumber', ...]
this.globalVars.remove("myString"); // supprime la variable
this.globalVars.clearAll(); // supprime toutes les variables
```

## Avantages

✅ **Simplicité** : Interface simple et intuitive
✅ **Réactivité** : Utilise RxJS pour les mises à jour en temps réel
✅ **Typage** : Support complet TypeScript
✅ **Centralisé** : Toutes les variables dans un seul endroit
✅ **Persistance** : Les variables persistent entre les navigations
✅ **Performance** : Optimisé avec BehaviorSubject

## Où voir les variables en action

1. **Page d'upload** : Statistiques en temps réel
2. **Page de démonstration** : `/demo` - Tous les types de variables
3. **Console** : Logs des mises à jour des variables globales

## Prochaines étapes

1. Testez les fonctionnalités existantes
2. Créez vos propres variables globales selon vos besoins
3. Intégrez le système dans d'autres composants
4. Personnalisez les types et interfaces selon votre domaine métier

Le système est maintenant prêt à être utilisé dans toute votre application ! 🚀
