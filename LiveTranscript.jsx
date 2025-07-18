import React, { useEffect, useRef, useState } from 'react';

const LiveTranscript = () => {
  const [status, setStatus] = useState('Connecting…');
  const outRef = useRef(null);
  const lastPartialIndexRef = useRef(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const sessionId = pathParts[pathParts.length - 1];

    const ws_url = "wss://7oryr6x2l9.execute-api.us-east-2.amazonaws.com/dev/";
    const socket = new WebSocket(ws_url);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      setStatus("Live");

      socket.send(JSON.stringify({
        action: "join",
        session_id: sessionId
      }));
    };

    socket.onmessage = (event) => {
      console.log("📥 Message received:", event.data);

      try {
        const data = JSON.parse(event.data);
        const outEl = outRef.current;

        if (!outEl) return;

        if (data.action === 'segment') {
          const { text, is_partial } = data;
          if (!text || !text.trim()) return;

          if (is_partial) {
            if (lastPartialIndexRef.current === null) {
              outEl.textContent += text + '\n';
              lastPartialIndexRef.current = outEl.textContent.split('\n').length - 2;
            } else {
              const lines = outEl.textContent.split('\n');
              lines[lastPartialIndexRef.current] = text;
              outEl.textContent = lines.join('\n');
            }
          } else {
            if (lastPartialIndexRef.current !== null) {
              const lines = outEl.textContent.split('\n');
              lines[lastPartialIndexRef.current] = text;
              outEl.textContent = lines.join('\n');
              lastPartialIndexRef.current = null;
            } else {
              outEl.textContent += text + '\n\n';
            }
          }

          outEl.scrollTop = outEl.scrollHeight;
        }

        if (data.action === 'join_ok') {
          console.log("👍 Successfully joined session");
        }

      } catch (err) {
        console.error("❌ Error parsing WebSocket message:", err, event.data);
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
      setStatus("Error connecting");
    };

    socket.onclose = () => {
      console.warn("⚠️ WebSocket closed");
      setStatus("Disconnected");
    };

    return () => {
      console.log("🔌 Closing WebSocket");
      socket.close();
    };
  }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto', padding: '20px'}}>
      <h2>Live Transcript</h2>
      <div id="status" style={{ marginBottom: '10px', color: '#666' }}>{status}</div>

      <pre
        ref={outRef}
        style={{whiteSpace: 'pre-wrap', fontSize: '1.05em', maxHeight: '70vh', overflowY: 'auto',
          border: '1px solid #ccc', padding: '15px', borderRadius: '6px', backgroundColor: '#f8f9fa'}}
      />
    </div>
  );
};

export default LiveTranscript;
