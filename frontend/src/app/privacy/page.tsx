export default function PrivacyPage() {
  return (
    <div className="container" style={{ padding: "var(--space-2xl) 0", maxWidth: "800px" }}>
      <h1 className="section-title" style={{ fontSize: "2.5rem", marginBottom: "var(--space-xl)" }}>Personal Data Policy</h1>
      
      <div className="prose" style={{ lineHeight: 1.8 }}>
        <p>Your privacy is important to us. This Personal Data Policy explains how Irraya collects, uses, and protects your personal information.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>1. Information We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, make a purchase, subscribe to our newsletter, or contact customer support. This may include your name, email address, shipping address, and payment information.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>2. How We Use Your Information</h2>
        <p>We use your information to process transactions, deliver products, communicate with you about your orders, and personalize your shopping experience. We may also use your data to improve our platform and prevent fraud.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>3. Data Sharing and Third Parties</h2>
        <p>We do not sell your personal data to third parties. We only share your information with trusted service providers who assist us in operating our website, processing payments, and fulfilling orders, strictly under confidentiality agreements.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>4. Your Rights and Choices</h2>
        <p>You have the right to access, correct, or delete your personal information. You can manage your preferences or unsubscribe from marketing communications at any time through your account settings or by contacting us.</p>

        <h2 className="section-title" style={{ fontSize: "1.5rem", marginTop: "var(--space-xl)", marginBottom: "var(--space-md)" }}>5. Security</h2>
        <p>We implement industry-standard security measures, including encryption and secure server hosting, to protect your data against unauthorized access and disclosure.</p>

        <p style={{ marginTop: "var(--space-xl)", color: "var(--text-muted)", fontSize: "0.85rem" }}>Last updated: June 2026</p>
      </div>
    </div>
  );
}
