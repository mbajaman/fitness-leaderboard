import React from 'react';
import Leaderboard from './components/Leaderboard';
import dumbbell from './assets/dumbbell.png';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
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
    </div>
  );
}

export default App; 