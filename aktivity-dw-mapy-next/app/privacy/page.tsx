'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Privacy() {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <div id="app">
      <Header 
        filters={{ sport: '', distance: '', difficulty: '', location: '' }}
        searchQuery=""
        onFiltersChange={() => {}}
        onSearchChange={() => {}}
      />
      
      <main className="main-content">
        <div className="privacy-page">
          <div className="container">
            <div className="page-header" style={{ marginBottom: '2rem', paddingTop: '2rem' }}>
              <button onClick={goBack} className="back-button" style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                marginBottom: '1rem',
                transition: 'all 0.3s ease'
              }}>
                ← Späť
              </button>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem' }}>
                Ochrana súkromia
              </h1>
            </div>

            <div className="content" style={{ maxWidth: '800px', lineHeight: '1.8' }}>
              <section className="section" style={{ marginBottom: '2rem' }}>
                <p className="last-updated" style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Posledná aktualizácia: december 2024
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  1. Žiadne zhromažďovanie údajov
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  <strong>ACTIVITY DW Club nezhromažďuje žiadne osobné údaje ani informácie o používateľoch.</strong>
                </p>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Naša webová stránka je navrhnutá tak, aby rešpektovala vaše súkromie. Nepoužívame:
                </p>
                <ul style={{ color: '#666', marginBottom: '1rem', paddingLeft: '2rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Sledovacie cookies:</strong> Nesledujeme vaše správanie na webe</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Analytické nástroje:</strong> Nezhromažďujeme štatistiky o návštevnosti</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Osobné údaje:</strong> Nepýtame si ani neuchováváme žiadne osobné informácie</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Údaje o polohe:</strong> Neprístupujeme k vašej polohe</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Vyhľadávacie dotazy:</strong> Neukladáme vaše vyhľadávania</li>
                </ul>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  2. GitHub Pages Hosting
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Táto webová stránka je hostovaná na <strong>GitHub Pages</strong>, čo značí:
                </p>
                <ul style={{ color: '#666', marginBottom: '1rem', paddingLeft: '2rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Stránka je statická a nemá vlastný server na spracovanie údajov</li>
                  <li style={{ marginBottom: '0.5rem' }}>Všetky údaje sú spracované lokálne vo vašom prehliadači</li>
                  <li style={{ marginBottom: '0.5rem' }}>Nemôžeme zhromažďovať ani uchovávať údaje na serveri</li>
                  <li style={{ marginBottom: '0.5rem' }}>GitHub môže zachytiť základné informácie o návštevnosti (ako každá webová stránka), ale ACTIVITY DW Club k nim nemá prístup</li>
                </ul>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  3. Lokálne údaje
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Jedinou informáciou, ktorá sa uchováva, sú:
                </p>
                <ul style={{ color: '#666', marginBottom: '1rem', paddingLeft: '2rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Preferencie filtrov:</strong> Ukladané lokálne vo vašom prehliadači pre lepšiu užívateľskú skúsenosť</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Súhlas s cookies:</strong> Informácia o tom, že ste si prečítali túto poznámku</li>
                </ul>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Tieto údaje sú ukladané iba lokálne vo vašom prehliadači a nikdy sa neposielajú na server.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  4. Cookies
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  <strong>Nepoužívame žiadne sledovacie cookies.</strong> Jediné cookies, ktoré používame sú:
                </p>
                <ul style={{ color: '#666', marginBottom: '1rem', paddingLeft: '2rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Lokálne úložisko prehliadača na zapamätanie vašich preferencií</li>
                  <li style={{ marginBottom: '0.5rem' }}>Session storage na dočasné údaje počas používania stránky</li>
                </ul>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Žiadne z týchto údajov nie sú odosielané na externé servery.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  5. Služby tretích strán
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Naša stránka môže obsahovať odkazy na externé webové stránky (napr. ceaeurope.sk). 
                  <strong> ACTIVITY DW Club nie je zodpovedné za praktiky ochrany súkromia týchto externých stránok.</strong>
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  6. Vaše práva a kontrola
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Poniewaž nezhromažďujeme žiadne údaje, máte úplnú kontrolu nad vaším súkromím:
                </p>
                <ul style={{ color: '#666', marginBottom: '1rem', paddingLeft: '2rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Môžete vymazať lokálne údaje prehliadača kedykoľvek</li>
                  <li style={{ marginBottom: '0.5rem' }}>Môžete vypnúť JavaScript a stránka bude stále fungovať</li>
                  <li style={{ marginBottom: '0.5rem' }}>Môžete používať režim inkognito/súkromné prehliadače</li>
                  <li style={{ marginBottom: '0.5rem' }}>Nemáme žiadne údaje na vymazanie ani prenos</li>
                </ul>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  7. Zmeny týchto zásad
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Ak vykonáme zmeny v týchto zásadách ochrany súkromia, aktualizácia sa zobrazí na tejto stránke 
                  s novým dátumom poslednej aktualizácie.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  8. Kontakt
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Ak máte otázky o týchto zásadách ochrany súkromia pre <strong>ACTIVITY DW Club</strong>, 
                  môžete nás kontaktovať prostredníctvom našej webovej stránky.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}