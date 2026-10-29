import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabase";

function ForgotPassword() {
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) throw resetError;

      setMessage(
        "If an account exists for that email, a password recovery email will be sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request a password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Forgot your password?</h1>
        <p>
          Enter your email address and we'll send you instructions to reset
          your password.
        </p>

        <label htmlFor="recovery-email">Email address</label>
        <input
          id="recovery-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        {message && (
          <p className="auth-feedback" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="auth-feedback auth-error" role="alert">
            {error}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Sending instructions..." : "Send reset link"}
        </button>

        <p className="auth-switch">
          Remembered your password? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

export default ForgotPassword;