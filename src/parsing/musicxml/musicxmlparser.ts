import * as data from '@/data';
import * as musicxml from '@/musicxml';
import { Score } from './score';
import { System } from './system';
import { Measure } from './measure';
import { Fragment } from './fragment';
import { FragmentSignature } from './fragmentsignature';
import { Metronome } from './metronome';
import { PartSignature } from './partsignature';
import { Part } from './part';
import { Stave } from './stave';
import { Chorus } from './chorus';
import { MultiRest } from './multirest';
import { StaveSignature } from './stavesignature';
import { Clef } from './clef';
import { Key } from './key';
import { Time } from './time';
import { Fraction } from '@/util';

/** Parses a MusicXML document string. */
export class MusicXMLParser {
  parse(musicXMLString: string): data.Document {
    const musicXML = this.parseMusicXMLString(musicXMLString);
    const scorePartwise = musicXML.getScorePartwise();
    const score = new Score({ scorePartwise });
    return this.parseScore(score);
  }

  private parseMusicXMLString(musicXML: string): musicxml.MusicXML {
    const xml = new DOMParser().parseFromString(musicXML, 'application/xml');
    return new musicxml.MusicXML(xml);
  }

  private parseScore(score: Score): data.Document {
    return new data.Document({
      type: 'score',
      title: score.getTitle(),
      systems: score.getSystems().map((system) => this.parseSystem(system)),
    });
  }

  private parseSystem(system: System): data.System {
    return {
      type: 'system',
      measures: system.getMeasures().map((measure) => this.parseMeasure(measure)),
    };
  }

  private parseMeasure(measure: Measure): data.Measure {
    return {
      type: 'measure',
      label: measure.getLabel(),
      entries: measure.getFragments().map((fragment) => this.parseFragment(fragment)),
    };
  }

  private parseFragment(fragment: Fragment): data.Fragment {
    return {
      type: 'fragment',
      parts: fragment.getParts().map((part) => this.parsePart(part)),
      signature: this.parseFragmentSignature(fragment.getSignature().asFragmentSignature()),
    };
  }

  private parseFragmentSignature(signature: FragmentSignature): data.FragmentSignature {
    return {
      type: 'fragmentsignature',
      metronome: this.parseMetronome(signature.getMetronome()),
    };
  }

  private parseMetronome(metronome: Metronome): data.Metronome {
    return {
      type: 'metronome',
      name: metronome.getName(),
      parenthesis: metronome.getParenthesis(),
      bpm: metronome.getBpm(),
      dots: metronome.getDots(),
      duration: metronome.getDuration(),
      dots2: metronome.getDots2(),
      duration2: metronome.getDuration2(),
    };
  }

  private parsePart(part: Part): data.Part {
    return {
      type: 'part',
      signature: this.parsePartSignature(part.getSignature().asPartSignature(part.getId())),
      staves: part.getStaves().map((stave) => this.parseStave(stave)),
    };
  }

  private parsePartSignature(partSignature: PartSignature): data.PartSignature {
    return {
      type: 'partsignature',
      staveCount: partSignature.getStaveCount(),
    };
  }

  private parseStave(stave: Stave): data.Stave {
    return {
      type: 'stave',
      signature: this.parseStaveSignature(stave.getSignature().asStaveSignature(stave.getPartId(), stave.getNumber())),
      entry: this.parseStaveEntry(stave.getEntry()),
    };
  }

  private parseStaveSignature(staveSignature: StaveSignature): data.StaveSignature {
    return {
      type: 'stavesignature',
      lineCount: staveSignature.getLineCount(),
      clef: this.parseClef(staveSignature.getClef()),
      key: this.parseKey(staveSignature.getKey()),
      time: this.parseTime(staveSignature.getTime()),
    };
  }

  private parseClef(clef: Clef): data.Clef {
    return {
      type: 'clef',
      sign: clef.getSign(),
      line: clef.getLine(),
      octaveChange: clef.getOctaveChange(),
    };
  }

  private parseKey(key: Key): data.Key {
    return {
      type: 'key',
      previousKey: this.parsePreviousKey(key.getPreviousKey()),
      fifths: key.getFifths(),
      mode: key.getMode(),
    };
  }

  private parsePreviousKey(key: Key | null): data.PreviousKey | null {
    if (!key) {
      return null;
    }
    return {
      type: 'previouskey',
      fifths: key.getFifths(),
      mode: key.getMode(),
    };
  }

  private parseTime(time: Time): data.Time {
    return {
      type: 'time',
      components: time.getComponents().map((component) => this.parseFraction(component)),
    };
  }

  private parseFraction(fraction: Fraction): data.Fraction {
    return {
      type: 'fraction',
      numerator: fraction.numerator,
      denominator: fraction.denominator,
    };
  }

  private parseStaveEntry(entry: Chorus | MultiRest): data.Chorus | data.MultiRest {
    if (entry instanceof Chorus) {
      return this.parseChorus(entry);
    } else {
      return this.parseMultiRest(entry);
    }
  }

  private parseChorus(chorus: Chorus): data.Chorus {
    return { type: 'chorus' };
  }

  private parseMultiRest(multiRest: MultiRest): data.MultiRest {
    return { type: 'multirest' };
  }
}
