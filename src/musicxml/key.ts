import { NamedElement } from '@/util';
import { KEY_MODES, KeyMode } from './enums';

/**
 * Key represents a key signature.
 *
 * See https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/key/
 */
export class Key {
  constructor(private element: NamedElement<'key'>) {}

  /** Returns the fifths count of the key. Defaults to 0. */
  getFifthsCount(): number {
    return this.element.first('fifths')?.content().int() ?? 0;
  }

  /** Returns the mode of the key. Defaults to 'none'. */
  getMode(): KeyMode {
    return this.element.first('mode')?.content().enum(KEY_MODES) ?? 'none';
  }

  /** Returns the stave number this key belongs to. */
  getStaveNumber(): number {
    return this.element.attr('number').withDefault(1).int();
  }

  /** Returns the key signature based on the fifths count. */
  getKeySignature(): string {
    switch (this.getFifthsCount()) {
      case 1:
        return 'G';
      case 2:
        return 'D';
      case 3:
        return 'A';
      case 4:
        return 'E';
      case 5:
        return 'B';
      case 6:
        return 'F#';
      case 7:
        return 'C#';
      case -1:
        return 'F';
      case -2:
        return 'Bb';
      case -3:
        return 'Eb';
      case -4:
        return 'Ab';
      case -5:
        return 'Cb';
      case -6:
        return 'Gb';
      case -7:
        return 'Cb';
      default:
        return 'C';
    }
  }
}
