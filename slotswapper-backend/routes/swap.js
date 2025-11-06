const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose'); 


const Event = require('../models/Event');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User'); 

//  GET /api/swap/swappable-slots
router.get('/swappable-slots', auth, async (req, res) => {
  try {
    
    const slots = await Event.find({
      status: 'SWAPPABLE',
      owner: { $ne: req.user.id } 
    }).populate('owner', 'name email'); 

    res.json(slots);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//   GET /api/swap/my-requests
router.get('/my-requests', auth, async (req, res) => {
  try {
   
    const requests = await SwapRequest.find({
      $or: [{ requester: req.user.id }, { receiver: req.user.id }],
    })
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .populate('requesterSlot', 'title startTime')
      .populate('receiverSlot', 'title startTime')
      .sort({ createdAt: 'desc' }); 

    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

 // POST /api/swap/swap-request
router.post('/swap-request', auth, async (req, res) => {
  const { mySlotId, theirSlotId } = req.body;

  
  const session = process.env.NODE_ENV === 'test' 
    ? null 
    : await mongoose.startSession();

  if (session) {
    session.startTransaction();
  }

  try {
    // 1. Get both event documents
    const mySlot = await Event.findById(mySlotId).session(session);
    const theirSlot = await Event.findById(theirSlotId).session(session);

    // 2. --- Validation ---
    if (!mySlot || !theirSlot) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ msg: 'One or both slots not found' });
    }
    if (mySlot.owner.toString() !== req.user.id) {
      if (session) await session.abortTransaction();
      return res.status(401).json({ msg: 'You do not own the slot you are offering' });
    }
    if (theirSlot.owner.toString() === req.user.id) {
      if (session) await session.abortTransaction();
      return res.status(400).json({ msg: 'Cannot swap with yourself' });
    }
    if (mySlot.status !== 'SWAPPABLE' || theirSlot.status !== 'SWAPPABLE') {
      if (session) await session.abortTransaction();
      return res.status(400).json({ msg: 'Both slots must be marked as SWAPPABLE' });
    }

    // 3. Create the new SwapRequest
    const newSwapRequest = new SwapRequest({
      requester: req.user.id,
      requesterSlot: mySlotId,
      receiver: theirSlot.owner,
      receiverSlot: theirSlotId,
      status: 'PENDING',
    });
    await newSwapRequest.save(session ? { session } : {});

    // 4. Update BOTH slots' status to 'SWAP_PENDING'
    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';
    await mySlot.save(session ? { session } : {});
    await theirSlot.save(session ? { session } : {});


    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

 
    const requesterUser = await User.findById(req.user.id).select('name');
    const receiverSocketId = req.getUserSocket(theirSlot.owner.toString());
    if (receiverSocketId) {
      req.io.to(receiverSocketId).emit("newSwapRequest", {
        message: `You have a new swap request from ${requesterUser.name || 'a user'}!`,
        request: newSwapRequest 
      });
    }
    

    res.json(newSwapRequest);

  } catch (err) {
    console.error(err.message);
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(500).send('Server Error');
  }
});

// POST /api/swap/swap-response/:requestId
router.post('/swap-response/:requestId', auth, async (req, res) => {
  const { accept } = req.body; 
  const { requestId } = req.params;


  const session = process.env.NODE_ENV === 'test' 
    ? null 
    : await mongoose.startSession();
  
  if (session) {
    session.startTransaction();
  }

  try {
    // 1. Find the SwapRequest
    const swapRequest = await SwapRequest.findById(requestId).session(session);
    if (!swapRequest) {
      if (session) await session.abortTransaction();
      return res.status(404).json({ msg: 'Swap request not found' });
    }

    // 2. Security Check
    if (swapRequest.receiver.toString() !== req.user.id) {
      if (session) await session.abortTransaction();
      return res.status(401).json({ msg: 'Not authorized to respond to this request' });
    }

    // 3. Check if already actioned
    if (swapRequest.status !== 'PENDING') {
      if (session) await session.abortTransaction();
      return res.status(400).json({ msg: `This request has already been ${swapRequest.status.toLowerCase()}` });
    }

    // 4. Find the two events involved
    const requesterSlot = await Event.findById(swapRequest.requesterSlot).session(session);
    const receiverSlot = await Event.findById(swapRequest.receiverSlot).session(session);
    if (!requesterSlot || !receiverSlot) {
        if (session) await session.abortTransaction();
        return res.status(404).json({ msg: 'One or both events involved in the swap no longer exist' });
    }

    if (accept === true) {
      
      swapRequest.status = 'ACCEPTED';
      const originalRequesterOwner = requesterSlot.owner;
      requesterSlot.owner = receiverSlot.owner;
      receiverSlot.owner = originalRequesterOwner;
      requesterSlot.status = 'BUSY';
      receiverSlot.status = 'BUSY';

      await swapRequest.save(session ? { session } : {});
      await requesterSlot.save(session ? { session } : {});
      await receiverSlot.save(session ? { session } : {});
      
    } else {
      
      swapRequest.status = 'REJECTED';
      requesterSlot.status = 'SWAPPABLE';
      receiverSlot.status = 'SWAPPABLE';

      await swapRequest.save(session ? { session } : {});
      await requesterSlot.save(session ? { session } : {});
      await receiverSlot.save(session ? { session } : {});
    }

    // 7. Commit the entire transaction (if it exists)
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }


    const originalRequesterId = swapRequest.requester.toString();
    const requesterSocketId = req.getUserSocket(originalRequesterId);
    
    if (requesterSocketId) {
      req.io.to(requesterSocketId).emit("swapResponse", {
        message: `Your swap request was ${swapRequest.status.toLowerCase()}.`,
        request: swapRequest
      });
    }


    res.json(swapRequest); 

  } catch (err) {
    console.error(err.message);
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;