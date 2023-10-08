import * as musicxml from '@/musicxml';
import * as vexflow from 'vexflow';
import { Config } from './config';
import { NoteDurationDenominator } from './enums';
import { Fraction } from '../util';

/** The result of rendering a Rest. */
export type RestRendering = {
  type: 'rest';
  vexflow: {
    staveNote: vexflow.StaveNote;
  };
};

/**
 * Represents a musical rest, denoting a pause or silence in the music.
 *
 * The `Rest` class encapsulates the absence of sound within a specific duration in music notation. Just as notes define
 * when and how sound is produced, rests define when it's deliberately not. Each rest, much like its note counterpart,
 * has a rhythmic value determining its length.
 *
 * In musical compositions, rests play an essential role in shaping the music's rhythm, phrasing, and overall dynamics,
 * allowing for moments of reflection or anticipation.
 */
export class Rest {
  private config: Config;
  private displayPitch: string | null;
  private durationDenominator: NoteDurationDenominator;
  private dotCount: number;
  private clefType: musicxml.ClefType;

  private constructor(opts: {
    config: Config;
    displayPitch: string | null;
    durationDenominator: NoteDurationDenominator;
    dotCount: number;
    clefType: musicxml.ClefType;
  }) {
    this.config = opts.config;
    this.displayPitch = opts.displayPitch;
    this.durationDenominator = opts.durationDenominator;
    this.dotCount = opts.dotCount;
    this.clefType = opts.clefType;
  }

  /** Creates the Rest. */
  static create(opts: {
    config: Config;
    musicXml: {
      note: musicxml.Note;
    };
    durationDenominator: NoteDurationDenominator;
    clefType: musicxml.ClefType;
  }): Rest {
    const note = opts.musicXml.note;

    return new Rest({
      config: opts.config,
      displayPitch: note.getRestDisplayPitch(),
      durationDenominator: opts.durationDenominator,
      dotCount: note.getDotCount(),
      clefType: opts.clefType,
    });
  }

  /** Creates a whole rest. */
  static whole(opts: { config: Config; clefType: musicxml.ClefType }): Rest {
    return new Rest({
      config: opts.config,
      displayPitch: null,
      durationDenominator: '1',
      dotCount: 0,
      clefType: opts.clefType,
    });
  }

  /** Clones the Rest. */
  clone(): Rest {
    return new Rest({
      config: this.config,
      displayPitch: this.displayPitch,
      durationDenominator: this.durationDenominator,
      dotCount: this.dotCount,
      clefType: this.clefType,
    });
  }

  /** Renders the Rest. */
  render(opts: { voiceEntryCount: number }): RestRendering {
    const vfStaveNote = new vexflow.StaveNote({
      keys: [this.getKey()],
      duration: `${this.durationDenominator}r`,
      dots: this.dotCount,
      alignCenter: this.shouldCenter(opts.voiceEntryCount),
      clef: this.clefType,
    });

    for (let index = 0; index < this.dotCount; index++) {
      vexflow.Dot.buildAndAttach([vfStaveNote]);
    }

    return { type: 'rest', vexflow: { staveNote: vfStaveNote } };
  }

  private getKey(): string {
    if (this.displayPitch) {
      return this.displayPitch;
    }
    if (this.clefType === 'bass') {
      return 'D/3';
    }
    if (this.durationDenominator === '2') {
      return 'B/4';
    }
    return 'D/5';
  }

  private shouldCenter(voiceEntryCount: number): boolean {
    if (voiceEntryCount > 1) {
      return false;
    }
    if (this.durationDenominator === '1') {
      return true;
    }
    if (this.durationDenominator === '2') {
      return true;
    }
    return false;
  }
}
