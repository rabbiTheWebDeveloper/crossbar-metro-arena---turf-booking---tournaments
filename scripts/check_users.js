const mongoose = require('mongoose');

async function main() {
  const uri = 'mongodb+srv://bd:WWwRIYr61UPNP42K@cluster0.c6bc0x0.mongodb.net/crossbar';
  await mongoose.connect(uri);
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log('Total users in DB:', users.length);
  for (const u of users) {
    console.log(`User: ${u.name} | Phone: ${u.phone} | Role: ${u.role}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
