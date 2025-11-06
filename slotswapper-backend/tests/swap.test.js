const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('../config/db'); 
const User = require('../models/User');
const Event = require('../models/Event');
const SwapRequest = require('../models/SwapRequest');


const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth'));
app.use('/api/events', require('../routes/events'));
app.use('/api/swap', require('../routes/swap'));


describe('Swap Logic API', () => {
  let tokenUserA, tokenUserB;
  let userAId, userBId;
  let eventAId, eventBId;
  let swapRequestId;

  
  beforeEach(async () => {
  
    const userA = new User({ name: 'User A', email: 'a@test.com', password: 'password123' });
    await userA.save();
    userAId = userA._id;
    tokenUserA = userA.generateAuthToken();

   
    const userB = new User({ name: 'User B', email: 'b@test.com', password: 'password123' });
    await userB.save();
    userBId = userB._id;
    tokenUserB = userB.generateAuthToken(); 
   
    const eventA = new Event({
      title: 'Event A',
      startTime: new Date(),
      endTime: new Date(),
      owner: userAId,
      status: 'SWAPPABLE',
    });
    await eventA.save();
    eventAId = eventA._id;

   
    const eventB = new Event({
      title: 'Event B',
      startTime: new Date(),
      endTime: new Date(),
      owner: userBId,
      status: 'SWAPPABLE',
    });
    await eventB.save();
    eventBId = eventB._id;

    
    const swapRequest = new SwapRequest({
      requester: userAId,
      requesterSlot: eventAId,
      receiver: userBId,
      receiverSlot: eventBId,
      status: 'PENDING',
    });
    await swapRequest.save();
    swapRequestId = swapRequest._id;

    
    await Event.findByIdAndUpdate(eventAId, { status: 'SWAP_PENDING' });
    await Event.findByIdAndUpdate(eventBId, { status: 'SWAP_PENDING' });
  });

  it('should REJECT a swap request, setting events back to SWAPPABLE', async () => {
   
    const res = await request(app)
      .post(`/api/swap/swap-response/${swapRequestId}`)
      .set('x-auth-token', tokenUserB)
      .send({ accept: false });


    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('REJECTED');


    const updatedEventA = await Event.findById(eventAId);
    const updatedEventB = await Event.findById(eventBId);
    expect(updatedEventA.status).toEqual('SWAPPABLE');
    expect(updatedEventB.status).toEqual('SWAPPABLE');
  });

  it('should ACCEPT a swap request, swapping owners and setting status to BUSY', async () => {
    
    const res = await request(app)
      .post(`/api/swap/swap-response/${swapRequestId}`)
      .set('x-auth-token', tokenUserB)
      .send({ accept: true });
    
   
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ACCEPTED');

 
    const updatedEventA = await Event.findById(eventAId);
    const updatedEventB = await Event.findById(eventBId);

  
    expect(updatedEventA.owner.toString()).toEqual(userBId.toString());
    expect(updatedEventB.owner.toString()).toEqual(userAId.toString());
    
  
    expect(updatedEventA.status).toEqual('BUSY');
    expect(updatedEventB.status).toEqual('BUSY');
  });
});