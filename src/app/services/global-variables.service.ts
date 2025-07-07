import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnalysisDataService } from './analysis-data.service';

@Injectable({
  providedIn: 'root',
})
export class GlobalVariablesService {
  constructor(private analysisDataService: AnalysisDataService) {}

  // ======= CONVENIENT METHODS FOR GLOBAL VARIABLES =======

  /**
   * Creates a global string variable
   * @param key - Variable name
   * @param initialValue - Initial value
   * @returns Observable of string value
   */
  createString(
    key: string,
    initialValue: string = ''
  ): Observable<string | undefined> {
    return this.analysisDataService.createGlobalVariable<string>(
      key,
      initialValue
    );
  }

  /**
   * Creates a global number variable
   * @param key - Variable name
   * @param initialValue - Initial value
   * @returns Observable of number value
   */
  createNumber(
    key: string,
    initialValue: number = 0
  ): Observable<number | undefined> {
    return this.analysisDataService.createGlobalVariable<number>(
      key,
      initialValue
    );
  }

  /**
   * Creates a global boolean variable
   * @param key - Variable name
   * @param initialValue - Initial value
   * @returns Observable of boolean value
   */
  createBoolean(
    key: string,
    initialValue: boolean = false
  ): Observable<boolean | undefined> {
    return this.analysisDataService.createGlobalVariable<boolean>(
      key,
      initialValue
    );
  }

  /**
   * Creates a global array variable
   * @param key - Variable name
   * @param initialValue - Initial value
   * @returns Observable of array value
   */
  createArray<T>(
    key: string,
    initialValue: T[] = []
  ): Observable<T[] | undefined> {
    return this.analysisDataService.createGlobalVariable<T[]>(
      key,
      initialValue
    );
  }

  /**
   * Creates a global object variable
   * @param key - Variable name
   * @param initialValue - Initial value
   * @returns Observable of object value
   */
  createObject<T>(
    key: string,
    initialValue: T | null = null
  ): Observable<T | null | undefined> {
    return this.analysisDataService.createGlobalVariable<T | null>(
      key,
      initialValue
    );
  }

  // ======= SETTER METHODS =======

  /**
   * Sets a string value
   */
  setString(key: string, value: string): void {
    this.analysisDataService.setGlobalVariable(key, value);
  }

  /**
   * Sets a number value
   */
  setNumber(key: string, value: number): void {
    this.analysisDataService.setGlobalVariable(key, value);
  }

  /**
   * Sets a boolean value
   */
  setBoolean(key: string, value: boolean): void {
    this.analysisDataService.setGlobalVariable(key, value);
  }

  /**
   * Sets an array value
   */
  setArray<T>(key: string, value: T[]): void {
    this.analysisDataService.setGlobalVariable(key, value);
  }

  /**
   * Sets an object value
   */
  setObject<T>(key: string, value: T): void {
    this.analysisDataService.setGlobalVariable(key, value);
  }

  // ======= GETTER METHODS =======

  /**
   * Gets a string value
   */
  getString(key: string): string | undefined {
    return this.analysisDataService.getGlobalVariable<string>(key);
  }

  /**
   * Gets a number value
   */
  getNumber(key: string): number | undefined {
    return this.analysisDataService.getGlobalVariable<number>(key);
  }

  /**
   * Gets a boolean value
   */
  getBoolean(key: string): boolean | undefined {
    return this.analysisDataService.getGlobalVariable<boolean>(key);
  }

  /**
   * Gets an array value
   */
  getArray<T>(key: string): T[] | undefined {
    return this.analysisDataService.getGlobalVariable<T[]>(key);
  }

  /**
   * Gets an object value
   */
  getObject<T>(key: string): T | undefined {
    return this.analysisDataService.getGlobalVariable<T>(key);
  }

  // ======= OBSERVABLE METHODS =======

  /**
   * Gets an observable for a string variable
   */
  getString$(key: string): Observable<string | undefined> | undefined {
    return this.analysisDataService.getGlobalVariable$<string>(key);
  }

  /**
   * Gets an observable for a number variable
   */
  getNumber$(key: string): Observable<number | undefined> | undefined {
    return this.analysisDataService.getGlobalVariable$<number>(key);
  }

  /**
   * Gets an observable for a boolean variable
   */
  getBoolean$(key: string): Observable<boolean | undefined> | undefined {
    return this.analysisDataService.getGlobalVariable$<boolean>(key);
  }

  /**
   * Gets an observable for an array variable
   */
  getArray$<T>(key: string): Observable<T[] | undefined> | undefined {
    return this.analysisDataService.getGlobalVariable$<T[]>(key);
  }

  /**
   * Gets an observable for an object variable
   */
  getObject$<T>(key: string): Observable<T | undefined> | undefined {
    return this.analysisDataService.getGlobalVariable$<T>(key);
  }

  // ======= UTILITY METHODS =======

  /**
   * Checks if a variable exists
   */
  exists(key: string): boolean {
    return this.analysisDataService.hasGlobalVariable(key);
  }

  /**
   * Removes a variable
   */
  remove(key: string): void {
    this.analysisDataService.removeGlobalVariable(key);
  }

  /**
   * Lists all variable keys
   */
  listAll(): string[] {
    return this.analysisDataService.listGlobalVariables();
  }

  /**
   * Clears all variables
   */
  clearAll(): void {
    this.analysisDataService.clearAllGlobalVariables();
  }

  // ======= CONVENIENCE METHODS FOR COMMON PATTERNS =======

  /**
   * Increments a number variable
   */
  increment(key: string, amount: number = 1): void {
    const current = this.getNumber(key) || 0;
    this.setNumber(key, current + amount);
  }

  /**
   * Decrements a number variable
   */
  decrement(key: string, amount: number = 1): void {
    const current = this.getNumber(key) || 0;
    this.setNumber(key, current - amount);
  }

  /**
   * Toggles a boolean variable
   */
  toggle(key: string): void {
    const current = this.getBoolean(key) || false;
    this.setBoolean(key, !current);
  }

  /**
   * Appends an item to an array variable
   */
  appendToArray<T>(key: string, item: T): void {
    const current = this.getArray<T>(key) || [];
    this.setArray(key, [...current, item]);
  }

  /**
   * Removes an item from an array variable
   */
  removeFromArray<T>(key: string, item: T): void {
    const current = this.getArray<T>(key) || [];
    this.setArray(
      key,
      current.filter((i) => i !== item)
    );
  }

  /**
   * Clears an array variable
   */
  clearArray(key: string): void {
    this.setArray(key, []);
  }
}
