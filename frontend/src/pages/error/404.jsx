import { Helmet } from 'react-helmet-async';

import { View404 } from './errorViews';


const metadata = { title: `404 page not found! | Error - SummEval` };

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <View404 />
    </>
  );
}