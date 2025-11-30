'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Position {
  x: number;
  y: number;
  z: number;
}

export function useSocket(storeId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [maxUsers, setMaxUsers] = useState(2);
  const [storeFull, setStoreFull] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!storeId) return;

    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';
    console.log('=== CONNECTING TO:', socketUrl, '===');
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      console.log('Socket ID:', socketRef.current?.id);
      console.log('Socket URL:', socketUrl);
      setIsConnected(true);
      console.log('Joining store:', storeId);
      socketRef.current?.emit('join_store', storeId);
      console.log('=== join-store EMITTED ===');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

    socketRef.current.on('user_count', (data: { count: number }) => {
      console.log('Received user-count:', data);
      setUserCount(data.count);
    });

    socketRef.current.on('max_users', (data: { max: number }) => {
      console.log('Received max-users:', data);
      setMaxUsers(data.max);
    });

    socketRef.current.on('store_full', (data: { message: string }) => {
      setStoreFull(true);
      console.log(data.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_store', storeId);
        socketRef.current.disconnect();
      }
    };
  }, [storeId]);

  const emitModelPositionUpdate = useCallback((modelId: string, position: Position) => {
    if (socketRef.current && isConnected && storeId) {
      console.log('🚀 Emitting model-position-update:', { storeId, modelId, position });
      socketRef.current.emit('model-position-update', {
        storeId,
        modelId,
        position,
      });
    } else {
      console.warn('⚠️ Cannot emit: socket not connected or no storeId', { isConnected, storeId });
    }
  }, [isConnected, storeId]);

  const onModelPositionChanged = useCallback((callback: (data: { modelId: string; position: Position }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('model-position-changed', callback);
      
      // Return cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.off('model-position-changed', callback);
        }
      };
    }
  }, []);

  return {
    isConnected,
    userCount,
    maxUsers,
    storeFull,
    emitModelPositionUpdate,
    onModelPositionChanged,
  };
}
