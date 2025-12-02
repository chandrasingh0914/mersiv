# Testing Checklist

## Pre-Testing Setup

- [ ] MongoDB is running (`mongod` or MongoDB Atlas)
- [ ] `.env.local` file is configured
- [ ] Dependencies installed (`npm install`)
- [ ] Sample data seeded (`npm run seed`)
- [ ] Development server running (`npm run dev`)

---

## Task 1: 3D Store Viewer Testing

### Store Selection
- [ ] Navigate to http://localhost:3000
- [ ] See "Select Store" dropdown
- [ ] Dropdown contains 3 stores (Tech Store, Fashion Boutique, Furniture Gallery)
- [ ] Select "Tech Store Downtown"
- [ ] Store loads successfully

### 3D Visualization
- [ ] Store image displays as background
- [ ] 3D models appear on the image
- [ ] Models are positioned correctly on the image
- [ ] Can see at least 3 models (MacBook, iPhone, AirPods)

### Entrance Animations
- [ ] First model animates from corner
- [ ] Model starts small and grows to full size
- [ ] Second model appears after ~500ms delay
- [ ] Third model appears after another ~500ms delay
- [ ] All models reach their final positions smoothly
- [ ] Animation feels natural (not jerky)

### Drag & Drop
- [ ] Click and hold on a model
- [ ] Cursor changes to "grabbing"
- [ ] Drag model left/right (X axis)
- [ ] Drag model up/down (Y axis)
- [ ] Model follows cursor smoothly
- [ ] Release mouse button
- [ ] Model stays in new position
- [ ] Check MongoDB → Position is updated in database

### Store Reselection
- [ ] Select "Fashion Boutique" from dropdown
- [ ] Previous store unloads
- [ ] New store loads with its own image
- [ ] New store shows different models (shoes, bag)
- [ ] Can switch back to "Tech Store Downtown"
- [ ] Previously dragged models remember their positions

### Real-time Collaboration (2 Users)
- [ ] Open second browser window (or incognito mode)
- [ ] Navigate to http://localhost:3000 in second window
- [ ] Select same store in both windows ("Tech Store Downtown")
- [ ] See "Active Users: 2 / 2" indicator
- [ ] In Window 1: Drag a model
- [ ] In Window 2: Model updates position after release
- [ ] In Window 2: Drag a different model
- [ ] In Window 1: See the update
- [ ] Positions sync in both directions ✅

### Concurrent Edit Conflict
- [ ] Keep both windows open on same store
- [ ] Simultaneously drag the SAME model in both windows
- [ ] Release in Window 1 first
- [ ] Release in Window 2 second
- [ ] Window 2's position wins (last write wins) ✅

### Max Users Enforcement (3rd User)
- [ ] Keep 2 windows open on same store
- [ ] Open third browser window
- [ ] Navigate to http://localhost:3000
- [ ] Select same store
- [ ] See red alert: "Store is full. Maximum 2 users allowed."
- [ ] Models do NOT appear in third window
- [ ] Close one of the first two windows
- [ ] In third window: Reselect the store
- [ ] Now third window can enter (only 1 other user now)

### Socket.io Connection
- [ ] Open browser DevTools → Console
- [ ] Look for Socket.io connection messages
- [ ] Should see: "Socket.io already running" or connection success
- [ ] Status shows: "Connection: 🟢 Connected"
- [ ] Refresh page → Reconnects automatically

### shadcn UI Components
- [ ] Store selector uses shadcn Select component
- [ ] Store info displayed in shadcn Card component
- [ ] Alert for "store full" uses shadcn Alert component
- [ ] UI is consistent and well-themed
- [ ] Components are accessible (keyboard navigation works)

---

## Task 2: JS Widget Testing

### Widget Test Page
- [ ] Navigate to http://localhost:3000/widget-test.html
- [ ] See video banner in lower-left corner
- [ ] Video plays automatically (muted)
- [ ] Video loops continuously
- [ ] Banner has rounded corners and shadow

### Fixed Positioning
- [ ] Scroll down the test page
- [ ] Video banner stays in lower-left corner (doesn't scroll away)
- [ ] Banner maintains 20px margins from edges
- [ ] Position is truly fixed

### Hover Effect
- [ ] Move mouse over video banner
- [ ] Banner scales up slightly (1.05x)
- [ ] Remove mouse → Scales back to normal
- [ ] Transition is smooth

### Click to Open Iframe
- [ ] Click on video banner
- [ ] Full-screen modal overlay appears
- [ ] Iframe loads inside modal
- [ ] Iframe shows content from `clickableLink`
- [ ] Close button (X) visible in top-right corner

### Modal Closing
- [ ] With modal open, click close button (X) → Modal closes
- [ ] Reopen modal, click outside iframe (on dark overlay) → Modal closes
- [ ] Reopen modal, press ESC key → Modal closes
- [ ] All three methods work correctly

### Domain-based Configuration
- [ ] Open http://localhost:3000/api/widget/config?domain=example.com
- [ ] See JSON response with `videoUrl` and `clickableLink`
- [ ] Try different domain: http://localhost:3000/api/widget/config?domain=invalid.com
- [ ] Should get 404 error (store not found)

### Analytics Events (Console)
- [ ] Open browser DevTools → Console
- [ ] Refresh widget test page
- [ ] See log: `[Mersiv Widget] widget_page_loaded`
- [ ] See log: `[Mersiv Widget] widget_video_loaded` (after video loads)
- [ ] Click video banner
- [ ] See log: `[Mersiv Widget] widget_video_clicked`
- [ ] Each event includes domain, timestamp, and relevant data

### Embed in Custom HTML
- [ ] Create new HTML file with widget script:
```html
<!DOCTYPE html>
<html>
<body>
  <h1>My Test Page</h1>
  <script src="http://localhost:3000/widget.js" data-domain="example.com"></script>
</body>
</html>
```
- [ ] Open in browser
- [ ] Widget appears and functions correctly
- [ ] Change `data-domain` to "fashion.example.com"
- [ ] Widget loads different video (from Fashion Boutique store)

### Multiple Domains
- [ ] Verify each store in MongoDB has unique domain:
  - Tech Store: `example.com`
  - Fashion Boutique: `fashion.example.com`
  - Furniture Gallery: `furniture.example.com`
- [ ] Test widget with each domain
- [ ] Each loads correct video and clickable link

---

## API Testing

### GET /api/stores
```bash
curl http://localhost:3000/api/stores
```
- [ ] Returns JSON array of stores
- [ ] Each store has: `_id`, `name`, `imageUrl`, `domain`
- [ ] 3 stores returned (from seed data)

### GET /api/stores/[id]
```bash
curl http://localhost:3000/api/stores/[STORE_ID]
```
- [ ] Returns full store document
- [ ] Includes `models` array with positions and sizes
- [ ] Invalid ID returns 404 error

### POST /api/stores
```bash
curl -X POST http://localhost:3000/api/stores \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Store","imageUrl":"https://example.com/img.jpg","models":[]}'
```
- [ ] Creates new store
- [ ] Returns created document with `_id`
- [ ] Store appears in dropdown on frontend

### PATCH /api/stores/[id]
```bash
curl -X PATCH http://localhost:3000/api/stores/[STORE_ID] \
  -H "Content-Type: application/json" \
  -d '{"modelId":"model-1","position":{"x":1,"y":2,"z":0}}'
```
- [ ] Updates model position
- [ ] Returns updated store document
- [ ] Position persists in database
- [ ] Change visible in 3D viewer (refresh or real-time)

### GET /api/widget/config
```bash
curl "http://localhost:3000/api/widget/config?domain=example.com"
```
- [ ] Returns widget configuration
- [ ] Has `videoUrl`, `clickableLink`, `storeName`
- [ ] Missing domain parameter → 400 error
- [ ] Invalid domain → 404 error

---

## MongoDB Testing

### Connect with MongoDB Compass
- [ ] Open MongoDB Compass
- [ ] Connect to `mongodb://localhost:27017`
- [ ] See `mersiv` database
- [ ] See `stores` collection
- [ ] 3 documents in collection

### Verify Data Structure
- [ ] Open a store document
- [ ] Has all required fields: `name`, `imageUrl`, `models`, etc.
- [ ] `models` array has at least one model
- [ ] Each model has: `id`, `url`, `position`, `size`
- [ ] Position has: `x`, `y`, `z` coordinates

### Manual Position Update
- [ ] Edit a model's position in Compass
- [ ] Save document
- [ ] Refresh 3D viewer
- [ ] Model appears in new position ✅

---

## Browser Compatibility

Test in multiple browsers:

### Chrome
- [ ] 3D viewer works
- [ ] Widget loads
- [ ] Socket.io connects
- [ ] Drag-and-drop smooth

### Firefox
- [ ] 3D viewer works
- [ ] Widget loads
- [ ] Socket.io connects
- [ ] Drag-and-drop smooth

### Safari (Mac)
- [ ] 3D viewer works
- [ ] Widget loads
- [ ] Socket.io connects
- [ ] Drag-and-drop smooth

### Edge
- [ ] 3D viewer works
- [ ] Widget loads
- [ ] Socket.io connects
- [ ] Drag-and-drop smooth

---

## Performance Testing

### 3D Rendering
- [ ] Models load within 3 seconds
- [ ] Frame rate stays above 30 FPS
- [ ] No visible lag when dragging models
- [ ] Entrance animations are smooth

### Network
- [ ] Check Network tab in DevTools
- [ ] GLB models load successfully (200 OK)
- [ ] No CORS errors
- [ ] Image loads successfully

### Memory
- [ ] Check Performance tab
- [ ] No memory leaks after switching stores multiple times
- [ ] Memory usage stays reasonable (<500MB)

---

## Error Handling

### Missing Store
- [ ] Delete all stores from MongoDB
- [ ] Refresh 3D viewer
- [ ] Shows "No stores available" or similar message

### Invalid GLB URL
- [ ] Edit store in MongoDB
- [ ] Change model URL to invalid URL
- [ ] Check console → See GLTF load error
- [ ] Other models still load correctly

### MongoDB Down
- [ ] Stop MongoDB service
- [ ] Try loading stores
- [ ] See error message (not crash)
- [ ] Start MongoDB → App recovers

### Socket.io Disconnect
- [ ] Open 3D viewer
- [ ] Stop dev server
- [ ] Status shows: "Connection: 🔴 Disconnected"
- [ ] Restart server
- [ ] Reconnects automatically

---

## Production Readiness

### Environment Variables
- [ ] `.env.example` exists with all variables
- [ ] `.env.local` not committed to git
- [ ] `.gitignore` includes `.env*`

### Build
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors

### Start Production Server
```bash
npm start
```
- [ ] Server starts on port 3000
- [ ] App works in production mode
- [ ] Socket.io connects
- [ ] Widget loads

---

## Documentation Review

- [ ] README.md is complete and accurate
- [ ] DESIGN_DOCUMENT.md is 1-2 pages ✅
- [ ] QUICK_START.md has setup instructions
- [ ] PROJECT_SUMMARY.md lists all features
- [ ] API endpoints documented
- [ ] Code comments are helpful

---

## Final Checklist

- [ ] All Task 1 requirements implemented
- [ ] All Task 2 requirements implemented
- [ ] Real-time collaboration works (2 users max)
- [ ] Widget embeddable on external sites
- [ ] Analytics tracking functional
- [ ] shadcn UI theming consistent
- [ ] MongoDB as sole data source
- [ ] React & Next.js used throughout
- [ ] Design document created
- [ ] No console errors in production build

---

## 🎉 Testing Complete!

If all items are checked, the project is ready for:
- ✅ Development
- ✅ Production deployment
- ✅ Client demonstration
- ✅ External widget distribution

**Tested by:** _________________  
**Date:** _________________  
**Status:** ☐ Pass ☐ Fail  
**Notes:** _________________
