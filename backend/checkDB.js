const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Gainix_admin:Gainix%40786@gainixcluster.gjf7ffc.mongodb.net/";

async function checkDB() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        // Saari databases ki list
        const adminDb = client.db('admin');
        const dbs = await adminDb.admin().listDatabases();
        
        console.log('\n📊 Available Databases:');
        dbs.databases.forEach(db => {
            console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
        
        // gainixai database check
        const dbList = dbs.databases.map(db => db.name);
        
        if (dbList.includes('gainixai')) {
            console.log('\n✅ Database "gainixai" exists!');
            
            // Collections check
            const db = client.db('gainixai');
            const collections = await db.listCollections().toArray();
            console.log('\n📚 Collections in gainixai:');
            collections.forEach(col => {
                console.log(`   - ${col.name}`);
            });
            
        } else {
            console.log('\n❌ Database "gainixai" NOT found!');
            console.log('👉 Tumhara database kuch aur naam hai:');
            console.log('   ' + dbList.join(', '));
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkDB();