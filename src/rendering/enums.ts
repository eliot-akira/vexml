import { EnumValues, Enum } from '@/util';

/**
 * NoteDurationDenominator corresponds to the fraction duration of a note. The values are vexflow-specific.
 *
 * See https://github.com/0xfe/vexflow/blob/17755d786eae1670ee20e8101463b3368f2c06e5/src/tables.ts#L16.
 */
export type NoteDurationDenominator = EnumValues<typeof NOTE_DURATION_DENOMINATORS>;
export const NOTE_DURATION_DENOMINATORS = new Enum([
  '1024',
  '512',
  '256',
  '128',
  '64',
  '32',
  '16',
  '8',
  '4',
  '2',
  '1',
  '1/2',
] as const);

/**
 * The direction of the stem of a note.
 */
export type StemDirection = EnumValues<typeof STEM_DIRECTIONS>;
export const STEM_DIRECTIONS = new Enum(['up', 'down', 'none', 'auto'] as const);

/**
 * The translation of the clef sign and line.
 *
 * See https://github.com/0xfe/vexflow/blob/ea48402cb22a312249719fdbdb0766240678156d/src/clef.ts#L68
 */
export type ClefType = EnumValues<typeof CLEF_TYPES>;
export const CLEF_TYPES = new Enum([
  'treble',
  'french',
  'subbass',
  'baritone-f',
  'bass',
  'baritone-c',
  'tenor',
  'mezzo-soprano',
  'soprano',
  'alto',
  'percussion',
  'tab',
] as const);

/**
 * The clef annotation derived from its octave change.
 *
 * See https://github.com/0xfe/vexflow/blob/ea48402cb22a312249719fdbdb0766240678156d/src/clef.ts#L133
 */
export type ClefAnnotation = EnumValues<typeof CLEF_ANNOTATIONS>;
export const CLEF_ANNOTATIONS = new Enum(['8vb', '8va'] as const);
