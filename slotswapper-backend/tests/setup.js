const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;


beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    replSet: { 
      count: 1, 
      name: 'jest-rs' 
    },
  });

  const uri = mongoServer.getUri();
  

  await mongoose.connect(uri, { dbName: 'jest' });
});


afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});


beforeEach(async () => {
  
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});