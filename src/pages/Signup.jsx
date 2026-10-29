import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setShowResend(false);
    setLoading(true);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: "https://novacart-mauve.vercel.app/",
        },
      });

      if (signupError) throw signupError;

      if (data.session) {
        navigate("/", { replace: true });
      } else {
        setMessage(
          "Account created. Check your email for a confirmation link before signing in."
        );
        setShowResend(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: "https://novacart-mauve.vercel.app/",
        },
      });

      if (resendError) throw resendError;

      setMessage(
        "If your account needs confirmation, a new confirmation email has been requested. Check your inbox and spam folder."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to resend the confirmation email. Please try again."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">JOIN THE LITTLE THINGS</p>
        <h1>Make yourself at home.</h1>
        <p>Create an account to get started.</p>

        <label htmlFor="signup-name">Your name</label>
        <input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="signup-email">Email address</label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password (at least 8 characters)"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && (
          <p className="auth-feedback auth-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="auth-feedback auth-success" role="status">
            {message}
          </p>
        )}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        {showResend && (
          <button
            className="primary-button"
            type="button"
            onClick={handleResend}
            disabled={resending || loading || !email.trim()}
          >
            {resending ? "Sending email..." : "Resend confirmation email"}
          </button>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

export default Signup;