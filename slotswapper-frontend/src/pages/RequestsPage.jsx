import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// 1. Import MUI components
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const RequestsPage = () => {
  const { user, socket } = useContext(AuthContext);
  const [allRequests, setAllRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [realtimeMessage, setRealtimeMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 1. Fetch all requests ---
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await axios.get('http://localhost:5000/api/swap/my-requests');
      setAllRequests(res.data);
    } catch (err) {
      setError('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Socket.io listeners ---
  useEffect(() => {
    if (socket) {
      socket.on("newSwapRequest", (data) => {
        setRealtimeMessage(data.message);
        // Add request to list in real-time
        setAllRequests((prev) => [
          // The data from the socket needs to be populated, fetch for simplicity
          fetchRequests()
        ]);
      });

      socket.on("swapResponse", (data) => {
        setRealtimeMessage(data.message);
        // Refresh the list to show the status change
        fetchRequests();
      });

      return () => {
        socket.off("newSwapRequest");
        socket.off("swapResponse");
      };
    }
  }, [socket]);

  // --- 3. Handle Accept/Reject ---
  const handleResponse = async (requestId, accept) => {
    try {
      await axios.post(
        `http://localhost:5000/api/swap/swap-response/${requestId}`,
        { accept }
      );
      setSuccess(`Request ${accept ? 'accepted' : 'rejected'}.`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to respond to request');
    }
  };

  // --- 4. Filter lists for rendering ---
  const incoming = allRequests.filter(
    (req) => req.receiver._id === user.id && req.status === 'PENDING'
  );
  const outgoing = allRequests.filter(
    (req) => req.requester._id === user.id
  );

  const getStatusChip = (status) => {
    let color = 'default';
    if (status === 'ACCEPTED') color = 'success';
    if (status === 'REJECTED') color = 'error';
    if (status === 'PENDING') color = 'warning';
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Swap Requests
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {realtimeMessage && <Alert severity="info" sx={{ mb: 2 }}>{realtimeMessage}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          
          {/* --- LEFT COLUMN: INCOMING REQUESTS --- */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Incoming Requests
            </Typography>
            {incoming.length === 0 ? (
              <Typography>No pending incoming requests.</Typography>
            ) : (
              <Grid container spacing={2}>
                {incoming.map((req) => (
                  <Grid item xs={12} key={req._id}>
                    <Card>
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="div">
                          From: {req.requester.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>They want:</strong> {req.receiverSlot.title}
                          <br />
                          ({new Date(req.receiverSlot.startTime).toLocaleString()})
                        </Typography>
                        <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                          <strong>They offer:</strong> {req.requesterSlot.title}
                          <br />
                          ({new Date(req.requesterSlot.startTime).toLocaleString()})
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleResponse(req._id, true)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<CancelIcon />}
                          onClick={() => handleResponse(req._id, false)}
                        >
                          Reject
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>

          {/* --- RIGHT COLUMN: OUTGOING REQUESTS (HISTORY) --- */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Outgoing Request History
            </Typography>
            {outgoing.length === 0 ? (
              <Typography>No outgoing requests.</Typography>
            ) : (
              <List sx={{ bgcolor: 'background.paper' }}>
                {outgoing.map((req, index) => (
                  <React.Fragment key={req._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={`To: ${req.receiver.name}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              You offered: {req.requesterSlot.title}
                            </Typography>
                            <br />
                            <Typography component="span" variant="body2" color="text.secondary">
                              You wanted: {req.receiverSlot.title}
                            </Typography>
                          </>
                        }
                      />
                      {getStatusChip(req.status)}
                    </ListItem>
                    {index < outgoing.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default RequestsPage;