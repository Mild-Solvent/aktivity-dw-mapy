<template>
  <div class="terms-page">
    <div class="container">
      <div class="page-header">
        <button @click="goBack" class="back-button">
          ← Back
        </button>
        <h1>Terms & Conditions</h1>
      </div>

      <div class="content">
        <section class="section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using TrackFinder, you accept and agree to be bound by the terms and provision of this agreement.
          </p>
        </section>

        <section class="section">
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials on TrackFinder for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>modify or copy the materials;</li>
            <li>use the materials for any commercial purpose or for any public display (commercial or non-commercial);</li>
            <li>attempt to decompile or reverse engineer any software contained on the website;</li>
            <li>remove any copyright or other proprietary notations from the materials.</li>
          </ul>
        </section>

        <section class="section">
          <h2>3. Track Information</h2>
          <p>
            All track information, including routes, difficulty levels, and descriptions, are provided for informational 
            purposes only. Users are responsible for their own safety and should verify all information before embarking on any activity.
          </p>
        </section>

        <section class="section">
          <h2>4. Disclaimer</h2>
          <p>
            The materials on TrackFinder are provided on an 'as is' basis. TrackFinder makes no warranties, expressed or implied, 
            and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions 
            of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section class="section">
          <h2>5. Limitations</h2>
          <p>
            In no event shall TrackFinder or its suppliers be liable for any damages (including, without limitation, 
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use 
            the materials on TrackFinder, even if TrackFinder or an authorized representative has been notified orally or 
            in writing of the possibility of such damage. Because some jurisdictions do not allow limitations on implied 
            warranties, or limitations of liability for consequential or incidental damages, these limitations may not apply to you.
          </p>
        </section>

        <section class="section">
          <h2>6. Safety Notice</h2>
          <p>
            Outdoor activities including running, cycling, and hiking can be dangerous. Users participate at their own risk. 
            Always inform someone of your plans, carry appropriate safety equipment, and be prepared for changing conditions. 
            TrackFinder is not responsible for any accidents, injuries, or incidents that may occur during activities.
          </p>
        </section>

        <section class="section">
          <h2>7. Revisions</h2>
          <p>
            TrackFinder may revise these terms of service at any time without notice. By using this web site you are agreeing 
            to be bound by the then current version of these terms of service.
          </p>
        </section>

        <section class="section">
          <h2>8. Contact Information</h2>
          <p>
            If you have any questions about these Terms & Conditions, please contact us through our website.
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
