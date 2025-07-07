import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-center-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './center-panel.component.html',
  styleUrl: './center-panel.component.css',
})
export class CenterPanelComponent {
  @Input() selectedContent: string = '';
  @Input() sectionIndex: number = 0;

  get formattedContent(): string {
    if (!this.selectedContent) return '';

    try {
      // Try to parse and format as JSON
      const parsed = JSON.parse(this.selectedContent);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      // If not valid JSON, return as-is
      return this.selectedContent;
    }
  }

  get parsedData(): any {
    if (!this.selectedContent) return null;

    try {
      return JSON.parse(this.selectedContent);
    } catch (error) {
      return null;
    }
  }

  get isValidJson(): boolean {
    try {
      JSON.parse(this.selectedContent);
      return true;
    } catch (error) {
      return false;
    }
  }

  getObjectKeys(): string[] {
    const data = this.parsedData;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return Object.keys(data);
    }
    return [];
  }

  getValueForKey(key: string): any {
    const data = this.parsedData;
    if (data && typeof data === 'object') {
      return data[key];
    }
    return null;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  copyToClipboard(): void {
    if (this.selectedContent) {
      navigator.clipboard
        .writeText(this.selectedContent)
        .then(() => {
          // console.log('Section content copied to clipboard');
        })
        .catch((err) => {
          console.error('Failed to copy section content:', err);
        });
    }
  }
}
