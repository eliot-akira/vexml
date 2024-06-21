import * as musicxml from '@/musicxml';
import * as mxl from '@/mxl';
import * as rendering from '@/rendering';
import * as cursors from '@/cursors';
import * as events from '@/events';
import { Config, DEFAULT_CONFIG } from '@/config';

export type RenderOptions = {
  container: HTMLDivElement | HTMLCanvasElement;
  config?: Partial<Config>;
  width: number;
};

/** Vexml contains the core operation of this library: rendering MusicXML in a web browser. */
export class Vexml {
  constructor(private musicXML: musicxml.MusicXML) {}

  /** Creates an instance from a MusicXML string. */
  static fromMusicXML(musicXML: string): Vexml {
    const doc = new DOMParser().parseFromString(musicXML, 'application/xml');
    const root = new musicxml.MusicXML(doc);
    return new Vexml(root);
  }

  /** Creates an instance from a buffer containing a MusicXML string. */
  static fromBuffer(buffer: Buffer): Vexml {
    return Vexml.fromMusicXML(buffer.toString());
  }

  /** Creates an instance from a URL that corresponds to a MusicXML string. */
  static async fromURL(url: string | URL | Request): Promise<Vexml> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`expected response to be ok, got: ${response.statusText} (${response.status})`);
    }
    const musicXML = await response.text();
    return Vexml.fromMusicXML(musicXML);
  }

  /** Creates an instance from a Blob of a MusicXML string or a .mxl archive (compressed MusicXML file). */
  static async fromBlob(blob: Blob): Promise<Vexml> {
    const errors = [];

    // Try parsing as MXL.
    try {
      const musicXML = await new mxl.MXL(blob).getMusicXML();
      return Vexml.fromMusicXML(musicXML);
    } catch (e) {
      errors.push(`tried to parse as MXL, but got: ${e}`);
    }

    // Try parsing as MusicXML.
    try {
      const musicXML = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error(`expected string from reading file, got: ${typeof result}`));
          }
        };
        reader.readAsText(blob);
      });
      return Vexml.fromMusicXML(musicXML);
    } catch (e) {
      errors.push(`tried to parse directly as MusicXML, but got ${e}`);
    }

    throw new Error(errors.join('\n\n'));
  }

  /** Creates an instance from a File of a MusicXML string or a .mxl archive (compressed MusicXML file). */
  static async fromFile(file: File): Promise<Vexml> {
    return Vexml.fromBlob(file);
  }

  /** Renders the vexml instance to an SVG element. */
  render(opts: RenderOptions): rendering.Rendering {
    const config = { ...DEFAULT_CONFIG, ...opts.config };
    const container = opts.container;
    const width = opts.width;

    // Render score.
    const scorePartwise = this.musicXML.getScorePartwise();
    const score = new rendering.Score({ config, musicXML: { scorePartwise } });
    const scoreRendering = score.render({ container, width });

    // Make a cursor.
    let host: HTMLCanvasElement | SVGElement;
    if (container instanceof HTMLCanvasElement) {
      host = container;
    } else if (container instanceof HTMLDivElement) {
      host = container.firstElementChild as SVGElement;
    } else {
      throw new Error(`expected container to be a canvas or div, got: ${container}`);
    }

    const locator = rendering.Locator.fromScoreRendering(scoreRendering);
    if (config.DEBUG_DRAW_TARGET_BOUNDS) {
      const ctx = scoreRendering.vexflow.renderer.getContext();
      locator.draw(ctx);
    }

    // Initialize event routing.
    const vexmlEventTopic = new events.Topic<rendering.EventMap>();
    const nativeEventTopic = new events.Topic<events.NativeEventMap<SVGElement>>();
    const cursor = new cursors.PointCursor(host, locator);
    const mappings = new rendering.EventMappingFactory(cursor, vexmlEventTopic).create(config.INPUT_TYPE);
    const bridge = new events.NativeBridge<keyof rendering.EventMap>({
      host,
      mappings,
      nativeEventTopic,
      nativeEventOpts: { touchstart: { passive: true }, touchend: { passive: true } },
    });

    return new rendering.Rendering({ config, topic: vexmlEventTopic, bridge, container });
  }

  /** Returns the document string. */
  getDocumentString(): string {
    return this.musicXML.getDocumentString();
  }
}
