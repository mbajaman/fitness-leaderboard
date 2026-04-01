import React from 'react';
import Leaderboard from '../components/Leaderboard';
import '../components/Leaderboard.css';
import './EmbedPage.css';

function EmbedPage() {
  return (
    <div className="embed-page">
      <header className="embed-header">
        <span className="embed-title">March Madness Final Leaderboard</span>
      </header>
      <main className="embed-main">
        <Leaderboard />
      </main>
    </div>
  );
}

export default EmbedPage;
