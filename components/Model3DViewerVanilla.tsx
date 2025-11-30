'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Global cache for loaded models and textures
const modelCache = new Map<string, GLTF>();
const textureCache = new Map<string, THREE.Texture>();

interface Model3DViewerProps {
  imageUrl: string;
  models: Array<{
    url: string;
    position: { x: number; y: number; z: number };
    size: number;
    id: string;
  }>;
  onModelPositionChange: (modelId: string, position: { x: number; y: number; z: number }) => void;
}

export default function Model3DViewer({ imageUrl, models, onModelPositionChange }: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isDraggingRef = useRef<{ modelId: string; offset: THREE.Vector3 } | null>(null);
  const isRotatingRef = useRef<{ modelId: string; startX: number; startY: number; startRotationY: number; startRotationX: number } | null>(null);
  const planeRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const animationFrameRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingState, setLoadingState] = useState({
    background: false,
    modelsTotal: 0,
    modelsLoaded: 0,
  });
  const loadedModelUrlsRef = useRef<Set<string>>(new Set());
  const cameraAnimationRef = useRef<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null>(null);
  const isMountedRef = useRef<boolean>(true); // Track if component is mounted
  
  // First-person camera controls
  const keysPressed = useRef<Set<string>>(new Set());
  const cameraRotationRef = useRef({ yaw: 0, pitch: 0 }); // Camera rotation angles
  const isMouseLookActive = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cameraVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const moveSpeed = 0.1; // Movement speed
  const mouseSensitivity = 0.002; // Mouse look sensitivity
  const doorEntranceComplete = useRef(false);

  const isLoading = !loadingState.background || loadingState.modelsLoaded < loadingState.modelsTotal;

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Capture refs at the start for cleanup
    const container = containerRef.current;
    const models = modelsRef.current;
    
    // Prevent duplicate initialization
    if (rendererRef.current) {
      console.log('⚠️ Renderer already initialized, skipping...');
      return;
    }

    console.log('🚀 Initializing Three.js scene...');

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Create camera with first-person perspective
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    // Start outside the door, looking into the store
    camera.position.set(0, 0.5, 35); // Elevated view (y=0.5 for eye level), far back
    cameraRef.current = camera;
    doorEntranceComplete.current = false;

    // Animate entering through the door
    cameraAnimationRef.current = {
      startPos: new THREE.Vector3(0, 0.5, 35),
      endPos: new THREE.Vector3(0, 0.5, 12), // Move into the store
      startTime: Date.now(),
      duration: 2500, // 2.5 seconds entrance animation
    };

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Load background image with caching
    console.log('🖼️ Loading background image:', imageUrl);
    
    if (textureCache.has(imageUrl)) {
      console.log('✅ Background image loaded from cache');
      const cachedTexture = textureCache.get(imageUrl)!;
      const geometry = new THREE.PlaneGeometry(16, 9);
      const material = new THREE.MeshBasicMaterial({ map: cachedTexture });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.z = -1;
      scene.add(mesh);
      // Use setTimeout to avoid setState in effect
      setTimeout(() => setLoadingState(prev => ({ ...prev, background: true })), 0);
    } else {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        imageUrl,
        (texture) => {
          console.log('✅ Background image loaded successfully');
          textureCache.set(imageUrl, texture);
          const geometry = new THREE.PlaneGeometry(16, 9);
          const material = new THREE.MeshBasicMaterial({ map: texture });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.z = -1;
          scene.add(mesh);
          setLoadingState(prev => ({ ...prev, background: true }));
        },
        undefined,
        (error) => {
          console.error('❌ Failed to load background image:', error);
          setLoadingState(prev => ({ ...prev, background: true })); // Mark as done even on error
        }
      );
    }

    setTimeout(() => setIsInitialized(true), 0);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Handle door entrance animation
      if (cameraAnimationRef.current && cameraRef.current) {
        const now = Date.now();
        const elapsed = now - cameraAnimationRef.current.startTime;
        const progress = Math.min(elapsed / cameraAnimationRef.current.duration, 1);
        
        // Cubic ease-out for smooth entrance
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Interpolate camera position
        cameraRef.current.position.lerpVectors(
          cameraAnimationRef.current.startPos,
          cameraAnimationRef.current.endPos,
          easeProgress
        );
        
        // Enable controls when animation completes
        if (progress >= 1) {
          doorEntranceComplete.current = true;
          cameraAnimationRef.current = null;
          console.log('🚪 Entered store - Use WASD to move, hold right-click to look around');
        }
      } 
      // First-person movement controls (after entrance)
      else if (doorEntranceComplete.current && cameraRef.current) {
        // Apply keyboard movement
        const camera = cameraRef.current;
        const forward = new THREE.Vector3(
          Math.sin(cameraRotationRef.current.yaw),
          0,
          Math.cos(cameraRotationRef.current.yaw)
        );
        const right = new THREE.Vector3(
          Math.sin(cameraRotationRef.current.yaw + Math.PI / 2),
          0,
          Math.cos(cameraRotationRef.current.yaw + Math.PI / 2)
        );

        const acceleration = new THREE.Vector3(0, 0, 0);
        
        if (keysPressed.current.has('w') || keysPressed.current.has('W')) {
          acceleration.sub(forward); // Forward (inverted for camera)
        }
        if (keysPressed.current.has('s') || keysPressed.current.has('S')) {
          acceleration.add(forward); // Backward
        }
        if (keysPressed.current.has('a') || keysPressed.current.has('A')) {
          acceleration.sub(right); // Left
        }
        if (keysPressed.current.has('d') || keysPressed.current.has('D')) {
          acceleration.add(right); // Right
        }
        if (keysPressed.current.has('q') || keysPressed.current.has('Q')) {
          acceleration.y -= 1; // Down
        }
        if (keysPressed.current.has('e') || keysPressed.current.has('E')) {
          acceleration.y += 1; // Up
        }

        // Normalize and apply movement
        if (acceleration.length() > 0) {
          acceleration.normalize();
          cameraVelocity.current.lerp(acceleration.multiplyScalar(moveSpeed), 0.3);
        } else {
          cameraVelocity.current.multiplyScalar(0.8); // Friction
        }

        camera.position.add(cameraVelocity.current);

        // Boundaries to keep camera in reasonable range
        camera.position.x = Math.max(-15, Math.min(15, camera.position.x));
        camera.position.y = Math.max(0.2, Math.min(8, camera.position.y));
        camera.position.z = Math.max(2, Math.min(35, camera.position.z));

        // Apply camera rotation (mouse look)
        camera.rotation.order = 'YXZ';
        camera.rotation.y = cameraRotationRef.current.yaw;
        camera.rotation.x = cameraRotationRef.current.pitch;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up Three.js scene...');
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      isMountedRef.current = false;
      
      // Use captured refs for cleanup
      
      // Dispose of all models
      models.forEach((model) => {
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      models.clear();

      // Dispose renderer and remove canvas
      const renderer = rendererRef.current;
      if (renderer) {
        renderer.dispose();
        if (container && renderer.domElement) {
          // Force remove the canvas element
          const canvas = renderer.domElement;
          if (canvas.parentNode === container) {
            container.removeChild(canvas);
          }
        }
        rendererRef.current = null;
      }

      // Dispose scene
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => mat.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
        sceneRef.current = null;
      }
      
      cameraRef.current = null;
      setIsInitialized(false);
    };
  }, [imageUrl]);

  // Load and animate models
  useEffect(() => {
    if (!isInitialized || !sceneRef.current) return;

    const loader = new GLTFLoader();
    loader.setCrossOrigin('anonymous');
    const scene = sceneRef.current;

    // Count how many new models need to be loaded
    const newModelsToLoad = models.filter(m => !loadedModelUrlsRef.current.has(m.url));
    
    if (newModelsToLoad.length > 0) {
      console.log('🎨 Initializing model loader, new models to load:', newModelsToLoad.length);
      setLoadingState(prev => ({ 
        ...prev, 
        modelsTotal: prev.modelsTotal + newModelsToLoad.length
      }));
    }

    // Remove old models that are no longer in the list
    const currentModelIds = new Set(models.map(m => m.id));
    modelsRef.current.forEach((modelGroup, id) => {
      if (!currentModelIds.has(id)) {
        scene.remove(modelGroup);
        modelGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
        modelsRef.current.delete(id);
      }
    });

    // Load new models with caching
    models.forEach((modelConfig, index) => {
      if (modelsRef.current.has(modelConfig.id)) {
        // Update existing model position (without reloading)
        const existingModel = modelsRef.current.get(modelConfig.id);
        if (existingModel) {
          existingModel.position.set(
            modelConfig.position.x,
            modelConfig.position.y,
            modelConfig.position.z
          );
        }
        return;
      }

      // Skip if already loaded from this URL
      if (loadedModelUrlsRef.current.has(modelConfig.url)) {
        return;
      }

      console.log(`📦 Loading model ${index + 1}/${models.length}:`, modelConfig.id, modelConfig.url);
      
      // Check cache first
      if (modelCache.has(modelConfig.url)) {
        console.log(`✅ Model loaded from cache: ${modelConfig.id}`);
        const cachedGltf = modelCache.get(modelConfig.url);
        if (cachedGltf) {
          const modelGroup = new THREE.Group();
          // Clone the scene to allow multiple instances
          modelGroup.add(cachedGltf.scene.clone());
          modelGroup.scale.set(0.1, 0.1, 0.1);
          modelGroup.userData.modelId = modelConfig.id;
          modelGroup.userData.targetSize = modelConfig.size;
        
        // Start from corner for entrance animation
        modelGroup.position.set(-5, -5, 0);
        scene.add(modelGroup);
        modelsRef.current.set(modelConfig.id, modelGroup);
        
        // Mark as loaded
        loadedModelUrlsRef.current.add(modelConfig.url);

        // Update loading state immediately for cached models
        setLoadingState(prev => ({ ...prev, modelsLoaded: prev.modelsLoaded + 1 }));

        // Entrance animation
        const startTime = Date.now() + (index * 500);
        const duration = 1000;
        const startPos = { x: -5, y: -5, z: 0 };
        const endPos = modelConfig.position;
        const startScale = 0.1;
        const endScale = modelConfig.size;

        const animateEntrance = () => {
          const now = Date.now();
          if (now < startTime) {
            requestAnimationFrame(animateEntrance);
            return;
          }

          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);

          modelGroup.position.x = startPos.x + (endPos.x - startPos.x) * eased;
          modelGroup.position.y = startPos.y + (endPos.y - startPos.y) * eased;
          modelGroup.position.z = startPos.z + (endPos.z - startPos.z) * eased;

          const scale = startScale + (endScale - startScale) * eased;
          modelGroup.scale.set(scale, scale, scale);

          if (progress < 1) {
            requestAnimationFrame(animateEntrance);
          }
        };

        animateEntrance();
        }
        return;
      }

      // Load from network
      loader.load(
        modelConfig.url,
        (gltf) => {
          console.log('✅ Model loaded successfully:', modelConfig.id);
          // Cache the loaded model
          modelCache.set(modelConfig.url, gltf);
          // Mark as loaded
          loadedModelUrlsRef.current.add(modelConfig.url);
          
          const modelGroup = new THREE.Group();
          modelGroup.add(gltf.scene);
          modelGroup.scale.set(0.1, 0.1, 0.1);
          modelGroup.userData.modelId = modelConfig.id;
          modelGroup.userData.targetSize = modelConfig.size;
          
          // Start from corner for entrance animation
          modelGroup.position.set(-5, -5, 0);
          scene.add(modelGroup);
          modelsRef.current.set(modelConfig.id, modelGroup);

          // Update loading state
          setLoadingState(prev => ({ ...prev, modelsLoaded: prev.modelsLoaded + 1 }));

          // Entrance animation
          const startTime = Date.now() + (index * 500);
          const duration = 1000;
          const startPos = { x: -5, y: -5, z: 0 };
          const endPos = modelConfig.position;
          const startScale = 0.1;
          const endScale = modelConfig.size;

          const animateEntrance = () => {
            const now = Date.now();
            if (now < startTime) {
              requestAnimationFrame(animateEntrance);
              return;
            }

            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            modelGroup.position.x = startPos.x + (endPos.x - startPos.x) * eased;
            modelGroup.position.y = startPos.y + (endPos.y - startPos.y) * eased;
            modelGroup.position.z = startPos.z + (endPos.z - startPos.z) * eased;

            const scale = startScale + (endScale - startScale) * eased;
            modelGroup.scale.set(scale, scale, scale);

            if (progress < 1) {
              requestAnimationFrame(animateEntrance);
            }
          };

          animateEntrance();
        },
        (progress) => {
          const percent = progress.loaded / progress.total * 100;
          console.log(`⏳ Loading ${modelConfig.id}: ${percent.toFixed(0)}%`);
        },
        (error) => {
          console.error(`❌ Error loading model ${modelConfig.id}:`, error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            url: modelConfig.url,
            modelId: modelConfig.id,
            type: error instanceof Error ? error.constructor.name : typeof error
          });
          // Count as loaded even on error to prevent infinite loading
          setLoadingState(prev => ({ ...prev, modelsLoaded: prev.modelsLoaded + 1 }));
        }
      );
    });
  }, [models, isInitialized]);

  // Mouse event handlers
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;

    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    const handleMouseDown = (event: MouseEvent) => {
      if (!containerRef.current || !doorEntranceComplete.current) return;

      // Right-click: activate mouse look
      if (event.button === 2) {
        event.preventDefault();
        isMouseLookActive.current = true;
        lastMousePos.current = { x: event.clientX, y: event.clientY };
        renderer.domElement.style.cursor = 'crosshair';
        console.log('👁️ Mouse look activated');
        return;
      }

      // Left-click: object interaction (drag/rotate)
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const modelObjects: THREE.Object3D[] = [];
      modelsRef.current.forEach((model) => {
        modelObjects.push(model);
      });

      const intersects = raycasterRef.current.intersectObjects(modelObjects, true);

      if (intersects.length > 0) {
        let object = intersects[0].object;
        while (object.parent && !(object.parent instanceof THREE.Scene)) {
          object = object.parent;
        }

        const modelId = object.userData.modelId;
        if (modelId && event.button === 0) {
          // Check if shift is pressed for rotation, otherwise drag
          if (event.shiftKey) {
            isRotatingRef.current = {
              modelId,
              startX: event.clientX,
              startY: event.clientY,
              startRotationY: object.rotation.y,
              startRotationX: object.rotation.x
            };
            renderer.domElement.style.cursor = 'move';
            console.log(`🔄 Rotating object: ${modelId} (horizontal and vertical)`);
          } else {
            const intersectionPoint = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionPoint);
            
            const offset = new THREE.Vector3().subVectors(object.position, intersectionPoint);
            isDraggingRef.current = { modelId, offset };
            renderer.domElement.style.cursor = 'grabbing';
            console.log(`✋ Dragging object: ${modelId}`);
          }
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;

      // Mouse look (first-person camera rotation)
      if (isMouseLookActive.current && doorEntranceComplete.current) {
        const deltaX = event.clientX - lastMousePos.current.x;
        const deltaY = event.clientY - lastMousePos.current.y;
        
        cameraRotationRef.current.yaw -= deltaX * mouseSensitivity;
        cameraRotationRef.current.pitch -= deltaY * mouseSensitivity;
        
        // Clamp pitch to prevent flipping
        cameraRotationRef.current.pitch = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, cameraRotationRef.current.pitch)
        );
        
        lastMousePos.current = { x: event.clientX, y: event.clientY };
        return;
      }

      // Handle position dragging
      if (isDraggingRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        const intersectionPoint = new THREE.Vector3();
        if (raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionPoint)) {
          const model = modelsRef.current.get(isDraggingRef.current.modelId);
          if (model) {
            model.position.copy(intersectionPoint.add(isDraggingRef.current.offset));
          }
        }
      }
      // Handle rotation (both horizontal and vertical)
      else if (isRotatingRef.current) {
        const model = modelsRef.current.get(isRotatingRef.current.modelId);
        if (model) {
          const deltaX = event.clientX - isRotatingRef.current.startX;
          const deltaY = event.clientY - isRotatingRef.current.startY;
          const rotationSpeed = 0.01;
          
          // Horizontal rotation (Y-axis) - left/right mouse movement
          model.rotation.y = isRotatingRef.current.startRotationY + deltaX * rotationSpeed;
          
          // Vertical rotation (X-axis) - up/down mouse movement
          model.rotation.x = isRotatingRef.current.startRotationX - deltaY * rotationSpeed;
        }
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      // Deactivate mouse look
      if (event.button === 2 && isMouseLookActive.current) {
        isMouseLookActive.current = false;
        renderer.domElement.style.cursor = 'default';
        return;
      }

      if (isDraggingRef.current) {
        const model = modelsRef.current.get(isDraggingRef.current.modelId);
        if (model) {
          onModelPositionChange(isDraggingRef.current.modelId, {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z,
          });
        }
        isDraggingRef.current = null;
        renderer.domElement.style.cursor = 'default';
      }
      if (isRotatingRef.current) {
        const model = modelsRef.current.get(isRotatingRef.current.modelId);
        if (model) {
          console.log(`✅ Rotation complete for ${isRotatingRef.current.modelId}: ${model.rotation.y.toFixed(2)} rad`);
        }
        isRotatingRef.current = null;
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleMouseEnter = (event: MouseEvent) => {
      if (isDraggingRef.current || isRotatingRef.current) return;
      
      const rect = containerRef.current!.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      const modelObjects: THREE.Object3D[] = [];
      modelsRef.current.forEach((model) => {
        modelObjects.push(model);
      });

      const intersects = raycasterRef.current.intersectObjects(modelObjects, true);
      renderer.domElement.style.cursor = intersects.length > 0 ? 'grab' : 'default';
    };

    // Keyboard handlers for WASD movement
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!doorEntranceComplete.current) return;
      keysPressed.current.add(event.key);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.key);
    };

    // Prevent context menu on right-click
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousemove', handleMouseEnter);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousemove', handleMouseEnter);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInitialized, onModelPositionChange]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">
                    {loadingState.modelsLoaded}/{loadingState.modelsTotal}
                  </span>
                </div>
              </div>
              
              {/* Loading Text */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">Loading 3D Scene</h3>
                <p className="text-sm text-gray-600">
                  {!loadingState.background 
                    ? 'Loading background image...' 
                    : `Loading models: ${loadingState.modelsLoaded} of ${loadingState.modelsTotal}`
                  }
                </p>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                  style={{ 
                    width: `${((loadingState.background ? 1 : 0) + loadingState.modelsLoaded) / (1 + loadingState.modelsTotal) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
