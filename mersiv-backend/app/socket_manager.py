import socketio
from typing import Dict, Set
from app.config import settings

# Create Socket.IO server with CORS enabled
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25
)

# Track active users per store
store_users: Dict[str, Set[str]] = {}

@sio.event
async def connect(sid, environ):
    print(f"=== CLIENT CONNECTED: {sid} ===")
    print(f"Client connected: {sid}")

@sio.on('*')
async def catch_all(event, sid, data):
    print(f"=== CATCH ALL: event={event}, sid={sid}, data={data} ===")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    
    # Remove user from all stores
    for store_id in list(store_users.keys()):
        if sid in store_users[store_id]:
            store_users[store_id].remove(sid)
            if len(store_users[store_id]) == 0:
                del store_users[store_id]
            else:
                await sio.emit('user_count', {'count': len(store_users[store_id])}, room=store_id)

@sio.event
async def join_store(sid, data):
    """Handle user joining a store - Socket.IO converts 'join-store' to 'join_store'"""
    try:
        # Handle both direct string and dict with store_id
        store_id = data if isinstance(data, str) else data.get('store_id') if isinstance(data, dict) else None
        print(store_id);
        if not store_id:
            print(f"ERROR: join_store called with invalid data: {data}")
            return
        
        print(f"=== JOIN_STORE CALLED: sid={sid}, store_id={store_id} ===")
        
        if store_id not in store_users:
            store_users[store_id] = set()
            print(f"Created new store_users entry for {store_id}")
        
        # Check if store is full (configurable max users)
        max_users = settings.max_users_per_store
        if len(store_users[store_id]) >= max_users and sid not in store_users[store_id]:
            print(f"Store {store_id} is full (max {max_users} users)")
            await sio.emit('store_full', {
                'message': f'Store is full. Maximum {max_users} users allowed.'
            }, room=sid)
            return
        
        # Add user to store
        store_users[store_id].add(sid)
        print(f"Added user {sid} to store {store_id}")
        
        await sio.enter_room(sid, store_id)
        print(f"User {sid} entered room {store_id}")
        
        # Save store_id in session
        async with sio.session(sid) as session:
            session['store_id'] = store_id
        print(f"Saved store_id to session")
        
        user_count = len(store_users[store_id])
        print(f"=== User {sid} joined store {store_id}. Total users: {user_count} ===")
        
        # Broadcast user count to all users in the store
        print(f"=== Emitting user_count: {user_count} to room: {store_id} ===")
        await sio.emit('user_count', {'count': user_count}, room=store_id)
        
        # Send max users configuration to the client
        await sio.emit('max_users', {'max': settings.max_users_per_store}, room=sid)
        print(f"=== Emit completed ===")
        
    except Exception as e:
        print(f"ERROR in join_store: {e}")
        import traceback
        traceback.print_exc()


@sio.event
async def leave_store(sid, data):
    """Handle user leaving a store - Socket.IO converts 'leave-store' to 'leave_store'"""
    # Handle both direct string and dict with store_id
    store_id = data if isinstance(data, str) else data.get('store_id') if isinstance(data, dict) else None
    
    if not store_id:
        return
        
    if store_id in store_users and sid in store_users[store_id]:
        store_users[store_id].remove(sid)
        await sio.leave_room(sid, store_id)
        
        if len(store_users[store_id]) == 0:
            del store_users[store_id]
        else:
            await sio.emit('user_count', {'count': len(store_users[store_id])}, room=store_id)
        
        print(f"User {sid} left store {store_id}. Remaining users: {len(store_users.get(store_id, []))}")

@sio.on('model-position-update')
async def handle_model_position_update(sid, data: dict):
    """Handle model position updates and broadcast to other users"""
    store_id = data.get('storeId')
    model_id = data.get('modelId')
    position = data.get('position')
    
    print(f"=== RECEIVED model-position-update from {sid} ===")
    print(f"Store: {store_id}, Model: {model_id}, Position: {position}")
    
    if not all([store_id, model_id, position]):
        print("⚠️ Missing required data, skipping broadcast")
        return
    
    # Broadcast to all other users in the same store (except sender)
    await sio.emit('model-position-changed', {
        'modelId': model_id,
        'position': position
    }, room=store_id, skip_sid=sid)
    
    print(f"✅ Broadcasted model-position-changed to room {store_id} (excluding {sid})")
