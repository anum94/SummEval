import { useContext } from 'react';

import { AuthContext } from '../context/authContext';


export function useAuthContext() {
  // Returns the current context value for AuthContext which is provided by the nearest <AuthProvider> component in the tree.
  const context = useContext(AuthContext); // useContext is a React hook that returns the current context value for the AuthContext. It is used to access the authentication context provided by the AuthProvider component.

  if (!context) {
    throw new Error('useAuthContext: Context must be used inside AuthProvider');
  }

  return context;
}