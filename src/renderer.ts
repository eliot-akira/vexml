import * as VF from 'vexflow';
import { BoundingBox } from 'vexflow';
import { Attributes } from './attributes';
import { CodePrinter } from './codeprinter';
import { Notations } from './notations';
import { Producer } from './producer';
import { CodeTracker, EasyScoreMessage, NoteMessage } from './types';

export type RendererOptions = {
  codeTracker?: CodeTracker;
};

export class Renderer {
  static render(elementId: string, musicXml: string, opts: RendererOptions = {}): void {
    const t = opts.codeTracker || CodePrinter.noop();

    t.literal(`let VF = Vex.Flow;`);
    t.newline();
    t.literal(`const elementId = 'score'`);

    const factory = t.const('factory', () => new VF.Factory({ renderer: { elementId, width: 2000, height: 400 } }));
    const renderer = new Renderer(factory, t);
    Producer.feed(musicXml).message(renderer);
    renderer.render();
  }

  private factory: VF.Factory;

  private messages = new Array<EasyScoreMessage>();
  private t: CodeTracker;

  private constructor(factory: VF.Factory, codeTracker: CodeTracker) {
    this.factory = factory;
    this.t = codeTracker;
  }

  onMessage(message: EasyScoreMessage): void {
    this.messages.push(message);
  }

  private render() {
    const { t, factory } = this;

    t.newline();

    let note = t.let<VF.Note | undefined>('note', () => undefined);
    let notes = t.let('notes', () => new Array<VF.Note>());
    let beamStart = t.let('beamStart', () => 0);
    let graceStart = t.let('graceStart', () => -1);
    let curPart = '';
    let firstPart = '';
    let curMeasure = 1;
    let cur1stStave = 0;
    let width: number | undefined = undefined;
    let numStaves = 1;
    let duration = 0;
    let endingLeft = '';
    let endingRight = '';
    let endingText = '';
    let endingMiddle = false;

    const systems: VF.System[] = [];
    
    function appendSystem(width?: number) {
      if (width) return factory.System({ x: 0, y: 0, width, spaceBetweenStaves: 12 });
      else return factory.System({ x: 0, y: 0, autoWidth: true, spaceBetweenStaves: 12 });
    }

    for (const message of this.messages) {
      switch (message.msgType) {
        case 'beam':
          if (message.value == 'begin') {
            beamStart = notes.length - 1;
          } else if (message.value == 'end') {
            t.literal(`beamStart = ${beamStart}`);
            t.expression(() =>
              factory.Beam({
                notes: notes.slice(beamStart) as VF.StemmableNote[],
                options: { autoStem: true },
              })
            );
            beamStart = -1;
          }
          break;
        case 'partStart':
          if (firstPart == '') firstPart = message.id;
          curPart = message.id;
          break;
        case 'partEnd':
          if (message.msgCount == message.msgIndex + 1) {
            curMeasure++;
          }
          break;
        case 'measureStart':
          t.newline();
          t.comment(`measure ${curMeasure}`);
          width = message.width;
          if (message.staves) {
            numStaves = message.staves;
          }
          if (firstPart == curPart) systems.push(appendSystem(width));
          for (let staff = 1; staff <= numStaves; staff++) {
            if (staff == 1) cur1stStave = systems[systems.length-1].getStaves().length;
            systems[systems.length-1].addStave({voices:[]});
            t.literal(`system.addStave({voices:[]})`);
          }
          t.expression(() => (notes = []));
          duration = 0;
          Attributes.clefMeasureStart();
          break;
        case 'attributes':
          Attributes.render(t, factory, message, cur1stStave, duration, notes, systems);
          break;
        case 'voiceEnd':
          systems[systems.length-1].addVoices([factory.Voice().setMode(2).addTickables(notes)]);
          t.literal(`systems[systems.length-1].addVoices([factory.Voice().setMode(2).addTickables(notes)])`);
          t.expression(() => (notes = []));
          duration = 0;
          break;
        case 'note':
          const durationDenominator = this.getDurationDenominator(message.type);
          const noteStruct: VF.GraceNoteStruct = {duration: `${durationDenominator}`};

          if (message.stem) noteStruct.stem_direction = message.stem == 'up' ? 1 : -1;
          else noteStruct.auto_stem = true;
          noteStruct.clef = Attributes.clefGet(message.staff, duration).clef;
          if (message.duration) duration += message.duration;
          // no pitch, rest
          if (message.head.length == 0) {
            if (noteStruct.clef == 'bass') noteStruct.keys = ['D/2'];
            else noteStruct.keys = ['B/4'];
            noteStruct.duration = `${durationDenominator}r`;
          } else {
            noteStruct.keys = [];
            for (const head of message.head) {
              noteStruct.keys.push(`${head.pitch}${this.getNotehead(head.notehead)}`);
            }
            noteStruct.duration = `${durationDenominator}`;
          }

          if (message.grace) {
            noteStruct.slash = message.graceSlash;
            note = this.factory.GraceNote(noteStruct).setStave(systems[systems.length-1].getStaves()[cur1stStave + message.staff - 1 ]);
            t.literal(
              `note = factory.GraceNote(${JSON.stringify(noteStruct).replace(/\n/g, '')})
                .setStave(systems[systems.length-1].getStaves()[${cur1stStave + message.staff - 1}]);`
            );
          } else {
            note = this.factory.StaveNote(noteStruct).setStave(systems[systems.length-1].getStaves()[cur1stStave + message.staff - 1 ]);
            t.literal(
              `note = factory.StaveNote(${JSON.stringify(noteStruct).replace(/\n/g, '')})
                .setStave(systems[systems.length-1].getStaves()[${cur1stStave + message.staff - 1}]);`
            );
          }
          for (let i = 0; i < message.dots; i++) {
            t.expression(() => VF.Dot.buildAndAttach([note!], { all: true }));
          }
          message.head.forEach((head, index) => {
            if (head.accidental != '') {
              const accidental = this.getAccidental(head.accidental);
              if (head.accidentalCautionary) {
                note!.addModifier(factory.Accidental({ type: accidental }).setAsCautionary(), index);
                t.literal(
                  `note.addModifier(factory.Accidental({ type: '${accidental}' }).setAsCautionary(), ${index})`
                );
              } else {
                note!.addModifier(factory.Accidental({ type: accidental }), index);
                t.literal(`note.addModifier(factory.Accidental({ type: '${accidental}' }), ${index});`);
              }
            }
          });
          if (!message.grace && graceStart >= 0) {
            t.expression(() =>
              note!.addModifier(factory.GraceNoteGroup({ notes: notes.splice(graceStart) as VF.StemmableNote[] }))
            );
            t.expression(() => (graceStart = -1));
          }
          t.expression(() => notes.push(note!));
          if (message.grace && graceStart < 0) t.expression(() => (graceStart = notes.length - 1));
          break;
        case 'notation':
          Notations.render(t, factory, message, notes);
          break;
        case 'lyric':
          let text = message.text;
          switch (message.syllabic) {
            case 'begin':
            case 'middle':
              text += ' -';
              break;
          }
          notes[notes.length - 1].addModifier(factory.Annotation({ text }));
          break;
        case 'barline':
          if (message.barStyle) {
            let barlineType: VF.BarlineType | undefined;
            switch (message.barStyle) {
              case 'dashed':
                barlineType = VF.BarlineType.SINGLE;
                break;
              case 'dotted':
                barlineType = VF.BarlineType.SINGLE;
                break;
              case 'heavy':
                barlineType = VF.BarlineType.SINGLE;
                break;
              case 'heavy-heavy':
                barlineType = VF.BarlineType.DOUBLE;
                break;
              case 'heavy-light':
                barlineType = VF.BarlineType.DOUBLE;
                break;
              case 'light-heavy':
                barlineType = VF.BarlineType.END;
                break;
              case 'light-light':
                barlineType = VF.BarlineType.DOUBLE;
                break;
              case 'none':
                barlineType = VF.BarlineType.NONE;
                break;
              case 'regular':
                barlineType = VF.BarlineType.SINGLE;
                break;
              case 'short':
                barlineType = VF.BarlineType.SINGLE;
                break;
              case 'tick':
                barlineType = VF.BarlineType.DOUBLE;
                break;
            }
            switch (message.repeatDirection) {
              case 'forward':
                barlineType = VF.BarlineType.REPEAT_BEGIN;
                break;
              case 'backward':
                barlineType = VF.BarlineType.REPEAT_END;
                break;
            }
            if (message.location == 'right') {
              systems[systems.length-1].getStaves().forEach((stave) => {
                stave.setEndBarType(barlineType as number);
              });
            }
            if (message.location == 'left') {
              systems[systems.length-1].getStaves().forEach((stave) => {
                stave.setBegBarType(barlineType as number);
              });
            }
          }
          if (message.ending) {
            if (message.location == 'right') {
              endingRight = message.ending.type;
              endingText = message.ending.text;
            }
            if (message.location == 'left') {
              endingLeft = message.ending.type;
              endingText = message.ending.text;
            }
          }
          break;
        case 'measureEnd':
          if (endingLeft == 'start' && endingRight == 'stop') {
            systems[systems.length-1].getStaves()[cur1stStave].setVoltaType(VF.VoltaType.BEGIN_END, endingText, 0);
            endingMiddle = false;
          } else if (endingLeft == 'start') {
            systems[systems.length-1].getStaves()[cur1stStave].setVoltaType(VF.VoltaType.BEGIN, endingText, 0);
            if (endingRight == '') endingMiddle = true;
          } else if (endingRight == 'stop') {
            systems[systems.length-1].getStaves()[cur1stStave].setVoltaType(VF.VoltaType.END, endingText, 0);
            endingMiddle = false;
          } else if (endingMiddle) {
            systems[systems.length-1].getStaves()[cur1stStave].setVoltaType(VF.VoltaType.MID, endingText, 0);
          }
          endingLeft = '';
          endingRight = '';
          endingText = '';
          break;
      }
    }
    let prevSystem: VF.System | undefined;
    const boundingBox = new BoundingBox(0,0,0,0);
    systems.forEach((s) => {
      if (prevSystem) {
        let x = prevSystem.getX() + prevSystem.getBoundingBox()!.getW();
        let y = prevSystem.getY();
        if (x > 1000) {
          x = 0;
          y += prevSystem.getBoundingBox()!.getH() + 50;
          s.addConnector('singleLeft');
        } 
        s.setX(x);
        s.setY(y);
      } else {
        s.addConnector('singleLeft');
      }
      s.format();
      boundingBox.mergeWith(s.getBoundingBox()!);
      prevSystem = s;
    });
    factory.getContext().resize(boundingBox.getX() + boundingBox.getW() + 50, boundingBox.getY() + boundingBox.getH() + 50);
    t.expression(() => factory.draw());
  }

  private getDurationDenominator(duration: NoteMessage['type']): string {
    switch (duration) {
      case '1024th':
        return '1024';
      case '512th':
        return '512';
      case '256th':
        return '256';
      case '128th':
        return '128';
      case '64th':
        return '64';
      case '32nd':
        return '32';
      case '16th':
        return '16';
      case 'eighth':
        return '8';
      case 'quarter':
        return '4';
      case 'half':
        return '2';
      case 'whole':
        return 'w';
      case 'breve':
        return '1/2';
      case 'long':
        // VexFlow bug: should be '1/4' but it is not supported
        // return '1/4';
        return '1/2';
      default:
        return '';
    }
  }

  private getAccidental(accidental: string): string {
    switch (accidental) {
      case 'sharp':
        return '#';
      case 'flat':
        return 'b';
      case 'natural':
        return 'n';
      case 'double-sharp':
        return '##';
      case 'double-flat':
      case 'flat-flat':
        return 'bb';
      case 'quarter-flat':
        return 'd';
      case 'quarter-sharp':
        return '+';
      case 'three-quarters-flat':
        return 'db';
      case 'three-quarters-sharp':
        return '++';
      default:
        return '';
    }
  }

  private getNotehead(notehead: string): string {
    switch (notehead) {
      case 'arrow down':
        return '/td';
      case 'arrow up':
        return '/tu';
      case 'back slashed':
        return '/sb';
      case 'circle dot':
        return '';
      case 'circle-x':
        return '/cx';
      case 'circled':
        return '/ci';
      case 'cluster':
        return '';
      case 'cross':
        return '';
      case 'diamond':
        return '/d';
      case 'do':
        return '/do';
      case 'fa':
        return '/fa';
      case 'fa up':
        return '/faup';
      case 'inverted triangle':
        return '';
      case 'left triangle':
        return '';
      case 'mi':
        return '/mi';
      case 'none':
        return '';
      case 'normal':
        return '/n';
      case 'rectangle':
        return '';
      case 'slash':
        return '/s';
      case 'slashed':
        return '';
      case 'so':
        return 'so';
      case 'square':
        return '/sq';
      case 'ti':
        return '/ti';
      case 'triangle':
        return '/tu';
      case 'x':
        return '/x';
    }
    return '/n';
  }
}
