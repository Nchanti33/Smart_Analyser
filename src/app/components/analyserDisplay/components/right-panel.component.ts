import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './right-panel.component.html',
  styleUrl: './right-panel.component.css',
})
export class RightPanelComponent {
  @Input() completeRes: string = '';

  get formattedJson(): string {
    try {
      // Parse and re-stringify to ensure proper JSON formatting
      const parsed = JSON.parse(this.completeRes);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      // If it's not valid JSON, return as-is with better formatting
      return this.completeRes;
    }
  }

  get coloredJson(): string {
    try {
      const parsed = JSON.parse(this.completeRes);
      return this.syntaxHighlight(JSON.stringify(parsed, null, 2));
    } catch (error) {
      return this.completeRes;
    }
  }

  private syntaxHighlight(json: string): string {
    // Simple JSON syntax highlighting
    json = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }

  get parsedData(): any {
    try {
      return JSON.parse(this.completeRes);
    } catch (error) {
      return null;
    }
  }

  get isValidJson(): boolean {
    try {
      JSON.parse(this.completeRes);
      return true;
    } catch (error) {
      return false;
    }
  }

  downloadJson(): void {
    if (!this.completeRes) return;

    const blob = new Blob([this.formattedJson], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-result-${
      new Date().toISOString().split('T')[0]
    }.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  copyJsonToClipboard(): void {
    if (this.completeRes) {
      navigator.clipboard
        .writeText(this.formattedJson)
        .then(() => {
          // console.log('JSON copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy JSON:', err);
        });
    }
  }

  getValueType(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }

  isExpandable(value: any): boolean {
    return typeof value === 'object' && value !== null;
  }
}
