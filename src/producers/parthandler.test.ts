import { DEFAULT_CONFIG } from '../di';
import { NoopReceiver } from '../receivers/noopreceiver';
import { PartEndMessage, PartStartMessage } from '../types';
import * as xml from '../util/xml';
import { NoopHandler } from './noophandler';
import { PartHandler } from './parthandler';

describe('PartHandler', () => {
  let receiver: NoopReceiver;
  let measureHandler: NoopHandler;
  let partHandler: PartHandler;

  let receiverSpy: jest.SpyInstance;

  beforeEach(() => {
    receiver = new NoopReceiver();
    measureHandler = new NoopHandler();
    partHandler = new PartHandler({ config: DEFAULT_CONFIG, measureHandler });

    receiverSpy = jest.spyOn(receiver, 'onMessage');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends a partStart message', () => {
    const part = xml.part({ id: 'foo' });

    partHandler.sendMessages(receiver, { node: part });

    expect(receiverSpy).toHaveBeenNthCalledWith<[PartStartMessage]>(1, {
      msgType: 'partStart',
      id: 'foo',
      msgCount: 0,
      msgIndex: 0,
    });
  });

  it('sends a partStart message with a default id', () => {
    const part = xml.part();

    partHandler.sendMessages(receiver, { node: part });

    expect(receiverSpy).toHaveBeenNthCalledWith<[PartStartMessage]>(1, {
      msgType: 'partStart',
      id: 'NN',
      msgCount: 0,
      msgIndex: 0,
    });
  });

  it('sends a partEnd message', () => {
    const part = xml.part({ id: 'foo' });

    partHandler.sendMessages(receiver, { node: part });

    expect(receiverSpy).toHaveBeenLastCalledWith<[PartEndMessage]>({
      msgType: 'partEnd',
      id: 'foo',
      msgCount: 0,
      msgIndex: 0,
    });
  });

  it('sends a partEnd message with a default id', () => {
    const part = xml.part();

    partHandler.sendMessages(receiver, { node: part });

    expect(receiverSpy).toHaveBeenLastCalledWith<[PartEndMessage]>({
      msgType: 'partEnd',
      id: 'NN',
      msgCount: 0,
      msgIndex: 0,
    });
  });

  it('handles measure nodes', () => {
    const measureHandlerSpy = jest.spyOn(measureHandler, 'sendMessages');

    const part = xml.part({
      id: 'foo',
      measures: [xml.measure(), xml.measure(), xml.measure()],
    });

    partHandler.sendMessages(receiver, { node: part });

    expect(measureHandlerSpy).toHaveBeenCalledTimes(3);
  });
});