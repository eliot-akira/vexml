import * as musicxml from '@/musicxml';
import * as vexflow from 'vexflow';
import { Config } from './config';
import * as util from '@/util';
import { MultiRest, MultiRestRendering } from './multirest';
import { Chorus, ChorusRendering } from './chorus';
import { Tablature, TablatureRendering } from './tablature';
import { KeySignature } from './keysignature';
import { Clef } from './clef';
import { MeasureEntry, StaveSignature } from './stavesignature';
import { TimeSignature } from './timesignature';
import { Voice } from './voice';

/** A possible component of a Stave. */
export type StaveEntry = Chorus | MultiRest | Tablature;

/** The result of rendering a Stave entry. */
export type StaveEntryRendering = ChorusRendering | MultiRestRendering | TablatureRendering;

/** The result of rendering a Stave. */
export type StaveRendering = {
  type: 'stave';
  staveNumber: number;
  width: number;
  vexflow: {
    stave: vexflow.Stave;
    beginningBarlineType: vexflow.BarlineType;
    endBarlineType: vexflow.BarlineType;
  };
  entry: StaveEntryRendering;
};

/** The modifiers of a stave. */
export type StaveModifier = 'clef' | 'keySignature' | 'timeSignature';

/**
 * Represents a single stave (or staff) in a measure, providing the graphical foundation for musical symbols such as
 * notes, rests, clefs, and key signatures.
 *
 * The `Stave` class acts as a container for musical elements that are vertically aligned in a score or sheet music. It
 * typically corresponds to a specific voice or set of voices, especially in multi-stave instruments like the piano.
 */
export class Stave {
  private config: Config;
  private measureIndex: number;
  private measureFragmentIndex: number;
  private systemId: symbol;
  private staveNumber: number;
  private clef: Clef;
  private timeSignature: TimeSignature;
  private keySignature: KeySignature;
  private beginningBarStyle: musicxml.BarStyle;
  private endBarStyle: musicxml.BarStyle;
  private entry: StaveEntry;
  private previousKeySignature: KeySignature | null;
  private metronome: musicxml.Metronome | null;

  private constructor(opts: {
    config: Config;
    measureIndex: number;
    measureFragmentIndex: number;
    systemId: symbol;
    staveNumber: number;
    clef: Clef;
    timeSignature: TimeSignature;
    keySignature: KeySignature;
    beginningBarStyle: musicxml.BarStyle;
    endBarStyle: musicxml.BarStyle;
    entry: StaveEntry;
    previousKeySignature: KeySignature | null;
    metronome: musicxml.Metronome | null;
  }) {
    this.config = opts.config;
    this.measureIndex = opts.measureIndex;
    this.measureFragmentIndex = opts.measureFragmentIndex;
    this.systemId = opts.systemId;
    this.staveNumber = opts.staveNumber;
    this.timeSignature = opts.timeSignature;
    this.keySignature = opts.keySignature;
    this.beginningBarStyle = opts.beginningBarStyle;
    this.endBarStyle = opts.endBarStyle;
    this.clef = opts.clef;
    this.entry = opts.entry;
    this.previousKeySignature = opts.previousKeySignature;
    this.metronome = opts.metronome;
  }

  /** Creates a Stave. */
  static create(opts: {
    config: Config;
    measureIndex: number;
    measureFragmentIndex: number;
    systemId: symbol;
    staveNumber: number;
    measureEntries: MeasureEntry[];
    beginningBarStyle: musicxml.BarStyle;
    endBarStyle: musicxml.BarStyle;
    staveSignature: StaveSignature | null;
    previousStave: Stave | null;
  }): Stave {
    const config = opts.config;
    const measureIndex = opts.measureIndex;
    const measureFragmentIndex = opts.measureFragmentIndex;
    const systemId = opts.systemId;
    const staveNumber = opts.staveNumber;
    const measureEntries = opts.measureEntries;
    const beginningBarStyle = opts.beginningBarStyle;
    const endBarStyle = opts.endBarStyle;

    const multiRestCount = opts.staveSignature?.getMultiRestCount(staveNumber) ?? 0;
    const quarterNoteDivisions = opts.staveSignature?.getQuarterNoteDivisions() ?? 2;
    const clef = opts.staveSignature?.getClef(staveNumber) ?? Clef.treble();
    const keySignature = opts.staveSignature?.getKeySignature(staveNumber) ?? KeySignature.Cmajor();
    const timeSignature = opts.staveSignature?.getTimeSignature(staveNumber) ?? TimeSignature.common();
    const previousKeySignature = opts.previousStave?.keySignature ?? null;

    let entry: StaveEntry;

    if (multiRestCount === 1) {
      entry = Chorus.wholeRest({ config, clef, timeSignature });
    } else if (multiRestCount > 1) {
      entry = MultiRest.create({ count: multiRestCount });
    } else if (clef.getType() === 'tab') {
      // TODO: Render tablature correctly.
      entry = Tablature.create();
    } else {
      entry = Chorus.create({
        config,
        measureEntries,
        clef,
        timeSignature,
        quarterNoteDivisions,
        keySignature,
      });
    }

    const metronome = util.first(
      measureEntries
        .filter((measureEntry): measureEntry is musicxml.Direction => measureEntry instanceof musicxml.Direction)
        .flatMap((direction) => direction.getTypes())
        .map((directionType) => directionType.getContent())
        .filter((content): content is musicxml.MetronomeDirectionTypeContent => content.type === 'metronome')
        .map((content) => content.metronome)
    );

    return new Stave({
      config,
      measureIndex,
      measureFragmentIndex,
      systemId,
      staveNumber,
      clef,
      timeSignature,
      keySignature,
      beginningBarStyle,
      endBarStyle,
      entry,
      previousKeySignature,
      metronome,
    });
  }

  /** Returns the minimum justify width for the stave in a measure context. */
  @util.memoize()
  getMinJustifyWidth(): number {
    if (this.entry instanceof MultiRest) {
      // This is much easier being configurable. Otherwise, we would have to create a dummy context to render it, then
      // get the width via MultiMeasureRest.getBoundingBox. There is no "preCalculateMinTotalWidth" for non-voices at
      // the moment.
      return this.config.MULTI_MEASURE_REST_WIDTH;
    }

    if (this.entry instanceof Chorus) {
      return this.entry.getMinJustifyWidth();
    }

    return 0;
  }

  /** Returns the width that the modifiers take up. */
  getModifiersWidth(modifiers: StaveModifier[]): number {
    let width = 0;

    if (modifiers.includes('clef')) {
      width += this.getClefWidth();
    }
    if (modifiers.includes('keySignature')) {
      width += this.getKeySignatureWidth();
    }
    if (modifiers.includes('timeSignature')) {
      width += this.getTimeSignatureWidth();
    }

    return width;
  }

  /** Returns the number of measures the multi rest is active for. 0 means there's no multi rest. */
  getMultiRestCount(): number {
    return this.entry instanceof MultiRest ? this.entry.getCount() : 0;
  }

  /** Cleans the Stave. */
  clone(systemId: symbol): Stave {
    return new Stave({
      config: this.config,
      measureIndex: this.measureIndex,
      measureFragmentIndex: this.measureFragmentIndex,
      systemId,
      staveNumber: this.staveNumber,
      clef: this.clef,
      timeSignature: this.timeSignature,
      keySignature: this.keySignature,
      beginningBarStyle: this.beginningBarStyle,
      endBarStyle: this.endBarStyle,
      entry: this.entry.clone(),
      previousKeySignature: this.previousKeySignature,
      metronome: this.metronome,
    });
  }

  /** Wether the staves have the same modifiers. */
  getModifierChanges(stave: Stave): StaveModifier[] {
    const result = new Array<StaveModifier>();

    if (!this.clef.isEqual(stave.clef)) {
      result.push('clef');
    }
    if (!this.keySignature.isEqual(stave.keySignature)) {
      result.push('keySignature');
    }
    if (!this.timeSignature.isEqual(stave.timeSignature)) {
      result.push('timeSignature');
    }

    return result;
  }

  /** Renders the Stave. */
  render(opts: {
    x: number;
    y: number;
    width: number;
    modifiers: StaveModifier[];
    previousStave: Stave | null;
    nextStave: Stave | null;
  }): StaveRendering {
    const vfStave = this.toVexflowStave({
      x: opts.x,
      y: opts.y,
      width: opts.width,
      modifiers: opts.modifiers,
    });

    const staveEntryRendering = this.entry.render();

    switch (staveEntryRendering.type) {
      case 'multirest':
        staveEntryRendering.vexflow.multiMeasureRest.setStave(vfStave);
        break;
      case 'chorus':
        const vfVoices = staveEntryRendering.voices.map((voice) => voice.vexflow.voice);
        for (const vfVoice of vfVoices) {
          vfVoice.setStave(vfStave);
        }

        const vfTickables = vfVoices.flatMap((vfVoice) => vfVoice.getTickables());
        if (vfTickables.length > 0) {
          new vexflow.Formatter().joinVoices(vfVoices).formatToStave(vfVoices, vfStave);
        }
        break;
    }

    return {
      type: 'stave',
      staveNumber: this.staveNumber,
      width: opts.width,
      vexflow: {
        stave: vfStave,
        beginningBarlineType: this.getBeginningBarlineType(),
        endBarlineType: this.getEndBarlineType(),
      },
      entry: staveEntryRendering,
    };
  }

  /** Returns the width that the clef takes up. */
  @util.memoize()
  private getClefWidth(): number {
    return this.toVexflowStave({
      x: 0,
      y: 0,
      width: this.getMinJustifyWidth(),
      modifiers: ['clef'],
    }).getNoteStartX();
  }

  /** Returns the width that the key signature takes up. */
  @util.memoize()
  private getKeySignatureWidth(): number {
    return this.toVexflowStave({
      x: 0,
      y: 0,
      width: this.getMinJustifyWidth(),
      modifiers: ['keySignature'],
    }).getNoteStartX();
  }

  /** Returns the width that the time signature takes up. */
  @util.memoize()
  private getTimeSignatureWidth(): number {
    return this.toVexflowStave({
      x: 0,
      y: 0,
      width: this.getMinJustifyWidth(),
      modifiers: ['timeSignature'],
    }).getNoteStartX();
  }

  private toVexflowStave(opts: { x: number; y: number; width: number; modifiers: StaveModifier[] }): vexflow.Stave {
    const vfStave =
      this.clef.getType() === 'tab'
        ? new vexflow.TabStave(opts.x, opts.y, opts.width)
        : new vexflow.Stave(opts.x, opts.y, opts.width);

    vfStave.setBegBarType(this.getBeginningBarlineType()).setEndBarType(this.getEndBarlineType());

    if (opts.modifiers.includes('clef')) {
      vfStave.addClef(this.clef.getType(), 'default', this.clef.getAnnotation() ?? undefined);
    }
    if (opts.modifiers.includes('keySignature')) {
      new vexflow.KeySignature(
        this.keySignature.getKey(),
        this.previousKeySignature?.getKey() ?? undefined,
        this.keySignature.getAlterations()
      )
        .setPosition(vexflow.StaveModifierPosition.BEGIN)
        .addToStave(vfStave);
    }
    if (opts.modifiers.includes('timeSignature')) {
      for (const timeSpec of this.getTimeSpecs()) {
        vfStave.addTimeSignature(timeSpec);
      }
    }
    if (this.metronome) {
      vfStave.setTempo(
        {
          bpm: this.metronome.getBeatsPerMinute(),
          dots: this.metronome.getDotCount(),
          duration: Voice.toDurationDenominator(this.metronome.getBeatUnit())!,
        },
        opts.y
      );
    }

    return vfStave;
  }

  private getBeginningBarlineType(): vexflow.BarlineType {
    return this.toBarlineType(this.beginningBarStyle);
  }

  private getEndBarlineType(): vexflow.BarlineType {
    return this.toBarlineType(this.endBarStyle);
  }

  private toBarlineType(barStyle: musicxml.BarStyle): vexflow.BarlineType {
    switch (barStyle) {
      case 'regular':
      case 'short':
      case 'dashed':
      case 'dotted':
      case 'heavy':
        return vexflow.BarlineType.SINGLE;
      case 'heavy-light':
      case 'heavy-heavy':
      case 'light-light':
      case 'tick':
        return vexflow.BarlineType.DOUBLE;
      case 'light-heavy':
        return vexflow.BarlineType.END;
      case 'none':
        return vexflow.BarlineType.NONE;
      default:
        return vexflow.BarlineType.NONE;
    }
  }

  private getTimeSpecs(): string[] {
    switch (this.timeSignature.getSymbol()) {
      case 'common':
        return ['C'];
      case 'cut':
        return ['C|'];
      case 'single-number':
        // TODO: If/when vexflow supports this, return the time spec for a single number time signature.
        return [this.toSimpleTimeSpecs(this.timeSignature.toFraction())];
      case 'hidden':
        return [];
    }

    const components = this.timeSignature.getComponents();
    if (components.length > 1) {
      return this.toComplexTimeSpecs(components);
    }

    return [this.toSimpleTimeSpecs(components[0])];
  }

  private toSimpleTimeSpecs(component: util.Fraction): string {
    return `${component.numerator}/${component.denominator}`;
  }

  private toComplexTimeSpecs(components: util.Fraction[]): string[] {
    const denominators = new Array<number>();
    const memo: Record<number, number[]> = {};

    for (const component of components) {
      const numerator = component.numerator;
      const denominator = component.denominator;

      if (typeof memo[denominator] === 'undefined') {
        denominators.push(denominator);
      }

      memo[denominator] ??= [];
      memo[denominator].push(numerator);
    }

    const result = new Array<string>();

    for (let index = 0; index < denominators.length; index++) {
      const denominator = denominators[index];
      const isLast = index === denominators.length - 1;

      result.push(`${memo[denominator].join('+')}/${denominator}`);

      if (!isLast) {
        result.push('+');
      }
    }

    return result;
  }
}
