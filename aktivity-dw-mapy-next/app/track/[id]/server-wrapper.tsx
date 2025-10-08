import TrackDetail from './track-detail-client';

// Generate static params for all available tracks
export async function generateStaticParams() {
  // For static export, we need to pre-generate all possible track pages
  return [
    { id: 'inovec-mitice-ostry-vrch' },
    { id: 'kolacin-trail-klepac' }, 
    { id: 'nedasov-brumov-trencin' },
    { id: 'nemsova-ibovka-tn-kolacin' },
    { id: 'omsenie-dolna-poruba-iliavka' },
    { id: 'soblahov-cez-brezinu' },
    { id: 'suca-sanov-stitna' }
  ];
}

export default function TrackPage() {
  return <TrackDetail />;
}