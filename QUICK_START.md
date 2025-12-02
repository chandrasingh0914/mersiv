# Quick Start Guide

## Initial Setup (5 minutes)

### 1. Start MongoDB
If using local MongoDB:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongodb
```

Or use MongoDB Atlas (cloud):
- Create free cluster at mongodb.com/cloud/atlas
- Get connection string
- Update `.env.local` with your connection string

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed Sample Data
```bash
npm run seed
```

This creates 3 sample stores:
- Tech Store Downtown (MacBook, iPhone, AirPods)
- Fashion Boutique (Shoes, Bag)
- Furniture Gallery (Chair, Table, Lamp)

### 4. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

## Testing the 3D Store Viewer

1. Select "Tech Store Downtown" from dropdown
2. Watch models animate in one-by-one
3. Drag any model to reposition it
4. Open another browser window (incognito mode)
5. Select the same store
6. Drag a model in one window → See it update in the other!

**Concurrent Users Test:**
- Open 2 browser windows → Both can edit ✅
- Open 3rd window → Shows "Store is full" message ✅


## Analytics Tracking

The widget automatically tracks:
1. **Page Load** - When page with widget loads
2. **Video Load** - When video successfully loads
3. **Video Click** - When user clicks the video banner

Events are sent to:
- Google Analytics (if `gtag` function exists)
- Mixpanel (if `mixpanel` object exists)
- Console (always logged for debugging)

### Adding Google Analytics

In your HTML `<head>`:
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Adding Mixpanel

```html
<script src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"></script>
<script>
  mixpanel.init('YOUR_PROJECT_TOKEN');
</script>
```


## Finding 3D Models (GLB Format)

Free GLB model sources:
- **Sketchfab**: sketchfab.com (filter by "Downloadable")
- **Poly Pizza**: poly.pizza
- **Google Poly Archive**: poly.cam
- **Three.js Examples**: github.com/mrdoob/three.js/tree/dev/examples/models

**Tips:**
- Use GLB format (not GLTF with separate files)
- Host on cloud storage (S3, Cloudflare R2, Firebase)
- Keep file size under 5MB for fast loading
- Ensure CORS is enabled on hosting server

## Position & Size Guidelines

**Position Coordinates:**
- X axis: -5 (left) to +5 (right)
- Y axis: -3 (bottom) to +3 (top)
- Z axis: Usually 0 (keep models on image plane)

**Size (Scale):**
- 0.1 = Very small
- 0.5 = Small
- 1.0 = Default/Medium
- 2.0 = Large
- 5.0 = Very large

**Example Positions:**
```json
{
  "models": [
    { "position": { "x": -3, "y": 2, "z": 0 }, "size": 0.5 },   // Top-left, small
    { "position": { "x": 0, "y": 0, "z": 0 }, "size": 1.0 },    // Center, medium
    { "position": { "x": 3, "y": -2, "z": 0 }, "size": 0.8 }    // Bottom-right, medium
  ]
}
```

## Troubleshooting

### Models not appearing
✅ Check browser console for GLTF load errors
✅ Verify URL is accessible (try opening in browser)
✅ Ensure CORS headers are set on model host
✅ Try a different GLB file to rule out corruption

### Socket.io not connecting
✅ Ensure dev server is running on port 3000
✅ Check browser console for connection errors
✅ Try clearing browser cache and refreshing

### MongoDB connection failed
✅ Verify MongoDB is running: `mongod --version`
✅ Check `.env.local` has correct MONGODB_URI
✅ Test connection with MongoDB Compass

### Widget not loading
✅ Check domain matches store's `domain` field
✅ Look for errors in browser console
✅ Verify API endpoint returns config: `/api/widget/config?domain=example.com`

### Drag-and-drop not working
✅ Ensure you're clicking directly on the model
✅ Try dragging slowly (rapid movements may break raycasting)
✅ Check if model is behind the image plane (adjust Z coordinate)

## Production Deployment

See `DESIGN_DOCUMENT.md` for complete deployment guide including:
- Vercel/Netlify hosting
- MongoDB Atlas setup
- Environment variable configuration
- CDN setup for assets
- Socket.io scaling strategies

## Need Help?

1. Check `DESIGN_DOCUMENT.md` for architecture details
2. Review `README.md` for API documentation
3. Open GitHub issue with error details
4. Include browser console logs and network tab

---

**Happy building! 🚀**
