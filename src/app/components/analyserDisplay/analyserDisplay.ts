import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AnalysisDataService } from '../../services/analysis-data.service';
import { Subscription } from 'rxjs';
import { LeftPanelComponent } from './components/left-panel.component';
import { CenterPanelComponent } from './components/center-panel.component';
import { RightPanelComponent } from './components/right-panel.component';

@Component({
  selector: 'app-analyser-display',
  standalone: true,
  imports: [
    CommonModule,
    LeftPanelComponent,
    CenterPanelComponent,
    RightPanelComponent,
  ],
  templateUrl: './analyserDisplay.html',
  styleUrl: './analyserDisplay.css',
})
export class AnalyserDisplayComponent implements OnInit, OnDestroy {
  analysisResult: any = null;
  isLoading: boolean = false;
  private subscription?: Subscription;

  // Processed data variables
  completeRes: string = '';
  arrayRes: string[] = [];
  selectedIndex: number = 0;

  constructor(
    private router: Router,
    private analysisDataService: AnalysisDataService
  ) {}

  ngOnInit(): void {
    this.subscription = this.analysisDataService.analysisResult$.subscribe({
      next: (result) => {
        if (result) {
          this.analysisResult = result;
          this.processApiResponse(result);
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error getting analysis data:', error);
        this.isLoading = false;
      },
    });

    // Subscribe to loading state
    this.analysisDataService.isLoading$.subscribe((loading) => {
      this.isLoading = loading;
    });

    // If no data is available, redirect to upload page
    if (
      !this.analysisDataService.getAnalysisResult() &&
      !this.analysisDataService.getLoading()
    ) {
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onClose(): void {
    this.router.navigate(['/']);
  }

  getAnalysisTitle(): string {
    return this.isLoading ? 'Traitement en cours...' : "Résultats d'analyse";
  }

  onSectionSelected(index: number): void {
    this.selectedIndex = index;
  }

  get selectedContent(): string {
    return this.arrayRes[this.selectedIndex] || '';
  }

  private processApiResponse(response: any): void {
    try {
      // Extract completeRes from response.data.outputs.Sortie
      if (response?.data?.outputs?.Sortie) {
        const sortieValue = response.data.outputs.Sortie;

        console.log('🔍 Raw sortieValue type:', typeof sortieValue);
        console.log(
          '🔍 Raw sortieValue preview:',
          String(sortieValue).substring(0, 200)
        );

        // Store the complete response as formatted JSON
        this.completeRes =
          typeof sortieValue === 'string'
            ? sortieValue
            : JSON.stringify(sortieValue, null, 2);

        // Process arrayRes based on the data type
        if (Array.isArray(sortieValue)) {
          // If it's already an array, convert each element to JSON string
          this.arrayRes = sortieValue.map((item) => {
            return JSON.stringify(item, null, 2);
          });
          console.log(
            '✅ Array detected, processed',
            this.arrayRes.length,
            'items'
          );
        } else if (typeof sortieValue === 'string') {
          console.log('🔍 Processing string value...');
          this.arrayRes = this.parseStringToObjects(sortieValue);
        } else if (typeof sortieValue === 'object' && sortieValue !== null) {
          // If it's a single object, put it in an array
          this.arrayRes = [JSON.stringify(sortieValue, null, 2)];
          console.log('✅ Single object detected');
        } else {
          // Fallback: convert to string and put in array
          this.arrayRes = [JSON.stringify(sortieValue)];
          console.log('⚠️ Unknown data type, using fallback');
        }
      } else {
        // Fallback if Sortie doesn't exist
        this.completeRes = JSON.stringify(response, null, 2);
        this.arrayRes = [JSON.stringify(response, null, 2)];
        console.log('⚠️ No Sortie found, using full response');
      }

      console.log('🔍 Final arrayRes processing result:');
      console.log('  - Total items:', this.arrayRes.length);
      console.log('  - Complete response length:', this.completeRes.length);

      // Log first few items for debugging
      this.arrayRes.slice(0, 2).forEach((item, index) => {
        console.log(
          `  [${index}] Preview:`,
          item.substring(0, 150) + (item.length > 150 ? '...' : '')
        );
      });
    } catch (error) {
      console.error('❌ Error processing API response:', error);
      this.completeRes = JSON.stringify(response, null, 2);
      this.arrayRes = [JSON.stringify(response, null, 2)];

      // Signal error to analysis data service so upload page can show retry button
      this.analysisDataService.setError(
        'Error processing analysis results. Data may be malformed.'
      );
    }

    // Reset selection to first item
    this.selectedIndex = 0;
  }

  // Robust string parsing method for various formats from generative AI
  private parseStringToObjects(value: string): string[] {
    console.log('🔍 parseStringToObjects - input length:', value.length);
    console.log('🔍 parseStringToObjects - preview:', value.substring(0, 200));

    try {
      // Strategy 1: Try to parse as valid JSON first
      try {
        const parsed = JSON.parse(value);
        console.log(
          '✅ String is valid JSON, type:',
          typeof parsed,
          'Array?',
          Array.isArray(parsed)
        );

        if (Array.isArray(parsed)) {
          return parsed.map((item) => JSON.stringify(item, null, 2));
        } else {
          return [JSON.stringify(parsed, null, 2)];
        }
      } catch (jsonError) {
        console.log('⚠️ Not valid JSON, trying AI-aware parsing strategies...');
      }

      // Strategy 2: Use comprehensive AI-aware parsing
      return this.parseGenerativeAIFormats(value);
    } catch (error) {
      console.error('❌ parseStringToObjects failed:', error);
      return [value]; // Return original value as fallback
    }
  }

  // Comprehensive parsing for various AI-generated formats
  private parseGenerativeAIFormats(value: string): string[] {
    console.log('🤖 parseGenerativeAIFormats - handling AI-generated content');

    const cleanValue = value.trim();

    // Step 1: Try to extract all JSON-like objects using regex
    const jsonObjects = this.extractAllJsonObjects(cleanValue);

    if (jsonObjects.length > 1) {
      console.log(
        '✅ Extracted',
        jsonObjects.length,
        'JSON objects using regex'
      );
      return jsonObjects;
    }

    // Step 2: Try pattern-based splitting
    const patternResults = this.parseObjectsSeparatedByNewlines(cleanValue);
    if (patternResults.length > 1) {
      console.log(
        '✅ Pattern-based splitting found',
        patternResults.length,
        'objects'
      );
      return patternResults;
    }

    // Step 3: Try bracket-based parsing for incomplete arrays
    const bracketResults = this.parseIncompleteArrays(cleanValue);
    if (bracketResults.length > 1) {
      console.log(
        '✅ Bracket-based parsing found',
        bracketResults.length,
        'objects'
      );
      return bracketResults;
    }

    // Step 4: Fallback to single object
    console.log('⚠️ Fallback to single object parsing');
    try {
      const parsed = JSON.parse(cleanValue);
      return [JSON.stringify(parsed, null, 2)];
    } catch (singleError) {
      console.log('⚠️ Single object parsing failed, returning as-is');
      return [cleanValue];
    }
  }

  // Extract all JSON objects from a string using regex
  private extractAllJsonObjects(value: string): string[] {
    console.log('🔍 extractAllJsonObjects - searching for JSON objects');

    const objects: string[] = [];
    const cleanValue = value.trim();

    // Regex to match JSON objects (simplified but effective for most cases)
    const jsonObjectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let match;

    while ((match = jsonObjectRegex.exec(cleanValue)) !== null) {
      const objectStr = match[0];

      try {
        // Try to parse to validate it's proper JSON
        const parsed = JSON.parse(objectStr);
        const formatted = JSON.stringify(parsed, null, 2);
        objects.push(formatted);
        console.log('✅ Found valid JSON object:', parsed.Titre || 'unnamed');
      } catch (parseError) {
        console.log('⚠️ Invalid JSON object found, attempting repair...');

        // Try to repair common issues
        const repaired = this.repairJsonObject(objectStr);
        if (repaired) {
          objects.push(repaired);
        }
      }
    }

    return objects;
  }

  // Try to repair common JSON issues
  private repairJsonObject(objectStr: string): string | null {
    try {
      let cleaned = objectStr.trim();

      // Remove trailing commas before closing braces
      cleaned = cleaned.replace(/,(\s*})/g, '$1');

      // Ensure proper quote escaping
      cleaned = cleaned.replace(
        /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
        '$1"$2":'
      );

      // Try to parse the repaired object
      const parsed = JSON.parse(cleaned);
      const formatted = JSON.stringify(parsed, null, 2);
      console.log('✅ Repaired JSON object:', parsed.Titre || 'unnamed');
      return formatted;
    } catch (repairError) {
      console.log('⚠️ Could not repair JSON object');
      return null;
    }
  }

  // Handle incomplete arrays or objects separated by commas
  private parseIncompleteArrays(value: string): string[] {
    console.log(
      '🔍 parseIncompleteArrays - checking for incomplete array formats'
    );

    const cleanValue = value.trim();

    // Check if it looks like an array without brackets
    if (cleanValue.includes('},{') || cleanValue.includes('},\n{')) {
      console.log(
        '🔧 Found comma-separated objects, attempting to parse as array'
      );

      // Try to wrap in array brackets
      let arrayString = cleanValue;
      if (!arrayString.startsWith('[')) {
        arrayString = '[' + arrayString;
      }
      if (!arrayString.endsWith(']')) {
        arrayString = arrayString + ']';
      }

      try {
        const parsed = JSON.parse(arrayString);
        if (Array.isArray(parsed)) {
          console.log(
            '✅ Successfully parsed as array:',
            parsed.length,
            'items'
          );
          return parsed.map((item) => JSON.stringify(item, null, 2));
        }
      } catch (arrayError) {
        console.log('⚠️ Array parsing failed, trying manual split');

        // Manual split approach
        const parts = cleanValue.split(/},\s*{/);
        return parts
          .map((part, index) => {
            let cleanPart = part.trim();

            // Add missing braces
            if (index > 0 && !cleanPart.startsWith('{')) {
              cleanPart = '{' + cleanPart;
            }
            if (index < parts.length - 1 && !cleanPart.endsWith('}')) {
              cleanPart = cleanPart + '}';
            }

            try {
              const parsed = JSON.parse(cleanPart);
              return JSON.stringify(parsed, null, 2);
            } catch (partError) {
              console.log('⚠️ Failed to parse part', index);
              return cleanPart;
            }
          })
          .filter((part) => part && part.trim().length > 0);
      }
    }

    return [];
  }
  // Specialized method for handling JSON objects separated by newlines
  private parseObjectsSeparatedByNewlines(value: string): string[] {
    console.log(
      '🔧 parseObjectsSeparatedByNewlines - checking for newline-separated objects'
    );

    const cleanValue = value.trim();

    // Look for multiple patterns that indicate object separation
    const patterns = [
      { regex: /},\s*\n\s*{/g, name: '},\\n{' }, // },\n{ (most common)
      { regex: /}\s*\n+\s*{/g, name: '}\\n+{' }, // }\n\n{ or }\n{
      { regex: /}\s*,\s*\n\s*{/g, name: '},\\n{' }, // },\n{
      { regex: /},\s*{/g, name: '},{' }, // },{ (inline, no newline)
    ];

    let bestPattern = null;
    let maxMatches = 0;

    // Find the pattern that matches the most
    for (const pattern of patterns) {
      const matches = cleanValue.match(pattern.regex);
      const matchCount = matches ? matches.length : 0;
      console.log(`🔍 Pattern ${pattern.name}: ${matchCount} matches`);

      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestPattern = pattern;
      }
    }

    if (bestPattern && maxMatches > 0) {
      console.log(
        '✅ Found',
        maxMatches,
        'separators with pattern:',
        bestPattern.name
      );

      // Split on the pattern while preserving the braces
      const parts = cleanValue.split(bestPattern.regex);
      console.log('🔧 Split into', parts.length, 'parts');

      const results = parts
        .map((part, index) => {
          let cleanPart = part.trim();

          // Remove array brackets if present
          if (cleanPart.startsWith('[')) {
            cleanPart = cleanPart.substring(1).trim();
          }
          if (cleanPart.endsWith(']')) {
            cleanPart = cleanPart.substring(0, cleanPart.length - 1).trim();
          }

          // For the first part, it should already end with }
          // For the last part, it should already start with {
          // For middle parts, we need to add both { and }

          if (index > 0 && !cleanPart.startsWith('{')) {
            cleanPart = '{' + cleanPart;
          }

          if (index < parts.length - 1 && !cleanPart.endsWith('}')) {
            cleanPart = cleanPart + '}';
          }

          // Remove trailing comma if present
          if (cleanPart.endsWith(',}')) {
            cleanPart = cleanPart.slice(0, -2) + '}';
          }

          // Try to parse and format the individual object
          try {
            const parsed = JSON.parse(cleanPart);
            const formatted = JSON.stringify(parsed, null, 2);
            console.log(
              `✅ Newline-separated part ${index} parsed successfully (${
                parsed.Titre || 'no title'
              })`
            );
            return formatted;
          } catch (partError) {
            console.log(
              `⚠️ Newline-separated part ${index} failed to parse:`,
              partError
            );
            console.log(`⚠️ Part content:`, cleanPart.substring(0, 100));

            // Try to repair the object
            const repaired = this.repairJsonObject(cleanPart);
            if (repaired) {
              console.log(`✅ Repaired part ${index} successfully`);
              return repaired;
            }

            return cleanPart;
          }
        })
        .filter((part) => part && part.trim().length > 0);

      return results;
    }

    return [];
  }
}
