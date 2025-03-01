import React, { useState } from 'react';
import Leaderboard from './components/Leaderboard';
import Settings from './components/Settings';
import dumbbell from './assets/dumbbell.png';
import settingsIcon from './assets/settings.png';
import './App.css';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <button className="settings-button" onClick={openSettings}>
          <img src={settingsIcon} alt="Settings" />
        </button>
        <h1>
          <img className="logo" src={dumbbell} alt="March Madness Fitness Challenge Logo" />
          March Madness Fitness Challenge 
          <img className="logo" src={dumbbell} alt="March Madness Fitness Challenge Logo" />
        </h1>
        <p>Track your progress and compete with others!</p>
      </header>
      <main>
        <Leaderboard />
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} March Madness Fitness Challenge Leaderboard. All rights reserved.</p>
      </footer>
      
      <Settings isOpen={isSettingsOpen} onClose={closeSettings} />
    </div>
  );
}

export default App; 