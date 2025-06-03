import ReactDOM from 'react-dom/client';
import { Suspense, StrictMode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';

// StrictMode: StrictMode is a tool for highlighting potential problems in an application. Like Fragment, StrictMode does not render any visible UI. It activates additional checks and warnings for its descendants.
// Suspense: Suspense is a React component that lets you "wait" for some code to load and declaratively specify a loading state (like a spinner) while the code is loading.
// HelmetProvider: A wrapper component that provides the Helmet context to its children. This context is used by the Helmet component to manage the document head. For example, you can use Helmet to set the title of the document.

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <Suspense>
        <App />
      </Suspense>
    </HelmetProvider>
  </StrictMode>
);
