<template>
  <div class="privacy-page">
    <div class="container">
      <div class="page-header">
        <button @click="goBack" class="back-button">
          ← Back
        </button>
        <h1>Privacy Policy</h1>
      </div>

      <div class="content">
        <section class="section">
          <p class="last-updated">Last updated: November 2024</p>
        </section>

        <section class="section">
          <h2>1. Information We Collect</h2>
          <p>
            TrackFinder collects information to provide better services to our users. We collect information in the following ways:
          </p>
          <ul>
            <li><strong>Information you give us:</strong> Search queries and filter preferences to improve your experience</li>
            <li><strong>Information we get from your use of our services:</strong> We may collect information about the tracks you view and download</li>
            <li><strong>Location information:</strong> We may collect location data to provide relevant track recommendations</li>
          </ul>
        </section>

        <section class="section">
          <h2>2. How We Use Information</h2>
          <p>
            We use the information we collect from all of our services to:
          </p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Provide track recommendations based on your preferences</li>
            <li>Develop new services and features</li>
            <li>Protect TrackFinder and our users</li>
          </ul>
        </section>

        <section class="section">
          <h2>3. Information Sharing</h2>
          <p>
            We do not share personal information with companies, organizations, and individuals outside of TrackFinder unless one of the following circumstances applies:
          </p>
          <ul>
            <li><strong>With your consent:</strong> We will share personal information when we have your consent</li>
            <li><strong>For legal reasons:</strong> We will share personal information if we believe that access, use, preservation, or disclosure is reasonably necessary</li>
          </ul>
        </section>

        <section class="section">
          <h2>4. Information Security</h2>
          <p>
            We work hard to protect TrackFinder and our users from unauthorized access to or unauthorized alteration, 
            disclosure, or destruction of information we hold. In particular:
          </p>
          <ul>
            <li>We encrypt many of our services using SSL</li>
            <li>We review our information collection, storage, and processing practices</li>
            <li>We restrict access to personal information to TrackFinder employees who need to know that information</li>
          </ul>
        </section>

        <section class="section">
          <h2>5. Cookies and Similar Technologies</h2>
          <p>
            We use various technologies to collect and store information when you visit a TrackFinder service, 
            and this may include using cookies or similar technologies to identify your browser or device.
          </p>
        </section>

        <section class="section">
          <h2>6. Third-Party Services</h2>
          <p>
            Our service may contain links to third-party websites or services, such as Mapy.com for map viewing. 
            We are not responsible for the privacy practices of these third-party services. We encourage you to 
            review their privacy policies before providing any personal information.
          </p>
        </section>

        <section class="section">
          <h2>7. Data Retention</h2>
          <p>
            We retain collected information for as long as necessary to provide services. We will delete or 
            anonymize your personal information when it's no longer needed for the purposes outlined in this Privacy Policy.
          </p>
        </section>

        <section class="section">
          <h2>8. Your Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul>
            <li>Access your personal information</li>
            <li>Update or correct your personal information</li>
            <li>Delete your personal information</li>
            <li>Object to our use of your personal information</li>
            <li>Request that we transfer your personal information to another service</li>
          </ul>
        </section>

        <section class="section">
          <h2>9. Children's Privacy</h2>
          <p>
            Our services are not directed to children under 13. We do not knowingly collect personal information 
            from children under 13. If we become aware that a child under 13 has provided us with personal information, 
            we will delete such information from our files.
          </p>
        </section>

        <section class="section">
          <h2>10. Changes to This Policy</h2>
          <p>
            Our Privacy Policy may change from time to time. We will post any privacy policy changes on this page 
            and, if the changes are significant, we will provide a more prominent notice.
          </p>
        </section>

        <section class="section">
          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us through our website.
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
