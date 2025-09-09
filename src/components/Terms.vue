<template>
  <div class="terms-page">
    <div class="container">
      <div class="page-header">
        <button @click="goBack" class="back-button">
← Späť
        </button>
        <h1>Všeobecné podmienky</h1>
      </div>

      <div class="content">
        <section class="section">
          <h2>1. Prijatie podmienok</h2>
          <p>
            Prístupom a používaním Hľadača Trás prijimate a súhlasíte s tým, že sa budete riadiť podmienkami a ustanoveniami tejto zmluvy.
          </p>
        </section>

        <section class="section">
          <h2>2. Licencia na používanie</h2>
          <p>
            Udělíte sa povolenie na dočasné stiahnutie jednej kópie materiálov z Hľadača Trás iba na osobné, 
            nekomerčné a dočasné prezretie. Jedná sa o udělenie licencie, nie o prenos vlastníctva, a pod touto licenciou nemôžete:
          </p>
          <ul>
            <li>modifikovať alebo kopírovať materiály;</li>
            <li>používať materiály na komerčné účely alebo na akekǿolvek verejné zobrazenie (komerčné alebo nekomerčné);</li>
            <li>pokúšať sa dekompilovať alebo reverzne inžinyriť akýkoĺvek softvér obsiahnutý na webovej stránke;</li>
            <li>odstrániť akékoĺvek označenie autorských práv alebo iné vlastnícke označenia z materiálov.</li>
          </ul>
        </section>

        <section class="section">
          <h2>3. Informácie o trasách</h2>
          <p>
            Všetky informácie o trasách, vrátane trás, úrovní obtiaznosti a popisov, sú poskytované iba na 
            informačné účely. Používatelia sú zodpovední za svoju vlastnú bezpečnosť a mali by si overiť všetky informácie pred začatím akejkoľvek aktivity.
          </p>
        </section>

        <section class="section">
          <h2>4. Zrieknutie sa zodpovednosti</h2>
          <p>
            Materiály na Hľadači Trás sú poskytované 'tak ako sú'. Hľadač Trás neposkytuje žiadne záruky, vyslovné ani implicitné, 
            a týmto sa zrieka a neguje všetky ostatné záruky vrátane, bez obmedzenia, implicitných záruk alebo podmienok 
            obchodovateľnosti, vhodnosti na konkrétny účel alebo neporušenia duševného vlastníctva alebo iného porušenia práv.
          </p>
        </section>

        <section class="section">
          <h2>5. Obmedzenia</h2>
          <p>
            V žiadnom prípade nie je Hľadač Trás ani jeho dodávatelia zodpovední za akékoľvek škody (vrátane, bez obmedzenia, 
            škôd za stratu údajov alebo zisku, alebo v dôsledku prerušenia podnikania) vyplývajúce z používania alebo nemožnosti používať 
            materiály na Hľadači Trás, a to aj v prípade, že Hľadač Trás alebo autorizovaný zástupca bol ústne alebo 
            písomne upozornený na možnosť takejto škody. Keďže niektore jurisdikcie neumožňujú obmedzenia implicitných 
            záruk alebo obmedzenia zodpovednosti za následné alebo náhodné škody, tieto obmedzenia sa na vás nemusia vzťahovať.
          </p>
        </section>

        <section class="section">
          <h2>6. Bezpečnostné upozornenie</h2>
          <p>
            Vonkajšie aktivity vrátane behu, cyklistiky a turistiky môžu byť nebezpečné. Používatelia sa zúčastňujú na vlastné riziko. 
            Vždy informujte niekoho o svojich plánoch, noste vhodné bezpečnostné vybavenie a buďte pripravení na meniace sa podmienky. 
            Hľadač Trás nie je zodpovedný za žiadne nehody, zranenia alebo incidenty, ktoré sa môžu vyskytnúť počas aktivit.
          </p>
        </section>

        <section class="section">
          <h2>7. Revízie</h2>
          <p>
            Hľadač Trás môže kedykoľvek zrevidovať tieto podmienky používania bez upozornenia. Používaním tejto webovej stránky súhlasisíte 
            s tým, že budete viazaný aktuálnou verziou týchto podmienok používania.
          </p>
        </section>

        <section class="section">
          <h2>8. Kontaktné informácie</h2>
          <p>
            Ak máte akékoľvek otázky týkajúce sa týchto Všeobecných podmienok, kontaktujte nás prosím prostredníctvom našej webovej stránky.
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Terms',
  methods: {
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>
