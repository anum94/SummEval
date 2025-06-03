import axios, { endpoints } from 'src/utils/axios';

import { setSession } from './utils';
import { STORAGE_KEY, STORAGE_KEY_REFRESH } from './constant';


//Sign in with email and password to return access token with user info, 
export const signInWithPassword = async ({ email, password }) => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.login, params); //endpoints.auth.signIn = '/auth/sign-in' in axios.js file

    const accessToken = res.data.access; // get access token from response
    const refreshToken = res.data.refresh; // get refresh token from response


    if (!accessToken) {
      throw new Error('Access token not found in response');
    }
    if (!refreshToken) {
      throw new Error('Refresh token not found in response');
    }

    sessionStorage.setItem(STORAGE_KEY, accessToken); // store token in session storage
    sessionStorage.setItem(STORAGE_KEY_REFRESH, refreshToken); // store refresh token in session storage
    
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

// Sign up with email, password, first name, and last name to return access token
export const signUp = async ({ email, firstName, lastName, password,password2 }) => {
  const params = {
    email: email,
    first_name: firstName,
    last_name: lastName,
    password: password,
    password2: password2,
  };

  try {
    const res = await axios.post(endpoints.auth.register, params); // endpoints.auth.signUp = '/auth/sign-up' in axios.js file

    if (res.status !== 201) {
      throw new Error('Failed to sign up');
    }

    await signInWithPassword({ email, password }); // sign in with email and password to get access token

  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

// Sign out to remove token from storage and axios header with setSession function from utils.js
export const signOut = async () => {
  try {
    localStorage.clear();
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
