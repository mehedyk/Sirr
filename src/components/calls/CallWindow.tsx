import { useRef, useEffect, useState } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';

interface CallWindowProps {
  conversationId: string;
  userId: string;
  onEndCall: () => void;
  initiator?: boolean;
}

export function CallWindow({ conversationId, userId, onEndCall, initiator = true }: CallWindowProps) {
  const { localStream, remoteStreams, isConnected, error, endCall, toggleAudio, toggleVideo } = useWebRTC({
    conversationId, userId, initiator,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleEndCall = () => { endCall(); onEndCall(); };

  const handleToggleAudio = () => { toggleAudio(); setAudioMuted(m => !m); };
  const handleToggleVideo = () => { toggleVideo(); setVideoMuted(m => !m); };

  const remoteEntries = Array.from(remoteStreams.entries());

  return (
    <div className="call-window">
      {/* Remote feeds — main area */}
      <div className={`call-remote-grid call-remote-grid--${Math.min(remoteEntries.length, 4)}`}>
        {remoteEntries.length === 0 ? (
          <div className="call-waiting">
            <div className="call-waiting-pulse" />
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3L3 10v8c0 7 5.5 12 13 12S29 25 29 18v-8L16 3z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 16l4 4 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>{isConnected ? 'Connected — waiting for stream…' : 'Waiting for others to join…'}</p>
          </div>
        ) : (
          remoteEntries.map(([remoteUserId, stream]) => (
            <RemoteVideo key={remoteUserId} userId={remoteUserId} stream={stream} />
          ))
        )}
      </div>

      {/* Local feed — picture-in-picture corner */}
      <div className="call-local-pip">
        <video
          ref={localVideoRef}
          autoPlay muted playsInline
          className={`call-local-video ${videoMuted ? 'call-local-video--hidden' : ''}`}
        />
        {videoMuted && (
          <div className="call-video-off">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 3l14 14M8 5H5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-1l4 2.5V7.5L13 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
        <span className="call-local-label">You</span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="call-error-banner">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M7 4v3M7 8.5h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="call-controls">
        <button
          className={`call-ctrl-btn ${audioMuted ? 'call-ctrl-btn--active' : ''}`}
          onClick={handleToggleAudio}
          title={audioMuted ? 'Unmute' : 'Mute'}
          aria-label={audioMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {audioMuted ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M9 13v3M6 16h6M9 1a3 3 0 013 3v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M6 6v2a3 3 0 004.5 2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M4 8a5 5 0 009 3.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="6" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4 8a5 5 0 0010 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M9 13v3M6 16h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        <button
          className="call-ctrl-btn call-ctrl-btn--end"
          onClick={handleEndCall}
          title="End call"
          aria-label="End call"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3.5 12.5a2 2 0 012-2h1a2 2 0 012 2v.5a10.5 10.5 0 005-5H14a2 2 0 01-2-2v-1a2 2 0 012-2h.5a2 2 0 012 2 12.5 12.5 0 01-13 13z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <button
          className={`call-ctrl-btn ${videoMuted ? 'call-ctrl-btn--active' : ''}`}
          onClick={handleToggleVideo}
          title={videoMuted ? 'Start video' : 'Stop video'}
          aria-label={videoMuted ? 'Start camera' : 'Stop camera'}
        >
          {videoMuted ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M8 5H5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-1l4 2.5V7.5L13 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M13 8l4-2.5v7L13 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function RemoteVideo({ userId, stream }: { userId: string; stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="call-remote-feed">
      <video ref={videoRef} autoPlay playsInline className="call-remote-video" />
      <span className="call-remote-label">{userId.slice(0, 8)}</span>
    </div>
  );
}
