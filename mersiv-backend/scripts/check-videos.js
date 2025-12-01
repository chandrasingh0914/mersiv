const { MongoClient } = require('mongodb');

async function checkVideos() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('mersiv');
    const stores = await db.collection('stores').find({}).toArray();
    
    console.log('\n📹 Video URLs in database:\n');
    stores.forEach(store => {
      console.log(`Store: ${store.name}`);
      console.log(`Video URL: ${store.videoUrl || 'NOT SET'}`);
      console.log(`Link: ${store.clickableLink || 'NOT SET'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkVideos();
