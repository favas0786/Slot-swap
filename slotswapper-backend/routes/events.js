const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 

const Event = require('../models/Event');
const User = require('../models/User');

// @route   POST /api/events
router.post('/', auth, async (req, res) => {
  const { title, startTime, endTime } = req.body;

  try {
    
    const newEvent = new Event({
      title,
      startTime,
      endTime,
      owner: req.user.id,
      status: 'BUSY',
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events/my-events
router.get('/my-events', auth, async (req, res) => {
  try {
    
    const events = await Event.find({ owner: req.user.id }).sort({ startTime: 'asc' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/events/:id
router.put('/:id', auth, async (req, res) => {
  const { title, startTime, endTime, status } = req.body;

  
  const eventFields = {};
  if (title) eventFields.title = title;
  if (startTime) eventFields.startTime = startTime;
  if (endTime) eventFields.endTime = endTime;
  if (status) {
    
    if (['BUSY', 'SWAPPABLE'].includes(status)) {
        eventFields.status = status;
    } else {
        return res.status(400).json({ msg: 'Invalid status. Can only set to BUSY or SWAPPABLE.' });
    }
  }

  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    
    if (event.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to edit this event' });
    }
    
    
    if (event.status === 'SWAP_PENDING') {
        return res.status(400).json({ msg: 'Cannot update event while a swap is pending' });
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: eventFields },
      { new: true } 
    );

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/events/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

       
        if (event.owner.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to delete this event' });
        }

        
        if (event.status === 'SWAP_PENDING') {
            return res.status(400).json({ msg: 'Cannot delete event while a swap is pending' });
        }

        await Event.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Event removed' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;