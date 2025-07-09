import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-center-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './center-panel.component.html',
  styleUrl: './center-panel.component.css',
})
export class CenterPanelComponent {
  @Input() selectedContent: string = '';
  @Input() sectionIndex: number = 0;
  @Output() contentModified = new EventEmitter<{
    index: number;
    content: string;
  }>();

  isEditing: boolean = false;
  editContent: string = '';
  editingField: string | null = null;
  tempEditValues: { [key: string]: any } = {};

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

  startEditing(): void {
    this.isEditing = true;
    this.editContent = this.selectedContent;
    this.tempEditValues = {};

    // Initialize temp values for structured editing
    if (this.isValidJson && this.parsedData) {
      this.tempEditValues = { ...this.parsedData };
    }
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.editContent = '';
    this.editingField = null;
    this.tempEditValues = {};
  }

  saveChanges(): void {
    try {
      let finalContent: string;

      if (this.isValidJson && this.parsedData) {
        // For structured JSON, use the temp values
        finalContent = JSON.stringify(this.tempEditValues, null, 2);
      } else {
        // For raw content, use the text area content
        finalContent = this.editContent;
      }

      // Emit the changes to parent component
      this.contentModified.emit({
        index: this.sectionIndex,
        content: finalContent,
      });

      this.isEditing = false;
      this.editContent = '';
      this.editingField = null;
      this.tempEditValues = {};

      // Show success feedback
      this.showSuccessMessage();
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Erreur lors de la sauvegarde. Veuillez vérifier le format JSON.');
    }
  }

  private showSuccessMessage(): void {
    // Create a temporary success message
    const successElement = document.createElement('div');
    successElement.textContent = '✅ Modifications sauvegardées avec succès!';
    successElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    document.body.appendChild(successElement);

    // Remove the message after 3 seconds
    setTimeout(() => {
      if (document.body.contains(successElement)) {
        document.body.removeChild(successElement);
      }
    }, 3000);
  }

  startFieldEditing(field: string): void {
    this.editingField = field;
  }

  saveFieldEdit(field: string): void {
    this.editingField = null;
  }

  cancelFieldEdit(): void {
    this.editingField = null;
    // Reset temp values
    if (this.isValidJson && this.parsedData) {
      this.tempEditValues = { ...this.parsedData };
    }
  }

  getEditValue(key: string): any {
    return this.tempEditValues[key] !== undefined
      ? this.tempEditValues[key]
      : this.getValueForKey(key);
  }

  setEditValue(key: string, value: any): void {
    this.tempEditValues[key] = value;
  }

  formatForInput(value: any): string {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  }

  parseInputValue(value: string): any {
    // Try to parse as JSON first
    try {
      return JSON.parse(value);
    } catch {
      // If not valid JSON, return as string
      return value;
    }
  }

  onFieldInput(key: string, event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      const value = this.parseInputValue(target.value);
      this.setEditValue(key, value);
    }
  }
}
