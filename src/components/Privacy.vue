<template>
  <div class="privacy-page">
    <div class="container">
      <div class="page-header">
        <button @click="goBack" class="back-button">
← Späť
        </button>
        <h1>Ochrana súkromia</h1>
      </div>

      <div class="content">
        <section class="section">
          <p class="last-updated">Posledná aktualizácia: december 2024</p>
        </section>

        <section class="section">
          <h2>1. Žiadne zhromažďovanie údajov</h2>
          <p>
            <strong>ACTIVITY DW Club nezhromažďuje žiadne osobné údaje ani informácie o používateľoch.</strong>
          </p>
          <p>
            Naša webová stránka je navrhnutá tak, aby rešpektovala vaše súkromie. Nepoužívame:
          </p>
          <ul>
            <li><strong>Sledovacie cookies:</strong> Nesledujeme vaše správanie na webe</li>
            <li><strong>Analytické nástroje:</strong> Nezhromažďujeme štatistiky o návštevnosti</li>
            <li><strong>Osobné údaje:</strong> Nepýtame si ani neuchováváme žiadne osobné informácie</li>
            <li><strong>Údaje o polohe:</strong> Neprístupujeme k vašej polohe</li>
            <li><strong>Vyhľadávacie dotazy:</strong> Neukladáme vaše vyhľadávania</li>
          </ul>
        </section>

        <section class="section">
          <h2>2. GitHub Pages Hosting</h2>
          <p>
            Táto webová stránka je hostovaná na <strong>GitHub Pages</strong>, čo značí:
          </p>
          <ul>
            <li>Stránka je statická a nemá vlastný server na spracovanie údajov</li>
            <li>Všetky údaje sú spracované lokalne vo vašom prehliadači</li>
            <li>Nemôžeme zhromažďovať ani uchovávať údaje na serveri</li>
            <li>GitHub môže zachytiť základné informácie o návštevnosti (ako každá webová stránka), ale ACTIVITY DW Club k nim nemá prístup</li>
          </ul>
        </section>

        <section class="section">
          <h2>3. Lokálne údaje</h2>
          <p>
            Jedinou informáciou, ktorá sa uchováva, sú:
          </p>
          <ul>
            <li><strong>Preferences filtrov:</strong> Ukladané lokalne vo vašom prehliadači pre lepšú užívateľskú skúdosť</li>
            <li><strong>Súhlas s cookies:</strong> Informácia o tom, že ste si prečítali túto poznámku</li>
          </ul>
          <p>
            Tieto údaje sú ukladané iba lokalne vo vašom prehliadači a nikdy sa neposielajna server.
          </p>
        </section>

        <section class="section">
          <h2>4. Cookies</h2>
          <p>
            <strong>Nepoužívame žiadne sledovacie cookies.</strong> Jediné cookies, ktoré používame sú:
          </p>
          <ul>
            <li>Lokálne úložisko prehliadača na zapamätanie vašich preferencií</li>
            <li>Session storage na dočasné údaje počas používania stránky</li>
          </ul>
          <p>
            Žiadne z týchto údajov nie sú odosielané na externé servery.
          </p>
        </section>

        <section class="section">
          <h2>5. Služby tretích strán</h2>
          <p>
            Naša stránka môže obsahovať odkazy na externé webové stránky (napr. ceaeurope.sk). 
            <strong>ACTIVITY DW Club nie je zodpovedné za praktiky ochrany súkromia týchto externých stránok.</strong>
          </p>
        </section>

        <section class="section">
          <h2>6. Vaše práva a kontrola</h2>
          <p>
            Ponievaž nezhromažďujeme žiadne údaje, máte úplnú kontrolu nad vaším súkromím:
          </p>
          <ul>
            <li>Môžete vymazať lokálne údaje prehliadača kedykoľvek</li>
            <li>Môžete vypnúť JavaScript a stránka bude štále fungovať</li>
            <li>Môžete používať režim inkognito/súkromné prehliadače</li>
            <li>Nemáme žiadne údaje na vymazanie ani prenos</li>
          </ul>
        </section>

        <section class="section">
          <h2>7. Zmeny týchto zásad</h2>
          <p>
            Ak vykonáme zmeny v týchto zásadách ochrany súkromia, aktualizácia sa zobrazí na tejto stránke 
            s novým dátumom poslednej aktualizácie.
          </p>
        </section>

        <section class="section">
          <h2>8. Kontakt</h2>
          <p>
            Ak máte otázky o týchto zásadách ochrany súkromia pre <strong>ACTIVITY DW Club</strong>, 
            môžete nás kontaktovať prostredníctvom našej webovej stránky.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Privacy',
  methods: {
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>
