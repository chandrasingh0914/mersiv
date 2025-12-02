'use client';

import React, { useEffect, useState } from 'react';
import StoreSelect from './StoreSelect';
import Model3DViewer from './Model3DViewerVanilla';
import VideoWidget from './VideoWidget';
import { useSocket } from '@/hooks/useSocket';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface Store {
  _id: string;
  name: string;
  imageUrl: string;
  videoUrl?: string;
  clickableLink?: string;
  models: Array<{
    url: string;
    position: { x: number; y: number; z: number };
    size: number;
    id: string;
  }>;
}

export default function StoreViewer() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const { isConnected, userCount, maxUsers, storeFull, emitModelPositionUpdate, onModelPositionChanged } = useSocket(selectedStoreId);

  // Fetch all stores
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('🔍 Fetching stores from:', `${apiUrl}/api/stores`);
    fetch(`${apiUrl}/api/stores`)
      .then((res) => {
        console.log('📡 Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('✅ Stores received:', data);
        if (Array.isArray(data)) {
          setStores(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Error fetching stores:', err);
        setLoading(false);
      });
  }, []);

  // Fetch selected store details
  useEffect(() => {
    if (!selectedStoreId) {
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${apiUrl}/api/stores/${selectedStoreId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          // Transform FastAPI response to match frontend format
          const transformedStore = {
            _id: data._id || data.id,
            name: data.name,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl,
            clickableLink: data.clickableLink,
            models: data.models || []
          };
          console.log('📦 Store loaded with video:', transformedStore.videoUrl);
          setSelectedStore(transformedStore);
        }
      })
      .catch((err) => console.error('Error fetching store:', err));
  }, [selectedStoreId]);

  // Listen for real-time position updates from other users
  useEffect(() => {
    if (!selectedStore) return;

    const handlePositionChange = (data: { modelId: string; position: { x: number; y: number; z: number } }) => {
      console.log('📡 Received position update from other user:', data);
      setSelectedStore((prev) => {
        if (!prev) return prev;
        const updatedModels = prev.models.map((model) =>
          model.id === data.modelId ? { ...model, position: data.position } : model
        );
        return { ...prev, models: updatedModels };
      });
    };

    const cleanup = onModelPositionChanged(handlePositionChange);
    
    return cleanup;
  }, [selectedStore, onModelPositionChanged]);

  const handleStoreSelect = (storeId: string) => {
    setSelectedStoreId(storeId);
    setSelectedStore(null); // Clear previous store when selecting new one
  };

  const handleModelPositionChange = async (modelId: string, position: { x: number; y: number; z: number }) => {
    if (!selectedStoreId) return;

    console.log('🎯 Emitting position change:', { modelId, position });

    // Update local state
    setSelectedStore((prev) => {
      if (!prev) return prev;
      const updatedModels = prev.models.map((model) =>
        model.id === modelId ? { ...model, position } : model
      );
      return { ...prev, models: updatedModels };
    });

    // Emit to other users via Socket.io
    emitModelPositionUpdate(modelId, position);

    // Persist to database
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/stores/${selectedStoreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, position }),
      });
    } catch (err) {
      console.error('Error updating model position:', err);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Bar */}
      <div className="bg-white shadow-md border-b border-gray-200 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">3D Store Viewer</h1>
            {selectedStore && (
              <p className="text-sm text-gray-600 mt-1">{selectedStore.name}</p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <StoreSelect
              stores={stores}
              selectedStore={selectedStoreId}
              onStoreSelect={handleStoreSelect}
            />
            
            {selectedStore && (
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-sm font-medium text-gray-700">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="border-l border-gray-300 pl-3">
                  <span className="text-sm text-gray-600">
                    Users: <span className="font-semibold text-gray-800">{userCount} / {maxUsers}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Store Full Alert */}
      {storeFull && (
        <div className="container mx-auto px-4 pt-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              This store is currently full. Maximum {maxUsers} users are allowed at the same time.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Card className="p-8 shadow-lg">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="text-gray-600">Loading stores...</p>
              </div>
            </Card>
          </div>
        ) : selectedStore && !storeFull ? (
          <div className="h-full relative">
            {/* Instructions Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 max-w-xs">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Controls:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1.5">
                <li>• <span className="font-medium">WASD</span> - Move around</li>
                <li>• <span className="font-medium">Q/E</span> - Move up/down</li>
                <li>• <span className="font-medium">Right-Click + Drag</span> - Look around</li>
                <li>• <span className="font-medium">Click + Drag</span> - Move objects</li>
                <li>• <span className="font-medium">Shift + Click + Drag</span> - Rotate objects</li>
              </ul>
            </div>

            {/* 3D Viewer - Fullscreen */}
            <Model3DViewer
              imageUrl={selectedStore.imageUrl}
              models={selectedStore.models}
              onModelPositionChange={handleModelPositionChange}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Card className="p-12 text-center shadow-lg max-w-md">
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">No Store Selected</h2>
              <p className="text-gray-600">
                Please select a store from the dropdown above to view its 3D models
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Video Widget - Only show when store is selected */}
      {selectedStore && <VideoWidget store={selectedStore} />}
    </div>
  );
}
