const { MongoClient } = require('mongodb');

async function forceUpdate() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('mersiv');
    const stores = db.collection('stores');
    
    // Update Electronics Showroom
    await stores.updateOne(
      { name: 'Electronics Showroom' },
      { 
        $set: { 
          videoUrl: 'https://www.youtube.com/embed/jZzuq_AlX58?autoplay=1&mute=1&loop=1&playlist=jZzuq_AlX58&controls=0&showinfo=0&rel=0&modestbranding=1',
          clickableLink: 'http://localhost:3001'
        }
      }
    );
    console.log('✅ Updated Electronics Showroom');
    
    // Update Furniture Store
    await stores.updateOne(
      { name: 'Furniture Store' },
      { 
        $set: { 
          videoUrl: 'https://www.youtube.com/embed/kAL_Y3Gfdyg?autoplay=1&mute=1&loop=1&playlist=kAL_Y3Gfdyg&controls=0&showinfo=0&rel=0&modestbranding=1',
          clickableLink: 'http://localhost:3001'
        }
      }
    );
    console.log('✅ Updated Furniture Store');
    
    // Update Fashion Boutique
    await stores.updateOne(
      { name: 'Fashion Boutique' },
      { 
        $set: { 
          videoUrl: 'https://www.youtube.com/embed/dwExxLUoGL4?autoplay=1&mute=1&loop=1&playlist=dwExxLUoGL4&controls=0&showinfo=0&rel=0&modestbranding=1',
          clickableLink: 'http://localhost:3001'
        }
      }
    );
    console.log('✅ Updated Fashion Boutique');
    
    console.log('\n✨ All stores updated with new YouTube videos!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

forceUpdate();
