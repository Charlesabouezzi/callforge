import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import VideoCall from './components/VideoCall';

const STAGES = [
  { id: 'discovery', label: 'Discovery Call', icon: '🔍', passingScore: 68 },
  { id: 'demo', label: 'Product Demo', icon: '🖥️', passingScore: 72 },
  { id: 'negotiation', label: 'Negotiation & Close', icon: '🤝', passingScore: 78 },
];

const ICP_PROFILES = {
  cfo: { title: 'CFO', color: '#f59e0b', emoji: '💼' },
  coo: { title: 'COO', color: '#22c55e', emoji: '⚙️' },
  cto: { title: 'CTO', color: '#38bdf8', emoji: '🔧' },
  vp_sales: { title: 'VP Sales', color: '#a78bfa', emoji: '📈' },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedICPs, setSelectedICPs] = useState([]);
  const [selectedSize, setSelectedSize] = useState('mid_market');
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) setView('dashboard');
      setLoading(false);
    });
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Check your email to confirm!');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('login');
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  if (view === 'login' && !user) {
    return (
      <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', fontFamily: 'Arial' }}>
        <h1>CallForge</h1>
        <form onSubmit={view === 'login' ? handleLogin : handleSignUp}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>
            {view === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button onClick={() => setView(view === 'login' ? 'signup' : 'login')} style={{ marginTop: '10px', width: '100%', padding: '10px', background: '#e5e7eb', border: 'none', cursor: 'pointer' }}>
          {view === 'login' ? 'Need an account?' : 'Already have an account?'}
        </button>
      </div>
    );
  }

  if (inCall) {
    return <VideoCall stage={selectedStage} icps={selectedICPs} companySize={selectedSize} onEndCall={() => setInCall(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Arial' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>CallForge</h1>
        <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <h2>Hey, {user?.email}! 👋</h2>
        <p>Ready to level up your sales skills?</p>

        {/* Training Section */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '8px', marginTop: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3>Start Training</h3>
          
          {/* Stage Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Pick a Stage:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {STAGES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStage(s.id); setSelectedICPs([]); }}
                  style={{
                    padding: '15px',
                    border: selectedStage === s.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
                    background: selectedStage === s.id ? '#eff6ff' : 'white',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div>{s.icon}</div>
                  <div>{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* ICP Selection */}
          {selectedStage && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Pick ICPs (up to 3):</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {Object.entries(ICP_PROFILES).map(([key, profile]) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (selectedICPs.includes(key)) {
                        setSelectedICPs(selectedICPs.filter(i => i !== key));
                      } else if (selectedICPs.length < 3) {
                        setSelectedICPs([...selectedICPs, key]);
                      }
                    }}
                    style={{
                      padding: '15px',
                      border: selectedICPs.includes(key) ? `2px solid ${profile.color}` : '1px solid #d1d5db',
                      background: selectedICPs.includes(key) ? `${profile.color}20` : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div>{profile.emoji}</div>
                    <div>{profile.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Call Button */}
          {selectedStage && selectedICPs.length > 0 && (
            <button
              onClick={() => setInCall(true)}
              style={{
                padding: '15px 30px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              🎬 Start Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
