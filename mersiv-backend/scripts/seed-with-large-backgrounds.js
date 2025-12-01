const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function seedStores() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('mersiv');
    const storesCollection = db.collection('stores');

    // Clear existing stores
    await storesCollection.deleteMany({});
    console.log('🗑️  Cleared existing stores');

    const stores = [
      {
        name: 'Electronics Showroom',
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=3840&auto=format&fit=crop',
        domain: 'localhost',
        videoUrl: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
        clickableLink: 'http://localhost:3000',
        models: [
          {
            id: 'helmet_1',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF-Binary/FlightHelmet.glb',
            position: { x: -4, y: 0.5, z: -2 },
            size: 2.0,
          },
          {
            id: 'damaged_helmet',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
            position: { x: 0, y: 0.5, z: 0 },
            size: 2.5,
          },
          {
            id: 'camera',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AntiqueCamera/glTF-Binary/AntiqueCamera.glb',
            position: { x: 4, y: 0, z: -2 },
            size: 1.8,
          },
        ],
      },
      {
        name: 'Furniture Store',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=3840&auto=format&fit=crop',
        domain: 'localhost',
        videoUrl: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
        clickableLink: 'http://localhost:3000',
        models: [
          {
            id: 'chair',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb',
            position: { x: -3, y: -1, z: 0 },
            size: 3.0,
          },
          {
            id: 'lantern',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Lantern/glTF-Binary/Lantern.glb',
            position: { x: 0, y: 0.5, z: -1 },
            size: 2.5,
          },
          {
            id: 'barramundi',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BarramundiFish/glTF-Binary/BarramundiFish.glb',
            position: { x: 3, y: 1, z: 0 },
            size: 2.0,
          },
        ],
      },
      {
        name: 'Fashion Boutique',
        imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=3840&auto=format&fit=crop',
        domain: 'localhost',
        videoUrl: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
        clickableLink: 'http://localhost:3000',
        models: [
          {
            id: 'bottle',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/WaterBottle/glTF-Binary/WaterBottle.glb',
            position: { x: -3, y: 0, z: -1 },
            size: 3.0,
          },
          {
            id: 'spheres',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb',
            position: { x: 0, y: 0.5, z: 0 },
            size: 1.5,
          },
          {
            id: 'boombox',
            url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
            position: { x: 3, y: 0, z: -1 },
            size: 2.5,
          },
        ],
      },
    ];

    // Insert stores
    const result = await storesCollection.insertMany(stores);
    console.log(`✨ Inserted ${result.insertedCount} stores with large backgrounds and medium 3D models`);
    
    // Display created stores
    console.log('\n📦 Stores created:');
    stores.forEach((store, index) => {
      console.log(`\n${index + 1}. ${store.name}`);
      console.log(`   Background: ${store.imageUrl.substring(0, 80)}...`);
      console.log(`   Video: ${store.videoUrl.substring(0, 80)}...`);
      console.log(`   Models: ${store.models.length} (sizes: ${store.models.map(m => m.size).join(', ')})`);
    });
    
    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await client.close();
  }
}

seedStores();
