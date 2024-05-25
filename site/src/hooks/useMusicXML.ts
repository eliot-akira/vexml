import { useState } from 'react';
import { Source } from '../types';
import { isEqual } from '../util/isEqual';
import { usePending } from './usePending';

export const useMusicXML = (source: Source) => {
  const [currentSource, setCurrentSource] = useState<Source | null>(null);
  const [musicXML, setMusicXML] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [isPending, withPending] = usePending();

  if (!isEqual(currentSource, source)) {
    setCurrentSource(source);
    switch (source.type) {
      case 'remote':
        withPending(() =>
          fetch(source.url)
            .then((response) => response.text())
            .then(setMusicXML)
            .catch((e) => (e instanceof Error ? setError(e) : setError(new Error(String(e)))))
        );
        break;
      case 'local':
        setMusicXML(source.musicXML);
        break;
    }
  }

  return [musicXML, isPending, error] as const;
};
