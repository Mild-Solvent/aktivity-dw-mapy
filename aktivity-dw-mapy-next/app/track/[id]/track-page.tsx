import TrackDetailClient from './track-detail-client';

// Generate static params for all tracks  
export async function generateStaticParams() {
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

export default function TrackDetailPage() {
  return <TrackDetailClient />;
}