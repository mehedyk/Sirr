import { useWebRTC } from '@/hooks/useWebRTC';
import { useRef, useEffect } from 'react';

interface CallWindowProps {
  conversationId: string;
  userId: string;
  onEndCall: () => void;
}

export function CallWindow({ conversationId, userId, onEndCall }: CallWindowProps) {
  const { localStream, remoteStreams, endCall } = useWebRTC({
    conversationId,
    userId,
    initiator: true,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const video = remoteVideoRefs.current.get(userId);
      if (video) {
        video.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const handleEndCall = () => {
    endCall();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-background)] z-50 flex flex-col">
      <div className="flex-1 grid grid-cols-2 gap-4 p-4">
        {/* Local video */}
        <div className="relative bg-[var(--color-background-secondary)] rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
            You
          </div>
        </div>

        {/* Remote videos */}
        {Array.from(remoteStreams.entries()).map(([remoteUserId]) => (
          <div
            key={remoteUserId}
            className="relative bg-[var(--color-background-secondary)] rounded-lg overflow-hidden"
          >
            <video
              ref={(el) => {
                if (el) remoteVideoRefs.current.set(remoteUserId, el);
              }}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
              User {remoteUserId.slice(0, 8)}
            </div>
          </div>
        ))}
      </div>

      {/* Call controls */}
      <div className="p-4 border-t border-[var(--color-border)] flex justify-center">
        <button
          onClick={handleEndCall}
          className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700"
        >
          End Call
        </button>
      </div>
    </div>
  );
}
