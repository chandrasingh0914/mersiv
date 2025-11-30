# Mersiv - 3D Store Viewer & Widget Platform

A Next.js-based platform for displaying 3D models on store images with real-time collaboration, plus an embeddable JavaScript widget for external websites.

## Features

### Task 1: 3D Models on Image
- 🏪 Multi-store support with dynamic store selection
- 🎨 3D GLB models overlaid on store images
- ✨ Entrance animations (staggered, corner-to-position with scaling)
- 🖱️ Drag-and-drop model positioning (XY plane)
- 👥 Real-time collaboration (max 2 concurrent users per store)
- 🔄 Live position synchronization via Socket.io
- 💾 Persistent model positions in MongoDB
- 🎯 Last-write-wins conflict resolution
- 🎨 shadcn/ui themed interface

### Task 2: JS Widget
- 📺 Embeddable video banner widget
- 📌 Fixed position (lower-left, scroll-persistent)
- 🔗 Clickable with iframe modal
- 🌐 Domain-based configuration loading
- 📊 Analytics integration (Google Analytics, Mixpanel)
- 🎯 Tracks: page load, video load, video click

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript
- **3D Graphics:** React Three Fiber, Three.js, @react-three/drei
- **UI Components:** shadcn/ui (Radix UI + Tailwind CSS)
- **Real-time:** Socket.io (WebSocket)
- **Database:** MongoDB (Mongoose ODM)
- **Animations:** react-spring
- **Widget:** Vanilla JavaScript (IIFE)

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- Modern browser with WebGL support

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create `.env.local` file:
```env
MONGODB_URI=mongodb://localhost:27017/mersiv
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

3. **Seed sample data (optional):**
```bash
node scripts/seed-data.js
```

4. **Run development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 3D Store Viewer

1. Navigate to the homepage
2. Select a store from the dropdown
3. View 3D models with entrance animations
4. Drag models to reposition them
5. Changes are visible to other users in real-time
6. Up to 2 users can edit simultaneously

### Embedding the Widget

Add this script to any HTML page:

```html
<script src="http://localhost:3000/widget.js" data-domain="example.com"></script>
```

**Test the widget:**
Open `http://localhost:3000/widget-test.html`

## Project Structure

```
mersiv/
├── app/
│   ├── api/
│   │   ├── stores/          # Store CRUD API routes
│   │   └── widget/          # Widget configuration API
│   ├── page.tsx             # Homepage (store viewer)
│   └── layout.tsx
├── components/
│   ├── Model3DViewer.tsx    # 3D canvas with drag-drop
│   ├── StoreSelect.tsx      # Store dropdown selector
│   ├── StoreViewer.tsx      # Main orchestrator component
│   └── ui/                  # shadcn components
├── hooks/
│   └── useSocket.ts         # Socket.io client hook
├── lib/
│   ├── mongodb.ts           # MongoDB connection
│   └── utils.ts             # Utility functions
├── models/
│   └── Store.ts             # Mongoose schema
├── pages/api/
│   └── socketio.ts          # Socket.io server
├── public/
│   ├── widget.js            # Embeddable widget
│   └── widget-test.html     # Widget demo page
├── scripts/
│   └── seed-data.js         # Sample data seeding
└── DESIGN_DOCUMENT.md       # Architecture documentation
```

## API Documentation

### Store APIs

**GET /api/stores**
- Returns: Array of all stores (id, name, imageUrl, domain)

**GET /api/stores/[id]**
- Returns: Full store details including models array

**POST /api/stores**
- Body: Store object with models
- Returns: Created store document

**PATCH /api/stores/[id]**
- Body: `{ modelId: string, position: { x, y, z } }`
- Returns: Updated store document

### Widget API

**GET /api/widget/config?domain=[domain]**
- Returns: `{ videoUrl, clickableLink, storeName }`

## Database Schema

```javascript
{
  name: String,              // Unique store name
  imageUrl: String,          // Background image URL
  domain: String,            // For widget lookup
  videoUrl: String,          // Widget video URL
  clickableLink: String,     // Widget iframe link
  models: [
    {
      id: String,            // Unique model identifier
      url: String,           // GLB model file URL
      position: { x, y, z }, // 3D coordinates
      size: Number           // Model scale factor
    }
  ]
}
```

## Development

### Adding New Stores

```javascript
POST /api/stores
{
  "name": "My Store",
  "imageUrl": "https://example.com/store-image.jpg",
  "domain": "mystore.com",
  "videoUrl": "https://example.com/video.mp4",
  "clickableLink": "https://mystore.com/promo",
  "models": [
    {
      "id": "model-1",
      "url": "https://example.com/models/chair.glb",
      "position": { "x": 0, "y": 0, "z": 0 },
      "size": 1
    }
  ]
}
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

See `DESIGN_DOCUMENT.md` for detailed deployment instructions including:
- Vercel deployment
- MongoDB Atlas setup
- CDN configuration for assets
- Socket.io scaling with Redis

## Troubleshooting

**Socket.io not connecting:**
- Ensure `/api/socketio` route is accessible
- Check NEXT_PUBLIC_SOCKET_URL is correct

**3D models not loading:**
- Verify GLB file URLs are accessible
- Check CORS headers on model files

**Widget not appearing:**
- Check domain matches MongoDB store record
- Verify script tag has correct `data-domain`

**MongoDB connection failed:**
- Check MONGODB_URI in .env.local
- Ensure MongoDB is running

## Documentation

For detailed architecture, design decisions, and technical considerations, see [DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md).

## License

MIT

---

**Built with ❤️ using Next.js, React Three Fiber, and Socket.io**
