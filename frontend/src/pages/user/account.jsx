import { Helmet } from 'react-helmet-async';

import { AccountView } from './userViews/accountView';


const metadata = { title: `Account settings | Dashboard - SummEval` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AccountView />
    </>
  );
}