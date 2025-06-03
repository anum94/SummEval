import { forwardRef } from 'react';
import { Link } from 'react-router-dom';


// RouterLink is a custom component that wraps the Link component from react-router-dom. It is used to create links in the app that can be styled using the theme object. It is used in the Sidebar component to create links to different pages in the app.
export const RouterLink = forwardRef(({ href, ...other }, ref) => (
  <Link ref={ref} to={href} {...other} />
));
