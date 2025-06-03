import { createContext } from 'react';

// Auth context is used to store the user's authentication state and provide it to all child components in the component tree
export const AuthContext = createContext(undefined);

// AuthConsumer: used to consume the authentication context in the child components of the component tree
export const AuthConsumer = AuthContext.Consumer;
