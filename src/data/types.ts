import {
  AccidentalCode,
  AnnotationHorizontalJustification,
  AnnotationVerticalJustification,
  ClefSign,
  CurveOpening,
  CurvePlacement,
  DurationType,
  KeyMode,
  Notehead,
  StemDirection,
  TimeSymbol,
  TupletPlacement,
} from './enums';

export type Score = {
  type: 'score';
  title: string | null;
  partLabels: string[];
  systems: System[];

  /**
   * `curves` are the slurs and ties present in the score. It's defined at the score level to allow them to span
   *  multiple systems, which is possible and valid to do.
   */
  curves: Curve[];
};

export type Curve = {
  type: 'curve';
  id: string;
  placement: CurvePlacement;
  opening: CurveOpening;
};

export type System = {
  type: 'system';
  measures: Measure[];
};

export type Measure = {
  type: 'measure';
  label: number | null;
  fragments: Fragment[];
  jumpGroup: JumpGroup;
};

export type JumpGroup = {
  type: 'jumpgroup';
  jumps: Jump[];
};

export type Jump =
  | { type: 'repeatstart' }
  | { type: 'repeatend'; times: number }
  | { type: 'repeatending'; times: number };

export type Fragment = {
  type: 'fragment';
  signature: FragmentSignature;
  parts: Part[];
  width: number | null;
};

export type FragmentSignature = {
  type: 'fragmentsignature';
  metronome: Metronome;
};

export type Gap = {
  type: 'gap';
  text: string | null;
  width: number | null;
  parts: Part[];
  durationMs: number;
};

export type Part = {
  type: 'part';
  staves: Stave[];
  signature: PartSignature;
};

export type PartSignature = {
  type: 'partsignature';
  staveCount: number;
};

export type Stave = {
  type: 'stave';
  signature: StaveSignature;
  voices: Voice[];
  multiRestCount: number;
};

export type StaveSignature = {
  type: 'stavesignature';
  lineCount: number;
  clef: Clef;
  key: Key;
  time: Time;
};

export type Voice = {
  type: 'voice';
  entries: VoiceEntry[];

  /**
   * `beams` are the beams present in a voice. They are defined at the voice level, so they cannot span multiple
   * measures. Instead, the rendering engine will break beams at measure boundaries.
   */
  beams: Beam[];

  /**
   * `tuplets` are the tuplets present in a voice. They are defined at the voice level, so they cannot span multiple
   * measures. Instead, the rendering engine will break tuplets at measure boundaries.
   */
  tuplets: Tuplet[];
};

export type Beam = {
  type: 'beam';
  id: string;
};

export type Tuplet = {
  type: 'tuplet';
  id: string;
  showNumber: boolean;
  placement: TupletPlacement;
};

export type VoiceEntry = Note | Rest | Chord;

export type Note = {
  type: 'note';
  pitch: Pitch;
  head: Notehead;
  stemDirection: StemDirection;
  duration: Fraction;
  durationType: DurationType;
  dotCount: number;
  measureBeat: Fraction;
  accidental: Accidental | null;
  annotations: Annotation[];
  curveIds: string[];
  beamId: string | null;
  tupletIds: string[];
};

export type Chord = {
  type: 'chord';
  notes: ChordNote[];
  stemDirection: StemDirection;
  duration: Fraction;
  durationType: DurationType;
  dotCount: number;
  annotations: Annotation[];
  measureBeat: Fraction;
  beamId: string | null;
  tupletIds: string[];
};

export type ChordNote = {
  type: 'chordnote';
  pitch: Pitch;
  head: Notehead;
  accidental: Accidental | null;
  curveIds: string[];
};

export type Accidental = {
  type: 'accidental';
  code: AccidentalCode;
  isCautionary: boolean;
};

export type Annotation = {
  type: 'annotation';
  text: string;
  horizontalJustification: AnnotationHorizontalJustification | null;
  verticalJustification: AnnotationVerticalJustification | null;
};

export type Rest = {
  type: 'rest';
  measureBeat: Fraction;
  durationType: DurationType;
  dotCount: number;
  duration: Fraction;
  displayPitch: Pitch | null;
  beamId: string | null;
  tupletIds: string[];
};

export type Pitch = {
  type: 'pitch';
  step: string;
  octave: number;
};

export type Clef = {
  type: 'clef';
  sign: ClefSign;
  octaveShift: number | null;
};

export type Key = {
  type: 'key';
  rootNote: string;
  previousKey: PreviousKey | null;
  fifths: number;
  mode: KeyMode;
};

export type PreviousKey = {
  type: 'previouskey';
  rootNote: string;
  fifths: number;
  mode: KeyMode;
};

export type Time = {
  type: 'time';
  components: Fraction[];
  symbol: TimeSymbol | null;
};

export type Fraction = {
  type: 'fraction';
  numerator: number;
  denominator: number;
};

export type Metronome = {
  type: 'metronome';
  name?: string;
  parenthesis?: boolean;
  duration?: string;
  dots?: number;
  bpm?: number | string;
  duration2?: string;
  dots2?: number;
};
