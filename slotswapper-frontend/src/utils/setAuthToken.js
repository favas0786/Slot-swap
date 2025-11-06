import axios from 'axios';

const setAuthToken = (token) => {
  if (token) {
    // Apply to every request
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    // Delete the auth header
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

export default setAuthToken;