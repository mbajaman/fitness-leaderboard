import React from 'react';
import Leaderboard from './components/Leaderboard';
import './App.css';

function AppHeader() {
  return (
    <header className="App-header">
      <h1>
        <span className="logo" aria-hidden="true">
          🏆
        </span>
        March Madness Fitness Challenge Results
        <span className="logo" aria-hidden="true">
          🏆
        </span>
      </h1>
      <p>The challenge is over. Final standings are now live.</p>
    </header>
  );
}

function AppContent() {
  return (
    <div className="App">
      <AppHeader />
      <main>
        <Leaderboard />
      </main>
      <footer>
        <p>
          &copy; {new Date().getFullYear()} March Madness Fitness Challenge Leaderboard. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
