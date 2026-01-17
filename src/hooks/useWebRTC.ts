import { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { supabase } from '@/lib/supabase';

interface UseWebRTCOptions {
  conversationId: string;
  userId: string;
  initiator?: boolean;
}

export function useWebRTC({ conversationId, userId, initiator = false }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Get user media
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        localStreamRef.current = stream;
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
      });

    // Set up signaling channel
    const channel = supabase.channel(`webrtc:${conversationId}`);

    channel
      .on('broadcast', { event: 'signal' }, (payload) => {
        const { from, signal } = payload.payload;
        if (from !== userId) {
          const peer = peersRef.current.get(from);
          if (peer) {
            peer.signal(signal);
          }
        }
      })
      .subscribe();

    // Create peer connection for each participant
    const setupPeer = (targetUserId: string, isInitiator: boolean) => {
      const peer = new SimplePeer({
        initiator: isInitiator,
        trickle: false,
        stream: localStreamRef.current || undefined,
      });

      peer.on('signal', (signal) => {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { from: userId, to: targetUserId, signal },
        });
      });

      peer.on('stream', (stream) => {
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.set(targetUserId, stream);
          return newMap;
        });
      });

      peer.on('connect', () => {
        setIsConnected(true);
      });

      peer.on('error', (error) => {
        console.error('Peer error:', error);
      });

      peersRef.current.set(targetUserId, peer);
    };

    // For demo: if initiator, wait for other participants
    // In production, you'd fetch conversation members and set up peers for each
    if (initiator) {
      // Listen for new participants joining
      channel.on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.userId !== userId) {
            setupPeer(presence.userId, true);
          }
        });
      });
    }

    return () => {
      // Cleanup
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peersRef.current.forEach((peer) => peer.destroy());
      channel.unsubscribe();
    };
  }, [conversationId, userId, initiator]);

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peersRef.current.forEach((peer) => peer.destroy());
    peersRef.current.clear();
    setRemoteStreams(new Map());
    setIsConnected(false);
  };

  return {
    localStream,
    remoteStreams,
    isConnected,
    endCall,
  };
}
