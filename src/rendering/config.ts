import * as schema from '@/schema';
import { t } from '@/schema';

export type Config = schema.Config<typeof CONFIG>;

export const CONFIG = {
  DRAWING_BACKEND: t.enum({
    defaultValue: 'svg',
    help: 'DRAWING_BACKEND specifies the rendering backend to use.',
    choices: ['svg', 'canvas'] as const,
  }),
  WIDTH: t.number({
    defaultValue: null,
    help: 'WIDTH specifies the width of the rendered score.',
  }),
  HEIGHT: t.number({
    defaultValue: null,
    help: 'HEIGHT specifies the maximum height of the rendered score.',
  }),
  SCORE_PADDING_TOP: t.number({
    defaultValue: 40,
    help: 'TOP_PADDING is the vertical distance from the top of the rendering.',
  }),
  SCORE_PADDING_BOTTOM: t.number({
    defaultValue: 40,
    help: 'SCORE_PADDING_BOTTOM is the vertical distance from the bottom of the rendering.',
  }),
  TITLE_FONT_FAMILY: t.string({
    defaultValue: 'Arial',
    help: 'TITLE_FONT_FAMILY is the font family for the title.',
  }),
  TITLE_FONT_SIZE: t.string({
    defaultValue: '36px',
    help: 'TITLE_FONT_SIZE is the font size for the title expressed in browser-compatible units.',
  }),
  TITLE_FONT_LINE_HEIGHT_PX: t.number({
    defaultValue: 40,
    help: 'TITLE_FONT_LINE_HEIGHT is the line height for the title in pixels',
  }),
  TITLE_PADDING_BOTTOM: t.number({
    defaultValue: 20,
    help: 'TITLE_BOTTOM_PADDING is the vertical distance from the title to the first system.',
  }),
  SYSTEM_MARGIN_BOTTOM: t.number({
    defaultValue: 80,
    help: 'SYSTEM_MARGIN_BOTTOM is the vertical distance between systems',
  }),
  LAST_SYSTEM_WIDTH_STRETCH_THRESHOLD: t.number({
    defaultValue: 0.75,
    help:
      'LAST_SYSTEM_WIDTH_STRETCH_THRESHOLD is the total width fraction that the measures must exceed to stretch the ' +
      'measures in the last system.',
  }),
  PART_LABEL_FONT_FAMILY: t.string({
    defaultValue: 'Arial',
    help: 'PART_LABEL_FONT_FAMILY is the font family for part names.',
  }),
  PART_LABEL_FONT_SIZE: t.string({
    defaultValue: '13px',
    help: 'PART_LABEL_FONT_SIZE is the font size for part names expressed in browser-compatible units.',
  }),
  PART_LABEL_PADDING_RIGHT: t.number({
    defaultValue: 8,
    help: 'PART_LABEL_PADDING_RIGHT is the horizontal distance from part labels to the first measure.',
  }),
  PART_LABEL_ALIGNMENT: t.enum({
    defaultValue: 'right',
    help: 'PART_LABEL_ALIGNMENT is the horizontal alignment of part labels.',
    choices: ['right', 'left'] as const,
  }),
  DEFAULT_STAVE_MARGIN_BOTTOM: t.number({
    defaultValue: 140,
    help:
      'DEFAULT_STAVE_MARGIN_BOTTOM is the margin between staves within the same part and system. ' +
      "It won't have an effect if there is only one stave per part.",
  }),
  BASE_VOICE_WIDTH: t.number({
    defaultValue: 80,
    help: 'BASE_VOICE_WIDTH is how much extra width to give voices when calculating stave minimum width.',
  }),
  SLOW_WARNING_THRESHOLD_MS: t.number({
    defaultValue: 1,
    help: 'SLOW_WARNING_THRESHOLD_MS is the threshold for a slow operation warning in milliseconds.',
  }),
  DEBUG_DRAW_SYSTEM_RECTS: t.boolean({
    defaultValue: true,
    help: 'DEBUG_DRAW_SYSTEM_RECTS enables drawing of system rectangles for debugging purposes',
  }),
  DEBUG_DRAW_MEASURE_RECTS: t.boolean({
    defaultValue: false,
    help: 'DEBUG_DRAW_MEASURE_RECTS enables drawing of measure rectangles for debugging purposes.',
  }),
  DEBUG_DRAW_STAVE_RECTS: t.boolean({
    defaultValue: false,
    help: 'DEBUG_DRAW_STAVE_RECTS enables drawing of stave rectangles for debugging purposes.',
  }),
  DEBUG_DRAW_STAVE_INTRINSIC_RECTS: t.boolean({
    defaultValue: false,
    help: 'DEBUG_DRAW_STAVE_INTRINSIC_RECTS enables drawing of stave intrinsic rectangles for debugging purposes.',
  }),
  DEBUG_DRAW_VOICE_RECTS: t.boolean({
    defaultValue: false,
    help: 'DEBUG_DRAW_VOICE_RECTS enables drawing of voice rectangles for debugging purposes.',
  }),
  DEBUG_DRAW_VOICE_ENTRY_RECTS: t.boolean({
    defaultValue: false,
    help: 'DEBUG_DRAW_VOICE_ENTRY_RECTS enables drawing of voice entry rectangles for debugging purposes.',
  }),
};

export const DEFAULT_CONFIG = t.defaultConfig(CONFIG);
