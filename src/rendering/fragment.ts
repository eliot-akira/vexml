import { Config } from './config';
import { Logger } from '@/debug';
import { Document } from './document';
import { MeasureEntryKey, PartKey } from './types';
import { Point, Rect } from '@/spatial';
import { Part, PartRender } from './part';
import { Pen } from './pen';
import { PartLabelGroup, PartLabelGroupRender } from './partlabelgroup';

export type FragmentRender = {
  type: 'fragment';
  key: MeasureEntryKey;
  rect: Rect;
  partLabelGroupRender: PartLabelGroupRender | null;
  partRenders: PartRender[];
};

export class Fragment {
  constructor(
    private config: Config,
    private log: Logger,
    private document: Document,
    private key: MeasureEntryKey,
    private position: Point,
    private width: number | null
  ) {}

  render(): FragmentRender {
    const pen = new Pen(this.position);

    const partLabelGroupRender = this.renderPartLabelGroup(pen);

    let width = this.width;
    if (width) {
      width -= partLabelGroupRender?.rect.w ?? 0;
    }

    const partRenders = this.renderParts(pen, width);

    const rect = Rect.merge(partRenders.map((part) => part.rect));

    return {
      type: 'fragment',
      key: this.key,
      rect,
      partLabelGroupRender,
      partRenders,
    };
  }

  private renderPartLabelGroup(pen: Pen): PartLabelGroupRender | null {
    const isFirstSystem = this.key.systemIndex === 0;
    const isFirstMeasure = this.key.measureIndex === 0;
    if (!isFirstSystem || !isFirstMeasure) {
      return null;
    }

    const partLabelGroup = new PartLabelGroup(this.config, this.log, this.document, this.key, pen.position());
    const partLabelGroupRender = partLabelGroup.render();

    pen.moveBy({ dx: partLabelGroupRender.rect.w });

    return partLabelGroupRender;
  }

  private renderParts(pen: Pen, width: number | null): PartRender[] {
    const partCount = this.document.getPartCount(this.key);

    const partRenders = new Array<PartRender>();

    for (let partIndex = 0; partIndex < partCount; partIndex++) {
      const key: PartKey = { ...this.key, partIndex };
      const partRender = new Part(this.config, this.log, this.document, key, pen.position(), width).render();
      partRenders.push(partRender);
      pen.moveBy({ dy: partRender.rect.h });
    }

    return partRenders;
  }
}
