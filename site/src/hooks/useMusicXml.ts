import { useCallback, useState } from 'react';
import { LOCAL_STORAGE_SAVED_MUSICXML_KEY, LOCAL_STORAGE_USE_DEFAULT_MUSICXML_KEY } from '../constants';
import { useLocalStorage } from './useLocalStorage';
import { useDebouncedState } from './useDebouncedState';

const SET_DEBOUNCE_DELAY_MS = 100;

type UpdateType = 'default' | 'normal';

export const useMusicXml = (): {
  value: { current: string; debounced: string; stored: string };
  useDefault: boolean;
  update: (type: UpdateType, value: string) => void;
  save: () => void;
  reset: () => void;
} => {
  const [storedMusicXml, setStoredMusicXml] = useLocalStorage(LOCAL_STORAGE_SAVED_MUSICXML_KEY, '');
  const [musicXml, debouncedMusicXml, setMusicXml] = useDebouncedState(storedMusicXml, SET_DEBOUNCE_DELAY_MS);

  const [storedUseDefault, setStoredUseDefault] = useLocalStorage(LOCAL_STORAGE_USE_DEFAULT_MUSICXML_KEY, 'true');
  const [useDefault, setUseDefault] = useState(storedUseDefault);

  const update = useCallback(
    (type: UpdateType, value: string) => {
      if (type === 'default') {
        setUseDefault('true');
      } else {
        setUseDefault('false');
      }
      setMusicXml(value);
    },
    [setUseDefault, setMusicXml]
  );

  const save = useCallback(() => {
    setStoredUseDefault('false');
    setStoredMusicXml(musicXml);
  }, [setStoredUseDefault, setStoredMusicXml, musicXml]);

  const reset = useCallback(() => {
    setUseDefault('true');
    setStoredUseDefault('true');
    setMusicXml('');
    setStoredMusicXml('');
  }, [setUseDefault, setStoredUseDefault, setMusicXml, setStoredMusicXml]);

  return {
    value: { current: musicXml, debounced: debouncedMusicXml, stored: storedMusicXml },
    useDefault: useDefault === 'true',
    update,
    reset,
    save,
  };
};
