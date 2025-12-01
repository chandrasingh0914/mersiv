const { MongoClient } = require('mongodb');

const MODEL_SETS = {
  'Electronics Showroom': [
    { url: '/models/BoomBox.glb', position: { x: -2, y: 0, z: 0 }, size: 1, id: 'boombox-1' },
    { url: '/models/DamagedHelmet.glb', position: { x: 0, y: 0, z: 0 }, size: 1, id: 'helmet-1' },
    { url: '/models/AntiqueCamera.glb', position: { x: 2, y: 0, z: 0 }, size: 1, id: 'camera-1' }
  ],
  'Furniture Store': [
    { url: '/models/SheenChair.glb', position: { x: -2, y: 0, z: 0 }, size: 1.5, id: 'chair-1' },
    { url: '/models/Lantern.glb', position: { x: 0, y: 0, z: 0 }, size: 1, id: 'lantern-1' },
    { url: '/models/Box.glb', position: { x: 2, y: 0, z: 0 }, size: 1, id: 'box-1' }
  ],
  'Fashion Boutique': [
    { url: '/models/WaterBottle.glb', position: { x: -2, y: 0, z: 0 }, size: 1, id: 'bottle-1' },
    { url: '/models/Avocado.glb', position: { x: 0, y: 0, z: 0 }, size: 1, id: 'avocado-1' },
    { url: '/models/SheenChair.glb', position: { x: 2, y: 0, z: 0 }, size: 1.2, id: 'chair-2' }
  ]
};

async function updateModels() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mersiv');
    const stores = await db.collection('stores').find({}).toArray();
    
    console.log(`\n📦 Found ${stores.length} stores\n`);
    
    for (const store of stores) {
      const models = MODEL_SETS[store.name];
      
      if (models) {
        await db.collection('stores').updateOne(
          { _id: store._id },
          { $set: { models: models } }
        );
        console.log(`✅ Updated models for "${store.name}":`);
        models.forEach(m => console.log(`   - ${m.url} at (${m.position.x}, ${m.position.y}, ${m.position.z})`));
      } else {
        console.log(`⚠️  No model set defined for "${store.name}" - skipping`);
      }
    }
    
    console.log('\n✅ All models updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

updateModels();
