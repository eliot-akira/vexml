import * as musicxml from '@/musicxml';
import * as util from '@/util';
import * as vexflow from 'vexflow';
import { Config } from './config';
import { MeasureEntry, StaveSignature } from './stavesignature';
import { PartScoped } from './types';
import { Address } from './address';
import { Part } from './part2';
import { Chorus, ChorusRendering } from './chorus';
import { Spanners } from './spanners';

/** The result of rendering a measure fragment. */
export type MeasureFragmentRendering = {
  type: 'measurefragment';
};

/**
 * Represents a fragment of a measure.
 *
 * A measure fragment is necessary when stave modifiers change. It is not a formal musical concept, and it is moreso an
 * outcome of vexflow's Stave implementation.
 *
 * Measure fragments format all measure parts against the first stave.
 */
export class MeasureFragment {
  private config: Config;
  private index: number;
  private partIds: string[];
  private musicXml: {
    staveLayouts: musicxml.StaveLayout[];
    beginningBarStyles: PartScoped<musicxml.BarStyle>[];
    endBarStyles: PartScoped<musicxml.BarStyle>[];
  };
  private measureEntries: PartScoped<MeasureEntry>[];
  private staveSignatures: PartScoped<StaveSignature>[];

  constructor(opts: {
    config: Config;
    index: number;
    partIds: string[];
    musicXml: {
      staveLayouts: musicxml.StaveLayout[];
      beginningBarStyles: PartScoped<musicxml.BarStyle>[];
      endBarStyles: PartScoped<musicxml.BarStyle>[];
    };
    measureEntries: PartScoped<MeasureEntry>[];
    staveSignatures: PartScoped<StaveSignature>[];
  }) {
    this.config = opts.config;
    this.index = opts.index;
    this.partIds = opts.partIds;
    this.musicXml = opts.musicXml;
    this.measureEntries = opts.measureEntries;
    this.staveSignatures = opts.staveSignatures;
  }

  /** Returns the index of the measure fragment, which is relative to its parent measure. */
  getIndex(): number {
    return this.index;
  }

  /** Returns the minimum required width for the measure fragment. */
  getMinRequiredWidth(opts: {
    address: Address<'measurefragment'>;
    previousMeasureFragment: MeasureFragment | null;
  }): number {
    const spanners = new Spanners();
    const vfFormatter = new vexflow.Formatter();
    const vfVoices = new Array<vexflow.Voice>();

    const staves = this.getParts().flatMap((part) => part.getStaves());

    for (const stave of staves) {
      const entry = stave.getEntry();

      let vfPartStaveVoices = new Array<vexflow.Voice>();

      if (entry instanceof Chorus) {
        const address = opts.address.stave({ staveNumber: stave.getNumber() }).chorus();
        const chorusRendering = entry.render({ address, spanners });
        vfPartStaveVoices = chorusRendering.voices.map((voice) => voice.vexflow.voice);
      }

      if (vfPartStaveVoices.length > 0) {
        vfFormatter.joinVoices(vfPartStaveVoices);
      }

      vfVoices.push(...vfPartStaveVoices);
    }

    if (vfVoices.length === 0) {
      return 0;
    }

    return vfFormatter.preCalculateMinTotalWidth(vfVoices) + spanners.getPadding() + this.config.VOICE_PADDING;
  }

  /** Renders the measure fragment. */
  render(): MeasureFragmentRendering {
    return {
      type: 'measurefragment',
    };
  }

  @util.memoize()
  private getParts(): Part[] {
    return this.partIds.map((partId) => {
      const measureEntries = this.measureEntries
        .filter((measureEntry) => measureEntry.partId === partId)
        .map((measureEntry) => measureEntry.value);

      const staveSignature = this.staveSignatures.find((staveSignature) => staveSignature.partId === partId)?.value;
      if (!staveSignature) {
        throw new Error(`Could not find stave signature for part ${partId}`);
      }

      const beginningBarStyle = this.musicXml.beginningBarStyles.find((barStyle) => barStyle.partId === partId)?.value;
      if (!beginningBarStyle) {
        throw new Error(`Could not find beginning bar style for part ${partId}`);
      }

      const endBarStyle = this.musicXml.endBarStyles.find((barStyle) => barStyle.partId === partId)?.value;
      if (!endBarStyle) {
        throw new Error(`Could not find end bar style for part ${partId}`);
      }

      return new Part({
        config: this.config,
        id: partId,
        musicXml: {
          staveLayouts: this.musicXml.staveLayouts,
          beginningBarStyle,
          endBarStyle,
        },
        measureEntries,
        staveSignature,
      });
    });
  }
}
