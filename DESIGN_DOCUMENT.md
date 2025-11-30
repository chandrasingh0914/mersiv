# Mersiv - 3D Store Viewer & Widget Platform
## Architecture & Design Document

### Overview
Mersiv is a full-stack web application that enables real-time collaborative 3D model visualization on store images, paired with an embeddable JavaScript widget for external websites. Built with Next.js 14, React Three Fiber, MongoDB, and Socket.io.

---

## Architecture Components

### 1. Frontend Application (Task 1)

#### Technology Stack
- **Next.js 14** (App Router): Server-side rendering and API routes
- **React Three Fiber**: 3D rendering and WebGL integration
- **Three.js**: 3D graphics library
- **@react-three/drei**: Helper utilities for R3F
- **shadcn/ui**: Component library for consistent UI theming
- **Socket.io Client**: Real-time bidirectional communication

#### Core Components

**StoreViewer Component**
- Main orchestrator component managing application state
- Fetches store list and selected store details from API
- Integrates Socket.io for real-time collaboration
- Handles model position updates (local, socket broadcast, database persistence)

**Model3DViewer Component**
- Canvas-based 3D rendering environment using React Three Fiber
- Image backdrop rendered as a textured plane in 3D space
- GLB model loading with Three.js GLTFLoader
- Entrance animations using react-spring (models enter one-by-one from corner, scaling from small to final size)
- Drag-and-drop functionality using raycasting for XY positioning
- Camera configured at Z=10 for optimal viewing

**StoreSelect Component**
- Dropdown interface for store selection using shadcn Select component
- Allows users to switch stores dynamically
- Triggers store data reload and Socket.io room switching

**DraggableModel Sub-component**
- Individual 3D model instance with interaction handlers
- Pointer events for drag detection
- Raycaster-based position calculation (projects mouse to Z=0 plane)
- Emits position updates on mouse release

#### Real-time Collaboration (Socket.io)

**Connection Flow:**
1. User selects store → Socket connects → Emits `join-store` event
2. Server validates max 2 users per store
3. If full, emits `store_full` error; if accepted, joins room
4. Server broadcasts `user_count` to all users in store

**Position Updates:**
1. User drags model → Local state updates for immediate feedback
2. On mouse release → Three updates occur simultaneously:
   - Socket emits `model-position-update` to other users in room
   - API PATCH request persists to MongoDB
   - Local state reflects final position
3. Other users receive `model-position-changed` event → Update their local state

**Conflict Resolution:**
- Last write wins (simple but effective for 2 concurrent users)
- Database update is source of truth
- Socket ensures near-instant visual feedback

---

### 2. Backend Services

#### API Routes (Next.js App Router)

**`/api/stores` (GET, POST)**
- GET: Returns all stores (id, name, imageUrl, domain)
- POST: Creates new store with models configuration
- MongoDB connection via singleton pattern for connection pooling

**`/api/stores/[id]` (GET, PATCH)**
- GET: Returns full store details including models array
- PATCH: Updates individual model position in models array
- Atomic update using MongoDB findById + save

**`/api/widget/config` (GET)**
- Query parameter: `domain`
- Returns video URL and clickable link for widget
- Domain-based lookup for multi-tenant support

**`/pages/api/socketio` (Socket.io Server)**
- Next.js API route (Pages Router for Socket.io compatibility)
- In-memory store tracking (Map<storeId, Set<socketId>>)
- Room-based broadcasting (store ID = room name)
- Event handlers: `join-store`, `leave-store`, `model-position-update`, `disconnect`

#### Database Schema (MongoDB)

**Store Collection:**
```typescript
{
  _id: ObjectId,
  name: String (unique),
  imageUrl: String,
  domain: String (for widget),
  videoUrl: String (for widget),
  clickableLink: String (for widget),
  models: [
    {
      id: String,
      url: String (GLB file path),
      position: { x: Number, y: Number, z: Number },
      size: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Design Considerations:**
- Embedded models array (denormalized) for read performance
- Indexed on `name` and `domain` fields
- Mongoose ODM for schema validation and middleware

---

### 3. JavaScript Widget (Task 2)

#### Architecture
- **Vanilla JavaScript** (no framework dependencies)
- IIFE (Immediately Invoked Function Expression) for global scope isolation
- Fetches configuration from backend API
- Self-contained styling (no external CSS)

#### Features

**Video Banner:**
- Fixed position (bottom-left with 20px margins)
- 300px width, auto height
- Muted autoplay with loop
- Hover scale animation (1.05x)
- Box shadow and border radius for polish

**Click Behavior:**
- Opens full-screen modal overlay (90% viewport size)
- Loads `clickableLink` in iframe
- Close button (top-right) and ESC key support
- Click outside iframe to close

**Analytics Integration:**
- Tracks three events: `widget_page_loaded`, `widget_video_loaded`, `widget_video_clicked`
- Supports Google Analytics 4 (gtag) and Mixpanel
- Extensible design for additional analytics providers
- Includes timestamp and domain metadata

**Domain-based Configuration:**
- Reads `data-domain` attribute from script tag
- Falls back to `window.location.hostname`
- Backend validates domain and returns store-specific config

#### Embedding Instructions
```html
<script src="http://localhost:3000/widget.js" data-domain="example.com"></script>
```

---

## Data Flow Diagrams

### User Interaction Flow (3D Viewer)
```
User selects store
  → Fetch stores API
  → User clicks store in dropdown
  → Socket.io joins store room (max 2 users)
  → Fetch store details with models
  → Render 3D scene with entrance animations
  → User drags model
  → Update local state + emit socket event + PATCH API
  → Other users receive socket update → Re-render models
```

### Widget Initialization Flow
```
External page loads
  → widget.js executes
  → Track "page_loaded"
  → Extract domain from data attribute
  → Fetch /api/widget/config?domain=X
  → Create fixed video banner
  → User plays video → Track "video_loaded"
  → User clicks video → Track "video_clicked"
  → Open iframe modal with clickableLink
```

---

## Design Decisions

### 1. Why React Three Fiber?
- Declarative 3D scene management with React paradigm
- Automatic memory cleanup and Three.js disposal
- Easy integration with React state and hooks
- Strong ecosystem (@react-three/drei for helpers)

### 2. Why Socket.io?
- Bidirectional real-time communication (WebSocket with fallbacks)
- Built-in room system perfect for multi-store isolation
- Event-based API simpler than raw WebSocket
- Reconnection and error handling out of the box

### 3. Why MongoDB?
- Flexible schema for varying model configurations
- Embedded arrays avoid complex joins for models
- Horizontal scaling capability for production
- JSON-like documents match JavaScript/TypeScript objects

### 4. Why Next.js App Router?
- Server components for SEO and initial load performance
- API routes co-located with frontend code
- TypeScript first-class support
- Vercel deployment optimization

### 5. Widget Design Choices
- **Vanilla JS**: No bundle size overhead, works on any website
- **IIFE pattern**: Prevents global namespace pollution
- **Fixed positioning**: Always visible during scroll
- **Iframe isolation**: Secure, sandboxed content loading

### 6. Entrance Animations
- **Staggered timing**: Creates visual interest (500ms delay per model)
- **Corner-to-position**: Clear indication of where models "come from"
- **Scale animation**: Draws attention to each model appearance
- **react-spring**: Physics-based animations feel natural

---

## Performance Considerations

### Frontend Optimization
- GLB models cached by Three.js loader
- React Three Fiber automatic render loop optimization
- Socket.io binary protocol for efficient messaging
- shadcn components use Radix UI (accessibility + performance)

### Backend Optimization
- MongoDB connection pooling (singleton pattern)
- In-memory socket user tracking (no DB queries for room management)
- API route edge function capability (can deploy to edge)

### Widget Optimization
- Inline styles (no CSS file request)
- Lazy iframe loading (only on click)
- Muted autoplay (no audio data transfer)
- Video served from cloud storage (CDN recommended)

---

## Security Considerations

1. **API Validation**: All inputs validated server-side
2. **Domain Whitelist**: Widget config requires exact domain match
3. **Iframe Sandbox**: Clickable links loaded in sandboxed iframe
4. **Socket Authentication**: Can add JWT validation for production
5. **MongoDB Injection**: Mongoose schema validation prevents NoSQL injection
6. **CORS**: Configure for production domains only

---

## Deployment Recommendations

### Production Setup
1. **Frontend/Backend**: Deploy to Vercel or Netlify
2. **MongoDB**: MongoDB Atlas (managed cloud database)
3. **File Storage**: AWS S3 or Cloudflare R2 for GLB models and images
4. **Socket.io**: Use Redis adapter for horizontal scaling
5. **CDN**: CloudFront or Cloudflare for static assets

### Environment Variables
```env
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### Scaling Strategy
- **Socket.io**: Redis adapter enables multi-server deployment
- **MongoDB**: Sharding by store ID for large catalogs
- **CDN**: Serve widget.js and assets from edge locations
- **Rate Limiting**: Implement on API routes to prevent abuse

---

## Testing Strategy

### Unit Tests
- Model position calculation logic
- Socket event handlers
- API route handlers
- MongoDB model validation

### Integration Tests
- Store selection flow
- Real-time position sync between clients
- Widget configuration API
- Analytics event emission

### E2E Tests (Playwright/Cypress)
- Full user journey: select store → view models → drag model
- Multi-user collaboration (2 browsers)
- Widget loading on external site

---

## Future Enhancements

1. **Authentication**: User login with permissions
2. **Model Upload**: Admin panel for adding GLB files
3. **Rotation Control**: Allow model rotation in addition to position
4. **Mobile Optimization**: Touch gesture support for 3D manipulation
5. **Analytics Dashboard**: Visualize widget engagement metrics
6. **A/B Testing**: Multiple video variants for widget
7. **Offline Support**: Service worker for PWA capabilities
8. **WebRTC**: Peer-to-peer video chat for collaborating users

---

## Conclusion

Mersiv demonstrates modern web architecture combining 3D graphics, real-time collaboration, and embeddable widgets. The separation between visualization (Task 1) and distribution (Task 2) allows independent scaling and deployment. The technology stack prioritizes developer experience (TypeScript, React) while maintaining performance (Next.js, Socket.io) and flexibility (MongoDB, vanilla JS widget).

**Key Strengths:**
- Real-time collaboration with conflict resolution
- Beautiful 3D entrance animations
- Embeddable widget with zero dependencies
- Comprehensive analytics tracking
- Production-ready architecture

**Repository Structure:**
```
mersiv/
├── app/                    # Next.js App Router pages
├── components/             # React components (3D viewer, UI)
├── hooks/                  # Custom React hooks (useSocket)
├── lib/                    # Utilities (MongoDB connection)
├── models/                 # Mongoose schemas
├── pages/api/              # Socket.io server (Pages Router)
├── public/                 # Static files (widget.js)
├── types/                  # TypeScript type definitions
└── package.json
```

---

**Document Version:** 1.0  
**Last Updated:** November 30, 2025  
**Author:** GitHub Copilot
