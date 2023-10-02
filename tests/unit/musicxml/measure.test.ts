import { Attributes } from '@/musicxml/attributes';
import { Barline } from '@/musicxml/barline';
import { Measure } from '@/musicxml/measure';
import { Note } from '@/musicxml/note';
import { Print } from '@/musicxml/print';
import { xml } from '@/util';
import { Backup } from '@/musicxml/backup';
import { Forward } from '@/musicxml/forward';

describe(Measure, () => {
  describe('isImplicit', () => {
    it('returns whether the measure number should show', () => {
      const node = xml.measure({ implicit: 'yes' });
      const measure = new Measure(node);
      expect(measure.isImplicit()).toBeTrue();
    });

    it('defaults to false when missing', () => {
      const node = xml.measure();
      const measure = new Measure(node);
      expect(measure.isImplicit()).toBeFalse();
    });

    it('defaults to false when invalid', () => {
      const node = xml.measure({ implicit: 'lol' });
      const measure = new Measure(node);
      expect(measure.isImplicit()).toBeFalse();
    });
  });

  describe('getNumber', () => {
    it('returns the measure number', () => {
      const node = xml.measure({ number: '1' });
      const measure = new Measure(node);
      expect(measure.getNumber()).toBe('1');
    });

    it('returns empty string when the measure number is missing', () => {
      const node = xml.measure();
      const measure = new Measure(node);
      expect(measure.getNumber()).toBe('');
    });
  });

  describe('hasWidth', () => {
    it('returns true when the measure width is set', () => {
      const node = xml.measure({ width: 42 });
      const measure = new Measure(node);
      expect(measure.hasWidth()).toBeTrue();
    });

    it('returns false when the measure width is not set', () => {
      const node = xml.measure();
      const measure = new Measure(node);
      expect(measure.hasWidth()).toBeFalse();
    });
  });

  describe('getWidth', () => {
    it('returns the measure width', () => {
      const node = xml.measure({ width: 42 });
      const measure = new Measure(node);
      expect(measure.getWidth()).toBe(42);
    });

    it('defaults null when the measure width is missing', () => {
      const node = xml.measure();
      const measure = new Measure(node);
      expect(measure.getWidth()).toBeNull();
    });

    it('defaults null when the measure width is invalid', () => {
      const node = xml.measure({ width: NaN });
      const measure = new Measure(node);
      expect(measure.getWidth()).toBeNull();
    });
  });

  describe('getAttributes', () => {
    it('returns the attributes elements', () => {
      const attributes1 = xml.attributes();
      const attributes2 = xml.attributes();
      const node = xml.measure({ attributes: [attributes1, attributes2] });

      const measure = new Measure(node);

      expect(measure.getAttributes()).toStrictEqual([new Attributes(attributes1), new Attributes(attributes2)]);
    });
  });

  describe('getNotes', () => {
    it('returns the notes of the measure', () => {
      const note1 = xml.note();
      const note2 = xml.note();
      const node = xml.measure({ notes: [note1, note2] });

      const measure = new Measure(node);

      expect(measure.getNotes()).toStrictEqual([new Note(note1), new Note(note2)]);
    });

    it('returns an empty array when there are no notes', () => {
      const node = xml.measure();
      const measure = new Measure(node);
      expect(measure.getNotes()).toBeEmpty();
    });
  });

  describe('getBarlines', () => {
    it('returns the barlines of the measure', () => {
      const barline1 = xml.barline();
      const barline2 = xml.barline();
      const node = xml.measure({ barlines: [barline1, barline2] });

      const measure = new Measure(node);

      expect(measure.getBarlines()).toStrictEqual([new Barline(barline1), new Barline(barline2)]);
    });

    it('returns an empty array when there are no barlines', () => {
      const node = xml.measure();
      const measure = new Measure(node);
      expect(measure.getBarlines()).toBeEmpty();
    });
  });

  describe('getPrints', () => {
    it('returns the prints of the measure', () => {
      const print1 = xml.print();
      const print2 = xml.print();
      const node = xml.measure({ prints: [print1, print2] });

      const measure = new Measure(node);

      expect(measure.getPrints()).toStrictEqual([new Print(print1), new Print(print2)]);
    });
  });

  describe('getEntries', () => {
    it('returns the notes, backups, and forwards of the measure', () => {
      const note1 = xml.note();
      const backup = xml.backup({ duration: xml.duration({ positiveDivisions: 4 }) });
      const note2 = xml.note();
      const forward = xml.forward({ duration: xml.duration({ positiveDivisions: 8 }) });
      const note3 = xml.note();

      const node = xml.measure({ entries: [note1, backup, note2, forward, note3] });
      const measure = new Measure(node);

      expect(measure.getEntries()).toStrictEqual([
        new Note(note1),
        new Backup(backup),
        new Note(note2),
        new Forward(forward),
        new Note(note3),
      ]);
    });

    it('returns an empty array when the measure is empty', () => {
      const node = xml.measure();
      const measure = new Measure(node);
      expect(measure.getEntries()).toBeEmpty();
    });
  });
});
