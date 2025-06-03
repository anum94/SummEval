import { Helmet } from 'react-helmet-async';

import { View500 } from './errorViews';

const metadata = { title: `500 Internal server error! | Error - SummEval` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <View500 />
    </>
  );
}
