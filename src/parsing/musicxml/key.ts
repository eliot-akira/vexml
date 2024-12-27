import { KeyMode } from './enums';

/** Represents a key signature. */
export class Key {
  constructor(
    private partId: string,
    private staveNumber: number,
    private fifths: number,
    private previousKey: Key | null,
    private mode: KeyMode
  ) {}

  static default(partId: string, staveNumber: number): Key {
    return new Key(partId, staveNumber, 0, null, 'none');
  }

  getPartId(): string {
    return this.partId;
  }

  getStaveNumber(): number {
    return this.staveNumber;
  }

  getFifths(): number {
    return this.fifths;
  }

  getPreviousKey(): Key | null {
    return this.previousKey;
  }

  getMode(): KeyMode {
    return this.mode;
  }

  isEqual(key: Key): boolean {
    return this.partId === key.getPartId() && this.staveNumber === key.getStaveNumber() && this.isEquivalent(key);
  }

  isEquivalent(key: Key): boolean {
    return (
      this.fifths === key.getFifths() &&
      this.mode === key.getMode() &&
      this.arePreviousKeySignaturesEquivalent(key.previousKey)
    );
  }

  private arePreviousKeySignaturesEquivalent(previousKey: Key | null): boolean {
    if (!this.previousKey || !previousKey) {
      return false;
    }
    return this.previousKey?.fifths === previousKey?.fifths && this.previousKey?.mode === previousKey?.mode;
  }
}
