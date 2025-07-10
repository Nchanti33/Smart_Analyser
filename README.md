# SmartAnalyser

---

## 🛠️ Prérequis / Prerequisites

### Français

Avant de commencer, vous devez installer Node.js et npm :

1. Rendez-vous sur le site officiel [Node.js](https://nodejs.org/).
2. Téléchargez la version LTS recommandée pour votre système (Windows, macOS ou Linux).
3. Installez Node.js en suivant les instructions de l'installateur. npm sera installé automatiquement avec Node.js.
4. Vérifiez l'installation dans un terminal :

   ```bash
   node -v
   npm -v
   ```

   Vous devez voir s'afficher les versions installées.

### English

Before starting, you need to install Node.js and npm:

1. Go to the official [Node.js](https://nodejs.org/) website.
2. Download the recommended LTS version for your system (Windows, macOS, or Linux).
3. Install Node.js by following the installer instructions. npm will be installed automatically with Node.js.
4. Check the installation in a terminal:

   ```bash
   node -v
   npm -v
   ```

   You should see the installed versions displayed.

---

## 📥 Télécharger / Download

#### Français

1. **Cloner le dépôt**

   Si vous n'avez pas Git :

   - Téléchargez et installez-le depuis [git-scm.com](https://git-scm.com/).
   - Relancez votre terminal après l'installation.
   - Vérifiez l'installation avec :

     ```bash
     git --version
     ```

   Vous pouvez ensuite cloner le dépôt :

   ```bash
   git clone <url-du-repo>
   cd Smart_Analyser
   ```

   **Ou sans Git :**

   - Rendez-vous sur la page du dépôt GitHub dans votre navigateur.
   - Cliquez sur le bouton vert "Code" puis sur "Download ZIP".
   - Décompressez l'archive ZIP téléchargée.
   - Ouvrez le dossier `Smart_Analyser` extrait.

#### English

1. **Clone the repository**

   If you don't have Git:

   - Download and install it from [git-scm.com](https://git-scm.com/).
   - Restart your terminal after installation.
   - Check the installation with:

     ```bash
     git --version
     ```

   Then you can clone the repository:

   ```bash
   git clone <repo-url>
   cd Smart_Analyser
   ```

   **Or without Git:**

   - Go to the GitHub repository page in your browser.
   - Click the green "Code" button, then "Download ZIP".
   - Unzip the downloaded archive.
   - Open the extracted `Smart_Analyser` folder.

---

## ⚙️ Installer / Install

#### Français

Dans le dossier du projet, exécutez :

```bash
npm install
```

#### English

In the project folder, run:

```bash
npm install
```

---

## 🚀 Lancer / Start

#### Français

Pour démarrer l'application en mode développement :

```bash
npm start
```

Puis ouvrez votre navigateur à l'adresse : [http://localhost:4200](http://localhost:4200)

#### English

To start the application in development mode:

```bash
npm start
```

Then open your browser at: [http://localhost:4200](http://localhost:4200)

---

## 📝 Utiliser / Use

#### Français

- Uploadez un document via l'interface.
- Naviguez dans les sections à gauche.
- Consultez et modifiez le contenu au centre.
- Visualisez le JSON brut à droite.

#### English

- Upload a document using the interface.
- Browse sections on the left.
- View and edit content in the center.
- See the raw JSON on the right.

---

## Documentation Angular CLI

Ce projet a été généré en utilisant la version 20.0.5 de [Angular CLI](https://github.com/angular/angular-cli).

### Serveur de développement

Pour démarrer un serveur de développement local, exécutez:

```bash
ng serve
```

Une fois le serveur en cours d'exécution, ouvrez votre navigateur et accédez à `http://localhost:4200/`. L'application se rechargera automatiquement chaque fois que vous modifiez l'un des fichiers sources.

### Génération de code

Angular CLI comprend des outils puissants de génération de code. Pour générer un nouveau composant, exécutez:

```bash
ng generate component nom-du-composant
```

Pour une liste complète des schémas disponibles (tels que `components`, `directives` ou `pipes`), exécutez:

```bash
ng generate --help
```

### Construction

Pour construire le projet, exécutez:

```bash
ng build
```

Cela compilera votre projet et stockera les artefacts de construction dans le répertoire `dist/`. Par défaut, la construction pour la production optimise votre application pour la performance et la vitesse.

### Exécution des tests unitaires

Pour exécuter les tests unitaires avec le test runner [Karma](https://karma-runner.github.io), utilisez la commande suivante:

```bash
ng test
```

### Exécution des tests de bout en bout

Pour les tests de bout en bout (e2e), exécutez:

```bash
ng e2e
```

Angular CLI ne fournit pas de framework de test de bout en bout par défaut. Vous pouvez en choisir un qui convient à vos besoins.

### Ressources supplémentaires

Pour plus d'informations sur l'utilisation d'Angular CLI, y compris des références détaillées des commandes, visitez la page [Aperçu et Référence des Commandes Angular CLI](https://angular.dev/tools/cli).
