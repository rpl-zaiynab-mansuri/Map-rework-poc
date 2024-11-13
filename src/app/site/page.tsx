 
// Import `dynamic` from Next.js
import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the component with SSR disabled
const MapWithMeasurements = dynamic(() => import('@/components/site'), {
  ssr: false,
});

const SitePage: React.FC = () => {
  return <MapWithMeasurements />;
};

export default SitePage;
