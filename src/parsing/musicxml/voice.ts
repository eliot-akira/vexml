import * as data from '@/data';
import * as util from '@/util';
import { Signature } from './signature';
import { VoiceEvent } from './types';
import { StaveContext, VoiceContext } from './contexts';
import { Rest } from './rest';

export class Voice {
  constructor(private id: string, private signature: Signature, private events: VoiceEvent[]) {
    util.assert(
      events.every((event) => event.voiceId === id),
      'Expected all events to belong to the current voice'
    );
  }

  parse(staveCtx: StaveContext): data.Voice {
    const voiceCtx = new VoiceContext(staveCtx, this.id);

    if (voiceCtx.getMultiRestCount() > 0) {
      const time = voiceCtx.getTime();
      const rest = Rest.whole(time);
      return {
        type: 'voice',
        entries: [rest.parse(voiceCtx)],
        beams: [],
      };
    }

    return {
      type: 'voice',
      entries: this.parseEntries(voiceCtx),
      beams: [],
    };
  }

  private parseEntries(voiceCtx: VoiceContext): data.VoiceEntry[] {
    const entries = new Array<data.VoiceEntry>();

    for (const event of this.events) {
      if (event.type === 'note') {
        entries.push(event.note.parse(voiceCtx));
      } else if (event.type === 'rest') {
        entries.push(event.rest.parse(voiceCtx));
      } else {
        util.assertUnreachable();
      }
    }

    return entries;
  }
}
