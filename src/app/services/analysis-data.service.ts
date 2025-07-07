import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AnalysisDataService {
  private analysisResultSubject = new BehaviorSubject<any>(null);
  public analysisResult$ = this.analysisResultSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  // Global error state accessible from any component
  private hasErrorSubject = new BehaviorSubject<boolean>(false);
  public hasError$ = this.hasErrorSubject.asObservable();

  // Global retry data accessible from any component
  private retryDataSubject = new BehaviorSubject<{
    file: File | null;
    fileId: string | null;
    fileName: string | null;
    isUploadError: boolean;
  }>({
    file: null,
    fileId: null,
    fileName: null,
    isUploadError: false,
  });
  public retryData$ = this.retryDataSubject.asObservable();

  // Global variables store - accessible from any component
  private globalVariables = new Map<string, BehaviorSubject<any>>();

  constructor() {}

  setAnalysisResult(result: any): void {
    this.analysisResultSubject.next(result);
    this.errorSubject.next(null); // Clear any previous errors
    this.hasErrorSubject.next(false); // Clear error state
  }

  getAnalysisResult(): any {
    return this.analysisResultSubject.value;
  }

  setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  getLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  setError(error: string): void {
    this.errorSubject.next(error);
    this.isLoadingSubject.next(false);
    this.hasErrorSubject.next(true); // Set global error state
  }

  getError(): string | null {
    return this.errorSubject.value;
  }

  // Global error state methods
  setHasError(hasError: boolean): void {
    this.hasErrorSubject.next(hasError);
  }

  getHasError(): boolean {
    return this.hasErrorSubject.value;
  }

  // Retry data methods
  setRetryData(
    file: File | null,
    fileId: string | null,
    fileName: string | null,
    isUploadError: boolean
  ): void {
    this.retryDataSubject.next({
      file,
      fileId,
      fileName,
      isUploadError,
    });
  }

  getRetryData(): {
    file: File | null;
    fileId: string | null;
    fileName: string | null;
    isUploadError: boolean;
  } {
    return this.retryDataSubject.value;
  }

  clearData(): void {
    this.analysisResultSubject.next(null);
    this.isLoadingSubject.next(false);
    this.errorSubject.next(null);
    this.hasErrorSubject.next(false);
    this.retryDataSubject.next({
      file: null,
      fileId: null,
      fileName: null,
      isUploadError: false,
    });
  }

  // ======= GLOBAL VARIABLES MANAGEMENT =======

  /**
   * Creates or updates a global variable accessible from any component
   * @param key - The unique identifier for the variable
   * @param initialValue - The initial value to set (optional)
   * @returns Observable of the variable's value
   */
  createGlobalVariable<T>(
    key: string,
    initialValue?: T
  ): Observable<T | undefined> {
    if (!this.globalVariables.has(key)) {
      this.globalVariables.set(
        key,
        new BehaviorSubject<T | undefined>(initialValue)
      );
    }
    return this.globalVariables.get(key)!.asObservable();
  }

  /**
   * Sets the value of a global variable
   * @param key - The unique identifier for the variable
   * @param value - The new value to set
   */
  setGlobalVariable<T>(key: string, value: T): void {
    if (this.globalVariables.has(key)) {
      this.globalVariables.get(key)!.next(value);
    } else {
      // Create the variable if it doesn't exist
      this.globalVariables.set(key, new BehaviorSubject<T>(value));
    }
  }

  /**
   * Gets the current value of a global variable
   * @param key - The unique identifier for the variable
   * @returns The current value or undefined if the variable doesn't exist
   */
  getGlobalVariable<T>(key: string): T | undefined {
    return this.globalVariables.has(key)
      ? this.globalVariables.get(key)!.value
      : undefined;
  }

  /**
   * Gets an observable for a global variable
   * @param key - The unique identifier for the variable
   * @returns Observable of the variable's value or undefined if the variable doesn't exist
   */
  getGlobalVariable$<T>(key: string): Observable<T | undefined> | undefined {
    return this.globalVariables.has(key)
      ? this.globalVariables.get(key)!.asObservable()
      : undefined;
  }

  /**
   * Removes a global variable
   * @param key - The unique identifier for the variable
   */
  removeGlobalVariable(key: string): void {
    if (this.globalVariables.has(key)) {
      this.globalVariables.get(key)!.complete();
      this.globalVariables.delete(key);
    }
  }

  /**
   * Lists all global variable keys
   * @returns Array of all variable keys
   */
  listGlobalVariables(): string[] {
    return Array.from(this.globalVariables.keys());
  }

  /**
   * Clears all global variables
   */
  clearAllGlobalVariables(): void {
    this.globalVariables.forEach((subject) => subject.complete());
    this.globalVariables.clear();
  }

  /**
   * Checks if a global variable exists
   * @param key - The unique identifier for the variable
   * @returns true if the variable exists, false otherwise
   */
  hasGlobalVariable(key: string): boolean {
    return this.globalVariables.has(key);
  }
}
