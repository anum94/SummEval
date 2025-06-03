import { Helmet } from 'react-helmet-async';

import { JwtRegisterView } from './jwtViews';


const metadata = { title: `Register - SummEval` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <JwtRegisterView />
    </>
  );
}
