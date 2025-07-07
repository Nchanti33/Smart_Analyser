import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './left-panel.component.html',
  styleUrl: './left-panel.component.css',
})
export class LeftPanelComponent {
  @Input() arrayRes: string[] = [];
  @Input() selectedIndex: number = 0;
  @Output() sectionSelected = new EventEmitter<number>();

  onSelectSection(index: number): void {
    this.sectionSelected.emit(index);
  }

  getPreview(text: string): string {
    if (!text || typeof text !== 'string') return 'Section invalide';

    try {
      // Try to parse as JSON and get a meaningful preview
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null) {
        // Look for common title/identification fields
        const titleFields = [
          'Titre',
          'Title',
          'titre',
          'title',
          'name',
          'Name',
          'nom',
          'Nom',
        ];

        // Try to find a title field
        for (const field of titleFields) {
          if (parsed[field] && typeof parsed[field] === 'string') {
            const title = parsed[field].trim();
            return title.length > 50 ? title.substring(0, 50) + '...' : title;
          }
        }

        // If no title found, look for other meaningful fields
        const meaningfulFields = [
          'Paragraphe',
          'description',
          'Description',
          'summary',
          'Summary',
          'résumé',
          'Résumé',
        ];
        for (const field of meaningfulFields) {
          if (parsed[field] && typeof parsed[field] === 'string') {
            const content = parsed[field].trim();
            return content.length > 50
              ? content.substring(0, 50) + '...'
              : content;
          }
        }

        // If still no meaningful content, use the first available field
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstValue = parsed[firstKey];
          if (typeof firstValue === 'string') {
            const preview = firstValue.trim();
            return preview.length > 50
              ? preview.substring(0, 50) + '...'
              : preview;
          } else if (Array.isArray(firstValue)) {
            return `${firstKey}: [${firstValue.length} éléments]`;
          } else {
            return `${firstKey}: ${String(firstValue).substring(0, 30)}`;
          }
        }
      }
      return (
        String(parsed).substring(0, 50) +
        (String(parsed).length > 50 ? '...' : '')
      );
    } catch (error) {
      // If not valid JSON, return truncated text
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
  }

  isValidSection(text: string): boolean {
    return !!(text && typeof text === 'string' && text.trim().length > 0);
  }
}
