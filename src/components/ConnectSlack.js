import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ConnectSlack.css';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const LINK_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/slack-create-link-code`
  : '';

function ConnectSlack() {
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    if (!user?.id || !LINK_FUNCTION_URL || !ANON_KEY) {
      setError('Slack linking is not configured.');
      return;
    }
    setError(null);
    setCode(null);
    setLoading(true);
    try {
      const res = await fetch(LINK_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to create code.');
        return;
      }
      setCode(data.code || '');
    } catch (e) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id || !LINK_FUNCTION_URL || !ANON_KEY) return;
    setError(null);
    setDisconnecting(true);
    try {
      const res = await fetch(LINK_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ user_id: user.id, disconnect: true }),
      });
      if (res.ok) await refreshUser();
      else setError('Failed to disconnect.');
    } catch (e) {
      setError('Network error.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (!user) return null;

  const isConnected = !!user.has_slack_linked;
  const canUseSlack = !!LINK_FUNCTION_URL && !!ANON_KEY;

  return (
    <div className="connect-slack">
      {isConnected ? (
        <>
          <span className="connect-slack-status">Slack connected</span>
          <button
            type="button"
            className="header-btn connect-slack-btn"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? '…' : 'Disconnect Slack'}
          </button>
        </>
      ) : canUseSlack ? (
        <>
          <button
            type="button"
            className="header-btn connect-slack-btn"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? '…' : 'Connect Slack'}
          </button>
          {code && (
            <div className="connect-slack-code-box">
              <p className="connect-slack-code-label">In Slack, run:</p>
              <p className="connect-slack-code-command">/link {code}</p>
              <p className="connect-slack-code-hint">Code expires in 15 minutes.</p>
            </div>
          )}
          {error && <span className="connect-slack-error">{error}</span>}
        </>
      ) : null}
    </div>
  );
}

export default ConnectSlack;
