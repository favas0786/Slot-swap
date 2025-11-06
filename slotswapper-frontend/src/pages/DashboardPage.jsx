import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// 1. Import all the MUI components we'll need
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state

  const { title, startTime, endTime } = formData;

  // --- 1. Fetch User's Events ---
  const getMyEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/events/my-events');
      setEvents(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMyEvents();
  }, []);

  // --- 2. Handle Form Changes ---
  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- 3. Handle Create Event ---
  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/events', {
        title,
        startTime,
        endTime,
      });
      setEvents([res.data, ...events]); // Add new event to the list
      setFormData({ title: '', startTime: '', endTime: '' }); // Clear form
      setError('');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create event');
    }
  };

  // --- 4. Handle "Make Swappable" Button ---
  const makeSwappable = async (eventId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/events/${eventId}`, {
        status: 'SWAPPABLE',
      });
      setEvents(
        events.map((event) => (event._id === eventId ? res.data : event))
      );
    } catch (err) {
      setError('Could not update event status');
    }
  };

  // --- 5. Render the new UI ---
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={4}>
        
        {/* --- LEFT COLUMN: CREATE EVENT FORM --- */}
        <Grid item xs={12} md={4}>
          <Typography variant="h5" gutterBottom>
            Create New Event
          </Typography>
          <Box component="form" onSubmit={onSubmit} noValidate>
            <TextField
              label="Event Title"
              name="title"
              value={title}
              onChange={onChange}
              margin="normal"
              required
              fullWidth
              id="title"
            />
            <TextField
              label="Start Time"
              name="startTime"
              type="datetime-local"
              value={startTime}
              onChange={onChange}
              margin="normal"
              required
              fullWidth
              id="startTime"
              InputLabelProps={{ shrink: true }} // Keeps label from overlapping
            />
            <TextField
              label="End Time"
              name="endTime"
              type="datetime-local"
              value={endTime}
              onChange={onChange}
              margin="normal"
              required
              fullWidth
              id="endTime"
              InputLabelProps={{ shrink: true }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={<AddCircleOutlineIcon />}
              sx={{ mt: 2 }}
            >
              Create Event
            </Button>
          </Box>
        </Grid>

        {/* --- RIGHT COLUMN: EVENT LIST --- */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" gutterBottom>
            My Events
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress /> {/* Show a loading spinner */}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {events.length === 0 ? (
                <Grid item xs={12}>
                  <Typography>You have no events.</Typography>
                </Grid>
              ) : (
                events.map((event) => (
                  <Grid item xs={12} sm={6} key={event._id}>
                    {/* Use a <Card> for each event */}
                    <Card sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      height: '100%',
                      opacity: event.status === 'SWAP_PENDING' ? 0.6 : 1 
                    }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          component="div"
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <EventIcon fontSize="small" /> {event.title}
                        </Typography>
                        <Typography sx={{ mt: 1 }} color="text.secondary">
                          <strong>From:</strong> {new Date(event.startTime).toLocaleString()}
                        </Typography>
                        <Typography color="text.secondary">
                          <strong>To:</strong> {new Date(event.endTime).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
                          Status: {event.status}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        {event.status === 'BUSY' && (
                          <Button 
                            size="small" 
                            onClick={() => makeSwappable(event._id)}
                            startIcon={<SwapHorizIcon />}
                          >
                            Make Swappable
                          </Button>
                        )}
                        {event.status === 'SWAP_PENDING' && (
                          <Button size="small" disabled>Pending...</Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;