import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisDataService } from '../../services/analysis-data.service';

@Component({
  selector: 'app-test-parser',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>🧪 Test du Parser JSON</h2>

      <div class="test-actions">
        <button (click)="testWithYourData()" class="test-btn">
          Tester avec vos données
        </button>
        <button (click)="testWithDifferentFormats()" class="test-btn">
          Tester différents formats
        </button>
        <button (click)="clearResults()" class="clear-btn">Effacer</button>
      </div>

      <div class="results" *ngIf="testResults.length > 0">
        <h3>Résultats du test</h3>
        <div
          class="result-item"
          *ngFor="let result of testResults; let i = index"
        >
          <div class="result-header">
            <span class="result-index">{{ i + 1 }}</span>
            <span class="result-title">{{ result.title }}</span>
            <span
              class="result-status"
              [class.success]="result.success"
              [class.error]="!result.success"
            >
              {{ result.success ? '✅' : '❌' }}
            </span>
          </div>
          <div class="result-content">
            <pre>{{ result.content }}</pre>
          </div>
        </div>
      </div>

      <div class="instructions">
        <h3>Instructions</h3>
        <p>
          Ce composant teste la logique de parsing pour s'assurer que les
          données JSON sont correctement séparées en sections.
        </p>
        <p>
          Cliquez sur "Tester avec vos données" pour utiliser l'exemple que vous
          avez fourni.
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .test-container {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .test-actions {
        margin-bottom: 20px;
        display: flex;
        gap: 10px;
      }

      .test-btn {
        background: rgb(0, 174, 141);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
      }

      .test-btn:hover {
        background: rgba(0, 174, 141, 0.8);
      }

      .clear-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
      }

      .clear-btn:hover {
        background: #c82333;
      }

      .results {
        margin-top: 20px;
      }

      .result-item {
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      }

      .result-header {
        background: #f8f9fa;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .result-index {
        background: rgb(0, 174, 141);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
      }

      .result-title {
        flex: 1;
        font-weight: bold;
      }

      .result-status.success {
        color: #28a745;
      }

      .result-status.error {
        color: #dc3545;
      }

      .result-content {
        padding: 10px;
        background: white;
      }

      .result-content pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        max-height: 200px;
        overflow-y: auto;
      }

      .instructions {
        margin-top: 30px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 4px;
      }

      .instructions h3 {
        margin-top: 0;
        color: rgb(0, 174, 141);
      }
    `,
  ],
})
export class TestParserComponent implements OnInit {
  testResults: Array<{ title: string; content: string; success: boolean }> = [];

  constructor(private analysisDataService: AnalysisDataService) {}

  ngOnInit(): void {}

  testWithYourData(): void {
    // Test avec le format exact que vous avez fourni
    const yourApiFormat = `{"Titre": "Formation des utilisateurs",
    "Paragraphe": "Une formation approfondie pour les utilisateurs responsables de la gestion du courrier entrant et sortant est requise, ainsi que des supports pédagogiques en français.",
    "Spécifications détectées": "Oui",
    "Besoins exprimés": "Accompagner les utilisateurs dans la gestion du courrier entrant et sortant",
    "Conditions": "Utilisateurs responsables identifiés",
    "Règles": "N/A",
    "Contraintes": "N/A",
    "Modalités": "Formation approfondie avec supports pédagogiques en français",
    "Résumé": "Une formation approfondie avec supports pédagogiques en français est requise pour les utilisateurs responsables de la gestion du courrier entrant et sortant."
}

{
    "Titre": "Évaluation des coûts",
    "Paragraphe": "La solution logicielle doit être livrée clé en main, compatible avec l'équipement informatique existant, inclure éventuellement un équipement complémentaire pour le scan du courrier entrant, et fournir une évaluation des coûts associés.",
    "Spécifications détectées": "Oui",
    "Besoins exprimés": "Estimation des coûts associés à la solution logicielle",
    "Conditions": "Compatibilité avec l'équipement informatique existant",
    "Règles": "N/A",
    "Contraintes": "N/A",
    "Modalités": "Fournir une évaluation des coûts associés à la solution logicielle",
    "Résumé": "La solution logicielle doit inclure une évaluation des coûts, être compatible avec l'équipement existant et potentiellement fournir un équipement complémentaire pour le scan du courrier entrant."
}`;

    console.log(
      '🧪 Test avec votre format spécifique (objets séparés par des retours à la ligne)'
    );
    this.simulateApiResponse(yourApiFormat);
  }

  testWithDifferentFormats(): void {
    const formats = [
      // Format 1: Array simple
      [
        { name: 'Test 1', value: 'Value 1' },
        { name: 'Test 2', value: 'Value 2' },
      ],

      // Format 2: Objet unique
      { name: 'Single Object', description: 'This is a single object test' },

      // Format 3: String JSON
      '[{"title": "String JSON 1"}, {"title": "String JSON 2"}]',

      // Format 4: String avec objets séparés
      '{"title": "Object 1"},{"title": "Object 2"}',
    ];

    formats.forEach((format, index) => {
      console.log(`Testing format ${index + 1}:`, format);
      this.simulateApiResponse(format);
    });
  }

  private simulateApiResponse(data: any): void {
    // Simulate the API response structure
    const mockResponse = {
      data: {
        outputs: {
          Sortie: data,
        },
      },
    };

    // Test the parsing logic
    try {
      const result = this.parseApiResponse(mockResponse);

      this.testResults.push({
        title: `Test réussi - ${result.arrayItems.length} éléments trouvés`,
        content: `completeRes: ${result.completeRes.substring(
          0,
          200
        )}...\n\narrayRes (${
          result.arrayItems.length
        } éléments):\n${result.arrayItems
          .map((item, i) => `[${i}]: ${item.substring(0, 100)}...`)
          .join('\n')}`,
        success: true,
      });
    } catch (error) {
      this.testResults.push({
        title: `Test échoué - ${error}`,
        content: `Erreur: ${error}\nDonnées: ${JSON.stringify(data, null, 2)}`,
        success: false,
      });
    }
  }

  private parseApiResponse(response: any): {
    completeRes: string;
    arrayItems: string[];
  } {
    const sortieValue = response?.data?.outputs?.Sortie;

    if (!sortieValue) {
      throw new Error('Pas de données Sortie trouvées');
    }

    const completeRes = JSON.stringify(sortieValue, null, 2);
    let arrayItems: string[] = [];

    if (Array.isArray(sortieValue)) {
      // If it's already an array, convert each element to JSON string
      arrayItems = sortieValue.map((item) => JSON.stringify(item, null, 2));
    } else if (typeof sortieValue === 'string') {
      // Try to parse as JSON first
      try {
        const parsedValue = JSON.parse(sortieValue);
        if (Array.isArray(parsedValue)) {
          arrayItems = parsedValue.map((item) => JSON.stringify(item, null, 2));
        } else {
          arrayItems = [JSON.stringify(parsedValue, null, 2)];
        }
      } catch (parseError) {
        // If it's not valid JSON, try splitting
        arrayItems = this.splitStringIntoObjects(sortieValue);
      }
    } else if (typeof sortieValue === 'object' && sortieValue !== null) {
      // If it's a single object, put it in an array
      arrayItems = [JSON.stringify(sortieValue, null, 2)];
    } else {
      // Fallback
      arrayItems = [JSON.stringify(sortieValue)];
    }

    return { completeRes, arrayItems };
  }

  private splitStringIntoObjects(value: string): string[] {
    // Try to split on patterns where } is followed by {
    if (value.includes('}{') || value.includes('},{')) {
      let normalizedValue = value.replace(/}\s*,?\s*(\r?\n)*\s*{/g, '},{');

      return normalizedValue.split('},{').map((item, index, array) => {
        let result = item.trim();

        if (index === 0 && !result.startsWith('{')) {
          result = '{' + result;
        }
        if (index === array.length - 1 && !result.endsWith('}')) {
          result = result + '}';
        }
        if (index > 0 && index < array.length - 1) {
          if (!result.startsWith('{')) {
            result = '{' + result;
          }
          if (!result.endsWith('}')) {
            result = result + '}';
          }
        }

        try {
          const parsed = JSON.parse(result);
          return JSON.stringify(parsed, null, 2);
        } catch (jsonError) {
          return result;
        }
      });
    } else {
      return [value];
    }
  }

  clearResults(): void {
    this.testResults = [];
  }
}
