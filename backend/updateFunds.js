const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Gainix_admin:Gainix%40786@gainixcluster.gjf7ffc.mongodb.net/gainixai";

async function updateFundWallet() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db('gainixai');
        const users = db.collection('users');
        
        // Pehle saare users dekhte hain
        const allUsers = await users.find({}).toArray();
        console.log(`\n📊 Total users: ${allUsers.length}`);
        
        if (allUsers.length === 0) {
            console.log('❌ No users found in database!');
            return;
        }
        
        console.log('\n📝 All users in database:');
        allUsers.forEach((user, index) => {
            console.log(`\n${index + 1}. Email: ${user.email}`);
            console.log(`   UserId: ${user.userId}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   FundWallet: ${user.fundWallet}`);
        });
        
        // Specific user update karte hain
        const userEmail = "test@example.com"; // ye email tumhara hai
        
        const user = await users.findOne({ email: userEmail });
        
        if (!user) {
            console.log(`\n❌ User with email "${userEmail}" not found!`);
            console.log('👉 Available emails:', allUsers.map(u => u.email).join(', '));
            return;
        }
        
        console.log(`\n✅ User found: ${user.email}`);
        console.log(`Current fundWallet: ${user.fundWallet}`);
        
        // Update fundWallet
        const result = await users.updateOne(
            { email: userEmail },
            { $set: { fundWallet: 1000 } }
        );
        
        if (result.modifiedCount > 0) {
            console.log('✅ Fund wallet updated to $1000');
            
            // Check updated user
            const updatedUser = await users.findOne({ email: userEmail });
            console.log('\n📝 Updated user:');
            console.log(`   Email: ${updatedUser.email}`);
            console.log(`   UserId: ${updatedUser.userId}`);
            console.log(`   FundWallet: ${updatedUser.fundWallet}`);
        } else {
            console.log('❌ Update failed - maybe already $1000?');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

updateFundWallet();