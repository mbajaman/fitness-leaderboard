import React from 'react';
import Leaderboard from './components/Leaderboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>March Madness Fitness Challenge </h1>
        <p>Track your progress and compete with others!</p>
      </header>
      <main>
        <Leaderboard />
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} March Madness Fitness Challenge Leaderboard. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App; 