import { Helmet } from 'react-helmet-async';

import { View403 } from './errorViews';


const metadata = { title: `403 forbidden! | Error - SummEval` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <View403 />
    </>
  );
}
