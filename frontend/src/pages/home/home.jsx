import { Helmet } from 'react-helmet-async';

import { HomeFAQs } from '../home/homeViews/homeFaq';
import { HomeHero } from '../home/homeViews/homeHero';


const metadata = { title: `Welcome to SummEval` };

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>
      <HomeHero />
      <HomeFAQs />
    </>
  );
}