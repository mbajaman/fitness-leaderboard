import React, { useMemo } from 'react';
import newsLines from '../data/newsTicker.json';
import './NewsTicker.css';

const SEPARATOR = '   ◆   ';

/**
 * Headlines load from `src/data/newsTicker.json` — edit that file to add or remove lines.
 */
function NewsTicker() {
  const items = useMemo(() => {
    if (!Array.isArray(newsLines)) return [];
    return newsLines.map(line => (typeof line === 'string' ? line.trim() : '')).filter(Boolean);
  }, []);

  const scrollText = useMemo(() => items.join(SEPARATOR), [items]);

  if (!scrollText) {
    return null;
  }

  return (
    <div className="news-ticker" role="region" aria-label="Latest news and updates">
      <div className="news-ticker-accent" aria-hidden="true" />
      <div className="news-ticker-inner">
        <div className="news-ticker-badge" aria-hidden="true">
          <span className="news-ticker-live-dot" />
          <span className="news-ticker-live-label">LIVE</span>
        </div>
        <div className="news-ticker-viewport">
          <div className="news-ticker-track">
            <span className="news-ticker-text">{scrollText}</span>
            <span className="news-ticker-text" aria-hidden="true">
              {scrollText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsTicker;
