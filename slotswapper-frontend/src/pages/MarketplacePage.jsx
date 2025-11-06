import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 1. Import all the MUI components we'll need
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  Modal, // For the pop-up
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

// --- Style for the Modal Pop-up ---
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const MarketplacePage = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [mySwappableSlots, setMySwappableSlots] = useState([]);
  const [selectedSlotToSwap, setSelectedSlotToSwap] = useState(null); // The slot the user *wants*
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch All Data on Load ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      // Get all slots from other users
      const resMarketplace = await axios.get('http://localhost:5000/api/swap/swappable-slots');
      setAvailableSlots(resMarketplace.data);

      // Get your own events to find the ones you can offer
      const resMyEvents = await axios.get('http://localhost:5000/api/events/my-events');
      setMySwappableSlots(
        resMyEvents.data.filter((event) => event.status === 'SWAPPABLE')
      );
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Modal Controls ---
  const handleOpenModal = (slot) => {
    setSelectedSlotToSwap(slot);
  };
  
  const handleCloseModal = () => {
    setSelectedSlotToSwap(null);
  };

  // --- 3. Handle Confirming the Swap ---
  const handleConfirmSwap = async (mySlotId) => {
    if (!selectedSlotToSwap) return;

    try {
      await axios.post('http://localhost:5000/api/swap/swap-request', {
        mySlotId: mySlotId,
        theirSlotId: selectedSlotToSwap._id,
      });

      setSuccess('Swap request sent successfully! Both slots are now pending.');
      handleCloseModal();
      fetchData(); // Refresh all data
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send swap request');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Marketplace
      </Typography>
      <Typography variant="body1" gutterBottom>
        Here are all the slots available for swapping from other users.
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {availableSlots.length === 0 ? (
            <Grid item xs={12}>
              <Typography sx={{ mt: 2 }}>No swappable slots available right now.</Typography>
            </Grid>
          ) : (
            availableSlots.map((slot) => (
              <Grid item xs={12} sm={6} md={4} key={slot._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{slot.title}</Typography>
                    <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                      Owner: {slot.owner.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>From:</strong> {new Date(slot.startTime).toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>To:</strong> {new Date(slot.endTime).toLocaleString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<SwapHorizIcon />}
                      onClick={() => handleOpenModal(slot)}
                    >
                      Request Swap
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* --- 4. The Confirmation Modal --- */}
      <Modal
        open={Boolean(selectedSlotToSwap)}
        onClose={handleCloseModal}
        aria-labelledby="swap-modal-title"
      >
        <Box sx={modalStyle}>
          <Typography id="swap-modal-title" variant="h6" component="h2">
            Select Your Slot to Offer
          </Typography>
          <Typography sx={{ mt: 2 }}>
            You want to swap for: <strong>{selectedSlotToSwap?.title}</strong>
          </Typography>
          
          <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
            {mySwappableSlots.length > 0 ? (
              <List>
                {mySwappableSlots.map((mySlot) => (
                  <ListItemButton
                    key={mySlot._id}
                    onClick={() => handleConfirmSwap(mySlot._id)}
                  >
                    <ListItemText
                      primary={mySlot.title}
                      secondary={new Date(mySlot.startTime).toLocaleString()}
                    />
                  </ListItemButton>
                ))}
              </List>
            ) : (
              <Typography color="error">You have no swappable slots to offer.</Typography>
            )}
          </Box>
          
          <Button onClick={handleCloseModal} sx={{ mt: 3 }}>
            Cancel
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default MarketplacePage;