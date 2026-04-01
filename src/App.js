import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import NewsTicker from './components/NewsTicker';
import Leaderboard from './components/Leaderboard';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import AddStarsModal from './components/AddStarsModal';
import ConnectSlack from './components/ConnectSlack';
import { areEntriesClosed, getEntriesClosedMessage } from './utils/challengeAvailability';
import './App.css';

function AppHeader({ onOpenAddStars }) {
  const { user, login, register, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const entriesClosed = areEntriesClosed();
  const entriesClosedMessage = getEntriesClosedMessage();

  return (
    <header className="App-header">
      <h1>
        <span className="logo" aria-hidden="true">
          🏋️
        </span>
        March Madness Fitness Challenge
        <span className="logo" aria-hidden="true">
          🏋️
        </span>
      </h1>
      <p>Track your progress and compete with others!</p>
      <nav className="header-nav">
        {user ? (
          <>
            <span className="header-username">{user.username}</span>
            <ConnectSlack />
            <button
              type="button"
              className="header-btn header-btn-add"
              onClick={onOpenAddStars}
              disabled={entriesClosed}
              title={entriesClosed ? entriesClosedMessage : undefined}
            >
              + Add
            </button>
            <button type="button" className="header-btn header-btn-logout" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" className="header-btn" onClick={() => setRegisterOpen(true)}>
              Register
            </button>
            <button
              type="button"
              className="header-btn"
              onClick={() => setLoginOpen(true)}
              disabled={entriesClosed}
              title={entriesClosed ? entriesClosedMessage : undefined}
            >
              Login
            </button>
          </>
        )}
      </nav>
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={login}
        switchToRegister={() => {
          setLoginOpen(false);
          setRegisterOpen(true);
        }}
      />
      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={register}
        switchToLogin={() => {
          setRegisterOpen(false);
          setLoginOpen(true);
        }}
      />
    </header>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [addStarsOpen, setAddStarsOpen] = useState(false);
  const entriesClosed = areEntriesClosed();

  const handleOpenAddStars = () => {
    if (!user || entriesClosed) return;
    setAddStarsOpen(true);
  };

  return (
    <div className="App">
      <NewsTicker />
      <AppHeader onOpenAddStars={handleOpenAddStars} />
      <main>
        <Leaderboard />
      </main>
      <footer>
        <p>
          &copy; {new Date().getFullYear()} March Madness Fitness Challenge Leaderboard. All rights
          reserved.
        </p>
      </footer>
      {user && <AddStarsModal isOpen={addStarsOpen} onClose={() => setAddStarsOpen(false)} />}
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
