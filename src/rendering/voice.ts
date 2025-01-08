import * as vexflow from 'vexflow';
import * as util from '@/util';
import { Logger } from '@/debug';
import { Config } from './config';
import { Document } from './document';
import { BeamKey, BeamRender, VoiceEntryRender, VoiceKey, VoiceRender } from './types';
import { Rect } from '@/spatial';
import { StaveNote } from './stavenote';
import { StaveRest } from './staverest';
import { Fraction } from '@/util';
import { DurationType } from '@/data/enums';
import { Beam } from './beam';

const DURATION_TYPE_VALUES: Array<{ type: DurationType; value: Fraction }> = [
  { type: '1/2', value: new Fraction(2, 1) },
  { type: '1', value: new Fraction(1, 1) },
  { type: '2', value: new Fraction(1, 2) },
  { type: '4', value: new Fraction(1, 4) },
  { type: '8', value: new Fraction(1, 8) },
  { type: '16', value: new Fraction(1, 16) },
  { type: '32', value: new Fraction(1, 32) },
  { type: '64', value: new Fraction(1, 64) },
  { type: '128', value: new Fraction(1, 128) },
  { type: '256', value: new Fraction(1, 256) },
  { type: '512', value: new Fraction(1, 512) },
  { type: '1024', value: new Fraction(1, 1024) },
];

export class Voice {
  constructor(private config: Config, private log: Logger, private document: Document, private key: VoiceKey) {}

  render(): VoiceRender {
    const vexflowVoice = new vexflow.Voice().setMode(vexflow.Voice.Mode.SOFT);
    const entryRenders = this.renderEntries(vexflowVoice);
    const beamRenders = this.renderBeams(entryRenders);

    return {
      type: 'voice',
      key: this.key,
      rect: Rect.empty(), // placeholder
      vexflowVoice,
      entryRenders,
      beamRenders,
    };
  }

  private renderEntries(vexflowVoice: vexflow.Voice): VoiceEntryRender[] {
    const entryRenders = new Array<VoiceEntryRender>();
    const entryCount = this.document.getVoiceEntryCount(this.key);

    let currentMeasureBeat = this.getInitialMeasureBeat();

    if (this.key.fragmentIndex === 1) {
      console.log(currentMeasureBeat);
    }

    for (let voiceEntryIndex = 0; voiceEntryIndex < entryCount; voiceEntryIndex++) {
      const voiceEntryKey = { ...this.key, voiceEntryIndex };
      const entry = this.document.getVoiceEntry(voiceEntryKey);
      const measureBeat = Fraction.fromFractionLike(entry.measureBeat);
      const duration = Fraction.fromFractionLike(entry.duration);

      if (currentMeasureBeat.isLessThan(measureBeat)) {
        const beats = measureBeat.subtract(currentMeasureBeat).divide(new Fraction(4));
        const vexflowGhostNote = this.renderVexflowGhostNote(beats);
        vexflowVoice.addTickable(vexflowGhostNote);
        // NOTE: We don't need to add this is entryRenders because it's a vexflow-specific detail and vexml doesn't need
        // to do anything with it.
      }
      currentMeasureBeat = measureBeat.add(duration);

      if (entry.type === 'note') {
        const staveNoteRender = new StaveNote(this.config, this.log, this.document, voiceEntryKey).render();
        vexflowVoice.addTickable(staveNoteRender.vexflowTickable);
        entryRenders.push(staveNoteRender);
      } else if (entry.type === 'rest') {
        const staveRestRender = new StaveRest(this.config, this.log, this.document, voiceEntryKey).render();
        vexflowVoice.addTickable(staveRestRender.vexflowTickable);
        entryRenders.push(staveRestRender);
      } else {
        util.assertUnreachable();
      }
    }

    return entryRenders;
  }

  private getInitialMeasureBeat(): Fraction {
    let measureBeat = Fraction.zero();

    this.document
      .getMeasure(this.key)
      .fragments.filter((_, fragmentIndex) => fragmentIndex < this.key.fragmentIndex)
      .flatMap((f) => f.parts)
      .flatMap((p) => p.staves)
      .flatMap((s) => s.voices)
      .flatMap((v) => v.entries)
      .map((e) => Fraction.fromFractionLike(e.measureBeat).add(Fraction.fromFractionLike(e.duration)))
      .forEach((m) => {
        if (m.isGreaterThan(measureBeat)) {
          measureBeat = m;
        }
      });

    return measureBeat;
  }

  private renderVexflowGhostNote(beatDuration: Fraction): vexflow.GhostNote {
    let closestDurationType: DurationType = '1/2';

    for (const { type, value } of DURATION_TYPE_VALUES) {
      if (value.isLessThanOrEqualTo(beatDuration)) {
        closestDurationType = type;
        break;
      }
    }

    return new vexflow.GhostNote({ duration: closestDurationType });
  }

  private renderBeams(entryRenders: VoiceEntryRender[]): BeamRender[] {
    const registry = new Map<string, VoiceEntryRender[]>();

    const beams = this.document.getBeams(this.key);

    for (const entryRender of entryRenders) {
      if (!entryRender.beamId) {
        continue;
      }
      if (!registry.has(entryRender.beamId)) {
        registry.set(entryRender.beamId, []);
      }
      registry.get(entryRender.beamId)!.push(entryRender);
    }

    const beamRenders = new Array<BeamRender>();

    for (let beamIndex = 0; beamIndex < beams.length; beamIndex++) {
      const beamKey: BeamKey = { ...this.key, beamIndex };
      const beam = this.document.getBeam(beamKey);

      const entryRenderCount = registry.get(beam.id)?.length ?? 0;

      if (entryRenderCount > 1) {
        const beamRender = new Beam(this.config, this.log, this.document, beamKey, registry).render();
        beamRenders.push(beamRender);
      }
    }

    return beamRenders;
  }
}
