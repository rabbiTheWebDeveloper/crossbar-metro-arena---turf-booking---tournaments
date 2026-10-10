const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const INITIAL_USERS = [
  {
    name: 'Abid Hasan (Lead Partner)',
    phone: '01796337133',
    password: 'password123',
    role: 'admin',
    email: 'abid@bookcrossbar.com'
  },
  {
    name: 'Kabir Chowdhury (Manager)',
    phone: '01711223344',
    password: 'password123',
    role: 'admin',
    email: 'kabir@bookcrossbar.com'
  },
  {
    name: 'Siam Chowdhury',
    phone: '01844332211',
    password: 'password123',
    role: 'player',
    playingPosition: 'FWD',
    email: 'siam@gmail.com'
  },
  {
    name: 'Tanvir Ahmed',
    phone: '01711889922',
    password: 'password123',
    role: 'player',
    playingPosition: 'FWD',
    email: 'tanvir@gmail.com'
  },
  {
    name: 'Rafiqul Islam (Investor)',
    phone: '01819556677',
    password: 'password123',
    role: 'investor',
    email: 'rafiqul@metroinvest.bd'
  },
  {
    name: 'Tareq Mansoor (Investor)',
    phone: '01912334455',
    password: 'password123',
    role: 'investor',
    email: 'tareq.mansoor@gmail.com'
  }
];

async function main() {
  const uri = 'mongodb+srv://bd:WWwRIYr61UPNP42K@cluster0.c6bc0x0.mongodb.net/crossbar';
  await mongoose.connect(uri);
  const usersCollection = mongoose.connection.collection('users');

  for (const u of INITIAL_USERS) {
    const existing = await usersCollection.findOne({ phone: u.phone });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      await usersCollection.insertOne({
        name: u.name,
        phone: u.phone,
        password: hashedPassword,
        role: u.role,
        playingPosition: u.playingPosition || 'MID',
        email: u.email,
        disabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Seeded ${u.name} (${u.phone}) [${u.role}]`);
    } else {
      console.log(`ℹ️ Already exists: ${u.name}`);
    }
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
