import { Helmet } from 'react-helmet-async';

import { JwtLoginView } from './jwtViews';

const metadata = { title: `Login - SummEval` };


export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <JwtLoginView />
    </>
  );
}
