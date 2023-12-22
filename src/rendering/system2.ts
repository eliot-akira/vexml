import * as util from '@/util';
import { Address } from './address';
import { Config } from './config';
import { Measure, MeasureRendering } from './measure2';
import { Spanners } from './spanners';
import { MeasureFragmentWidth } from './types';

/** The result of rendering a system. */
export type SystemRendering = {
  type: 'system';
  address: Address<'system'>;
  measures: MeasureRendering[];
};

/**
 * Represents a System in a musical score, a horizontal grouping of staves spanning the width of the viewport or page.
 * Each system contains a segment of musical content from one or more parts, and multiple systems collectively render
 * the entirety of those parts.
 */
export class System {
  private config: Config;
  private index: number;
  private measures: Measure[];
  private measureFragmentWidths: MeasureFragmentWidth[];

  constructor(opts: {
    config: Config;
    index: number;
    measures: Measure[];
    measureFragmentWidths: MeasureFragmentWidth[];
  }) {
    this.config = opts.config;
    this.index = opts.index;
    this.measures = opts.measures;
    this.measureFragmentWidths = opts.measureFragmentWidths;
  }

  /** Returns the index of the system. */
  getIndex(): number {
    return this.index;
  }

  /** Renders the system. */
  render(opts: {
    x: number;
    y: number;
    address: Address<'system'>;
    previousSystem: System | null;
    nextSystem: System | null;
    spanners: Spanners;
  }): SystemRendering {
    const measureRenderings = new Array<MeasureRendering>();

    let x = opts.x;
    const y = opts.y + this.getTopPadding();

    util.forEachTriple(this.measures, ([previousMeasure, currentMeasure, nextMeasure], { isFirst, isLast }) => {
      if (isFirst) {
        previousMeasure = util.last(opts.previousSystem?.measures ?? []);
      }
      if (isLast) {
        nextMeasure = util.first(opts.nextSystem?.measures ?? []);
      }

      const address = opts.address.measure({
        systemMeasureIndex: this.index,
        measureIndex: currentMeasure.getIndex(),
      });

      const fragmentWidths = this.measureFragmentWidths.filter(
        ({ measureIndex }) => measureIndex === currentMeasure.getIndex()
      );

      const measureRendering = currentMeasure.render({
        x,
        y,
        address,
        fragmentWidths,
        previousMeasure,
        nextMeasure,
        spanners: opts.spanners,
      });
      measureRenderings.push(measureRendering);

      x += measureRendering.width;
    });

    return {
      type: 'system',
      address: opts.address,
      measures: measureRenderings,
    };
  }

  private getTopPadding(): number {
    return util.max(this.measures.map((measure) => measure.getTopPadding()));
  }
}
