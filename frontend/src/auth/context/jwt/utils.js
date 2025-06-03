import axios, { endpoints } from 'src/utils/axios';

import { STORAGE_KEY, STORAGE_KEY_REFRESH } from './constant';

// jwtDecode: decode JWT token and return payload
export function jwtDecode(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}


// isValidToken: check token is valid or expired unitl current time
export function isValidToken(accessToken) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime; // if exp field in token is greater than current time, token is valid
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}


// tokenExpired: set timeout to remove token from storage and redirect to sign in page
export function tokenExpired(exp) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  // set timeout to remove token from storage and redirect to sign in page after token expiration
  setTimeout(() => {
    try {
      refreshToken();
      //window.location.href = paths.auth.jwt.signIn; // redirect to sign in page after token expiration 
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, timeLeft);
}

export async function refreshToken() {
  try {
    const refreshToken = sessionStorage.getItem(STORAGE_KEY_REFRESH);
    sessionStorage.removeItem(STORAGE_KEY); // remove token from session storage
    sessionStorage.removeItem(STORAGE_KEY_REFRESH);
    if (refreshToken){
      const response = await axios.post(endpoints.auth.refreshToken, {refresh: refreshToken});
      const newAccessToken = response.data.access;
      const newRefreshToken = response.data.refresh;
      setSession(newAccessToken, newRefreshToken);
    }
  } catch (error) {
    console.error('Error during token refresh:', error);
    throw error;
  }
}


// setSession: set token to storage and axios header
export async function setSession(accessToken, refreshToken) {
  try {
    if (accessToken && refreshToken) {
      sessionStorage.setItem(STORAGE_KEY, accessToken); // store token in session storage
      sessionStorage.setItem(STORAGE_KEY_REFRESH, refreshToken); // store refresh token in session storage

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`; // set token in axios header

      const decodedToken = jwtDecode(accessToken);

      if (decodedToken && 'exp' in decodedToken) { // check if token is valid or expired by checking exp field in token
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY, STORAGE_KEY_REFRESH); // remove token from session storage
      delete axios.defaults.headers.common.Authorization; // remove token from axios header
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
