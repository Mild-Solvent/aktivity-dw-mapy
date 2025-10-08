'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Terms() {
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
        <div className="terms-page">
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
                Všeobecné podmienky
              </h1>
            </div>

            <div className="content" style={{ maxWidth: '800px', lineHeight: '1.8' }}>
              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  1. Prijatie podmienok
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Prístupom a používaním webovej stránky <strong>ACTIVITY DW Club</strong> prijímate a súhlasíte s tým, že sa budete riadiť podmienkami a ustanoveniami týchto všeobecných podmienok.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  2. Licencia na používanie
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  <strong>ACTIVITY DW Club</strong> vám udeľuje povolenie na používanie tejto webovej stránky na osobné, 
                  nekomerčné účely. Jedná sa o udelenie licencie, nie o prenos vlastníctva. Pod touto licenciou nemôžete:
                </p>
                <ul style={{ color: '#666', marginBottom: '1rem', paddingLeft: '2rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>kopírovať alebo distribuovať obsah stránky bez súhlasu;</li>
                  <li style={{ marginBottom: '0.5rem' }}>používať obsah na komerčné účely;</li>
                  <li style={{ marginBottom: '0.5rem' }}>pokúšať sa dekompilovať alebo reverzne inžinyriť kód webovej stránky;</li>
                  <li style={{ marginBottom: '0.5rem' }}>odstrániť označenia autorských práv alebo iné vlastnícke označenia;</li>
                  <li style={{ marginBottom: '0.5rem' }}>narušovať fungovanie stránky alebo jej bezpečnosť.</li>
                </ul>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  3. Informácie o trasách
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Všetky informácie o trasách, vrátane trás, úrovní obtiažnosti a popisov, sú poskytované iba na 
                  informačné účely. Používatelia sú zodpovední za svoju vlastnú bezpečnosť a mali by si overiť všetky informácie pred začatím akejkoľvek aktivity.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  4. Zrieknutie sa zodpovednosti
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Obsah na <strong>ACTIVITY DW Club</strong> je poskytovaný &apos;tak ako je&apos;. 
                  Neposkytujeme žiadne záruky, vyslovené ani implicitné, o presnosti, 
                  úplnosti alebo spoľahlivosti informácií o trasách.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  5. Obmedzenie zodpovednosti
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  <strong>ACTIVITY DW Club</strong> nie je zodpovedný za žiadne škody vyplývajúce z používania tejto stránky,
                  vrátane ale nie obmedzene na:
                </p>
                <ul style={{ color: '#666', marginBottom: '1rem', paddingLeft: '2rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>Zranenia počas športovej aktivity</li>
                  <li style={{ marginBottom: '0.5rem' }}>Nepresné informácie o trasách</li>
                  <li style={{ marginBottom: '0.5rem' }}>Technické problémy alebo výpadky stránky</li>
                  <li style={{ marginBottom: '0.5rem' }}>Stratu času alebo príležitostí</li>
                </ul>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  6. Bezpečnostné upozornenie
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Vonkajšie aktivity vrátane behu, cyklistiky a turistiky môžu byť nebezpečné. Používatelia sa zúčastňujú na vlastné riziko. 
                  Vždy informujte niekoho o svojich plánoch, noste vhodné bezpečnostné vybavenie a buďte pripravení na meniace sa podmienky. 
                  Hľadač Trás nie je zodpovedný za žiadne nehody, zranenia alebo incidenty, ktoré sa môžu vyskytnúť počas aktivít.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  7. GitHub Pages a Open Source
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Táto stránka je hostovaná na GitHub Pages ako statická webová stránka. 
                  Zdrojový kód môže byť dostupný na GitHub repozitári.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  8. Zmeny podmienok
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  <strong>ACTIVITY DW Club</strong> si vyhradzuje právo zmeniť tieto podmienky kedykoľvek. 
                  Zmeny budú zverejnené na tejto stránke a nadobudnú účinnosť okamžite po zverejnení.
                </p>
              </section>

              <section className="section" style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                  9. Kontakt
                </h2>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Ak máte otázky o týchto Všeobecných podmienkach pre <strong>ACTIVITY DW Club</strong>, 
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