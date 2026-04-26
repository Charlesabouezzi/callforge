import React, { useState, useEffect } from 'react';

export default function VideoCall({ stage, icps, companySize, onEndCall }) {
  const [callStarted, setCallStarted] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (!callStarted) return;
    const timer = setInterval(() => setCallTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [callStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    setCallStarted(true);
    setTranscript([{ speaker: 'ai', text: 'Hi, I\'m Jordan. Thanks for taking the time to chat. What brings you in today?' }]);
    setAiSpeaking(true);
    setTimeout(() => setAiSpeaking(false), 3000);
  };

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;
    
    setTranscript(prev => [...prev, { speaker: 'user', text: userMessage }]);
    setUserMessage('');
    setAiSpeaking(true);
    
    setTimeout(() => {
      const responses = [
        'That\'s really interesting. Can you tell me more about your current process?',
        'I see. What are the main pain points you\'re experiencing?',
        'Got it. How is this impacting your team right now?',
        'That makes sense. What would an ideal solution look like for you?'
      ];
      const aiReply = responses[Math.floor(Math.random() * responses.length)];
      setTranscript(prev => [...prev, { speaker: 'ai', text: aiReply }]);
      setAiSpeaking(false);
    }, 2000);
  };

  const handleEndCall = () => {
    setScore(Math.floor(Math.random() * (95 - 65) + 65));
    setCallStarted(false);
  };

  if (score) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#0f172a', color: '#fff', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Call Complete</h1>
        <div style={{ fontSize: '64px', color: score >= 72 ? '#22c55e' : '#f59e0b', marginBottom: '20px' }}>{score}</div>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>Overall Score</p>
        <button onClick={onEndCall} style={{ padding: '12px 24px', fontSize: '16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a', color: '#fff', fontFamily: 'system-ui' }}>
      {/* Main Call Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        {/* Header with Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Discovery Call with Jordan Mitchell</h2>
          {callStarted && <div style={{ fontSize: '18px', fontWeight: 'bold' }}>⏱️ {formatTime(callTime)}</div>}
        </div>

        {/* Video Grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* AI Avatar */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '16px',
              animation: aiSpeaking ? 'pulse 0.5s infinite' : 'none'
            }}>🎯</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Jordan Mitchell</h3>
            <p style={{ margin: '0', fontSize: '14px', opacity: 0.9 }}>VP of Sales</p>
            {aiSpeaking && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                display: 'flex',
                gap: '6px'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'bounce 1s infinite' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'bounce 1s infinite 0.2s' }}></div>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'bounce 1s infinite 0.4s' }}></div>
              </div>
            )}
            <style>{`
              @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
              @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            `}</style>
          </div>

          {/* Your Camera Feed */}
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #3b82f6',
            position: 'relative'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '12px' }}>📷</div>
              <p style={{ margin: '0' }}>Your Camera</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.7 }}>Charles Abouezzi</p>
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '16px',
          height: '200px',
          overflowY: 'auto',
          marginBottom: '16px',
          border: '1px solid #334155'
        }}>
          {transcript.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <strong style={{ color: msg.speaker === 'ai' ? '#a78bfa' : '#38bdf8' }}>
                {msg.speaker === 'ai' ? '🎯 Jordan' : '👤 You'}:
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!callStarted ? (
            <button onClick={handleStartCall} style={{
              padding: '12px 24px',
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              🎤 Start Call
            </button>
          ) : (
            <>
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              <button onClick={handleSendMessage} style={{
                padding: '12px 20px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                Send
              </button>
              <button onClick={handleEndCall} style={{
                padding: '12px 20px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                End Call
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right Sidebar - Coaching Tips */}
      <div style={{
        width: '280px',
        background: '#1e293b',
        borderLeft: '1px solid #334155',
        padding: '20px',
        overflowY: 'auto'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>📋 Focus Areas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', fontSize: '13px' }}>
            <strong>🎯 Discovery</strong>
            <p style={{ margin: '4px 0 0 0' }}>Ask open-ended questions about their current state</p>
          </div>
          <div style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', fontSize: '13px' }}>
            <strong>💡 Pain Points</strong>
            <p style={{ margin: '4px 0 0 0' }}>Dig deeper into what's not working</p>
          </div>
          <div style={{ padding: '12px', background: '#0f172a', borderRadius: '8px', fontSize: '13px' }}>
            <strong>✅ Qualification</strong>
            <p style={{ margin: '4px 0 0 0' }}>Confirm if they're a good fit before the demo</p>
          </div>
        </div>

        <h3 style={{ margin: '24px 0 12px 0', fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>📊 Your Score</h3>
        <div style={{
          padding: '16px',
          background: '#0f172a',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0', opacity: 0.7 }}>Call in progress...</p>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>—</div>
        </div>
      </div>
    </div>
  );
}
