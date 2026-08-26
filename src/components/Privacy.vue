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
          <p class="last-updated">Posledná aktualizácia: august 2026</p>
        </section>

        <section class="section">
          <h2>1. Prevádzkovateľ</h2>
          <p>
            Prevádzkovateľom tejto webovej stránky a správcom osobných údajov je občianske združenie
            <strong>AKTIVITY DW KLUB</strong>, so sídlom Farská 493, 018 51 Nová Dubnica, IČO: 42 021 014.
            Stránka je hostovaná u spoločnosti Websupport, s.r.o. (Slovensko), ktorá pre nás údaje
            technicky spracúva ako sprostredkovateľ.
          </p>
        </section>

        <section class="section">
          <h2>2. Aké údaje spracúvame</h2>
          <p>
            Väčšinu obsahu stránky si môžete prezerať bez akejkoľvek registrácie — v takom prípade
            o vás neukladáme žiadne osobné údaje. Ak si vytvoríte účet alebo ho používate, spracúvame:
          </p>
          <ul>
            <li><strong>Údaje o účte:</strong> e-mailová adresa, heslo (ukladané výhradne v zahashovanej podobe, nikdy ako čistý text), rola účtu a dátum vytvorenia</li>
            <li><strong>Prihlásenie:</strong> náhodný token relácie uložený v cookie a v databáze, platný 7 dní</li>
            <li><strong>Obľúbené trasy:</strong> informácia, ktoré trasy ste označili ako „páči sa mi", spojená s vaším e-mailom</li>
            <li><strong>Obnova hesla:</strong> pri žiadosti o obnovenie hesla ukladáme e-mail, zahashovaný token a IP adresu, z ktorej žiadosť prišla — IP adresa slúži výlučne na ochranu pred zneužitím (obmedzenie počtu žiadostí)</li>
            <li><strong>Pridaný obsah:</strong> pri trasách a oznamoch pridaných oprávnenými používateľmi evidujeme, kto ich vytvoril</li>
          </ul>
          <p>
            Nepoužívame žiadne analytické ani reklamné nástroje a nesledujeme vaše správanie na stránke.
          </p>
        </section>

        <section class="section">
          <h2>3. Účely a právne základy</h2>
          <ul>
            <li><strong>Vedenie účtu a prihlásenie:</strong> plnenie zmluvy — bez týchto údajov účet nemôže fungovať</li>
            <li><strong>Odosielanie e-mailov na obnovu hesla:</strong> plnenie zmluvy</li>
            <li><strong>Ukladanie IP adries pri obnove hesla:</strong> oprávnený záujem na zabezpečení stránky pred zneužitím</li>
          </ul>
        </section>

        <section class="section">
          <h2>4. Cookies a lokálne úložisko</h2>
          <p>
            Používame iba <strong>nevyhnutné technické cookies</strong> — žiadne sledovacie ani marketingové:
          </p>
          <ul>
            <li><strong>Cookie relácie:</strong> po prihlásení uchováva váš prihlasovací token (HttpOnly, platnosť 7 dní). Bez nej prihlásenie nefunguje.</li>
            <li><strong>Lokálne úložisko prehliadača:</strong> pamätá si, že ste vzali na vedomie informáciu o cookies. Tento údaj nikdy neopúšťa váš prehliadač.</li>
          </ul>
        </section>

        <section class="section">
          <h2>5. Doba uchovávania</h2>
          <ul>
            <li><strong>Údaje o účte a obľúbené trasy:</strong> po dobu existencie účtu</li>
            <li><strong>Relácie:</strong> 7 dní, po vypršaní sa automaticky mažú</li>
            <li><strong>Záznamy o obnove hesla (vrátane IP adries):</strong> token platí 1 hodinu; záznamy sa mažú približne 7 dní po vypršaní</li>
          </ul>
        </section>

        <section class="section">
          <h2>6. Komu údaje sprístupňujeme</h2>
          <p>
            Vaše údaje nepredávame ani neposkytujeme tretím stranám na marketingové účely. Technicky ich spracúva iba:
          </p>
          <ul>
            <li><strong>Websupport, s.r.o.:</strong> hosting stránky, databázy a odosielanie e-mailov (napr. pri obnove hesla)</li>
          </ul>
          <p>
            Stránka môže obsahovať odkazy na externé webové stránky (napr. ceaeurope.sk).
            Za praktiky ochrany súkromia týchto stránok nezodpovedáme.
          </p>
        </section>

        <section class="section">
          <h2>7. Vaše práva</h2>
          <p>
            Podľa nariadenia GDPR máte právo:
          </p>
          <ul>
            <li>na prístup k svojim osobným údajom a na ich kópiu,</li>
            <li>na opravu nesprávnych údajov,</li>
            <li>na vymazanie údajov (vrátane zrušenia účtu),</li>
            <li>na obmedzenie spracúvania a na námietku proti spracúvaniu založenému na oprávnenom záujme,</li>
            <li>na prenosnosť údajov,</li>
            <li>podať sťažnosť na Úrad na ochranu osobných údajov Slovenskej republiky (dataprotection.gov.sk).</li>
          </ul>
          <p>
            Na uplatnenie týchto práv nás kontaktujte spôsobom uvedeným v časti Kontakt.
          </p>
        </section>

        <section class="section">
          <h2>8. Zabezpečenie</h2>
          <p>
            Heslá ukladáme iba v zahashovanej podobe, tokeny na obnovu hesla sú jednorazové a v databáze
            uložené tiež len ako hash. Komunikácia so stránkou prebieha cez HTTPS a prihlasovacia cookie
            nie je prístupná skriptom (HttpOnly).
          </p>
        </section>

        <section class="section">
          <h2>9. Zmeny týchto zásad</h2>
          <p>
            Ak vykonáme zmeny v týchto zásadách ochrany súkromia, aktualizácia sa zobrazí na tejto stránke
            s novým dátumom poslednej aktualizácie.
          </p>
        </section>

        <section class="section">
          <h2>10. Kontakt</h2>
          <p>
            Ak máte otázky o týchto zásadách ochrany súkromia alebo si chcete uplatniť svoje práva,
            kontaktujte <strong>AKTIVITY DW KLUB</strong> prostredníctvom kontaktných údajov uvedených na našej webovej stránke.
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
