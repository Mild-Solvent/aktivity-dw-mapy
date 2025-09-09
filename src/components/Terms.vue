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
            Prístupom a používaním webovej stránky <strong>ACTIVITY DW Club</strong> prijimate a súhlasi te s tým, že sa budete riadiť podmienkami a ustanoveniami týchto všeobecných podmienok.
          </p>
        </section>

        <section class="section">
          <h2>2. Licencia na používanie</h2>
          <p>
            <strong>ACTIVITY DW Club</strong> vám uděľuje povoleníue na používanie tejto webovej stránky na osobné, 
            nekomerčné účely. Jedná sa o udělenie licencie, nie o prenos vlastníctva. Pod touto licenciou nemôžete:
          </p>
          <ul>
            <li>kopírovať alebo distribuíne obsah stránky bez súhlasu;</li>
            <li>používať obsah na komerčné účely;</li>
            <li>pokúšať sa dekompilovať alebo reverzne inžinyriť kód webovej stránky;</li>
            <li>odstrániť označenia autorských práv alebo iné vlastnícke označenia;</li>
            <li>narušovať fungovanie stránky alebo jej bezpečnosť.</li>
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
            Obsah na <strong>ACTIVITY DW Club</strong> je poskytovaný 'tak ako je'. 
            Neposkytujeme žiadne záruky, vyslovné ani implicitné, o presnosti, 
            úplnosti alebo spolählivosti informácií o trasách.
          </p>
        </section>

        <section class="section">
          <h2>5. Obmedzenie zodpovednosti</h2>
          <p>
            <strong>ACTIVITY DW Club</strong> nie je zodpovedné za žiadne škody vyplývajúce z používania tejto stránky,
            vrátane ale nie obmedzene na:
          </p>
          <ul>
            <li>Zranenia počas športovej aktivity</li>
            <li>Nepresné informácie o trasách</li>
            <li>Technické problémy alebo výpadky stránky</li>
            <li>Stratu času alebo príležitosťí</li>
          </ul>
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
          <h2>7. GitHub Pages a Open Source</h2>
          <p>
            Táto stránka je hostovaná na GitHub Pages ako statická webová stránka. 
            Zdrojový kód môže byť dostupný na GitHub repozitári.
          </p>
        </section>

        <section class="section">
          <h2>8. Zmeny podmienok</h2>
          <p>
            <strong>ACTIVITY DW Club</strong> si vyhradzuje právo zmeniť tieto podmienky kedykoľvek. 
            Zmeny budú zverejnené na tejto stránke a nadobudú účinosť okamžite po zverejnení.
          </p>
        </section>

        <section class="section">
          <h2>9. Kontakt</h2>
          <p>
            Ak máte otázky o týchto Všeobecných podmienkach pre <strong>ACTIVITY DW Club</strong>, 
            môžete nás kontaktovať prostredníctvom našej webovej stránky.
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
