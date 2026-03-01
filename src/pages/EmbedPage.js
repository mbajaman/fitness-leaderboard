import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Leaderboard from '../components/Leaderboard';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import '../components/Leaderboard.css';
import './EmbedPage.css';

function EmbedPage() {
  const { user, login, register } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div className="embed-page">
      <header className="embed-header">
        <span className="embed-title">March Madness Leaderboard</span>
        {user ? (
          <span className="embed-user">{user.username}</span>
        ) : (
          <>
            <button type="button" className="embed-auth-btn" onClick={() => setRegisterOpen(true)}>
              Register
            </button>
            <button type="button" className="embed-auth-btn" onClick={() => setLoginOpen(true)}>
              Login
            </button>
          </>
        )}
      </header>
      <main className="embed-main">
        <Leaderboard />
      </main>
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
    </div>
  );
}

export default EmbedPage;
