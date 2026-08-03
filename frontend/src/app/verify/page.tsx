import Link from "next/link";

export default function VerifyPage() {
  return (
    <section className="auth-shell">
      <div className="auth-panel">
        <div className="auth-head">
          <span className="hero-tag">Coming Soon</span>
          <h1 className="section-title">Account Verification</h1>
          <p className="auth-subtitle">
            Email and phone OTP verification is prepared in the codebase, but it is currently disabled until mail and SMS providers are configured.
          </p>
        </div>

        <div style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          New users can create an account without verification for now. When providers are ready, this page can be reconnected to the existing OTP API helpers.
        </div>

        <div className="auth-footer-note">
          Want to create an account? <Link href="/register">Go to signup</Link>
        </div>
      </div>
    </section>
  );
}

