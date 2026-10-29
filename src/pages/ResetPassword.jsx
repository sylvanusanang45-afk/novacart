
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (active) {
          setRecoveryReady(Boolean(data.session));

          if (!data.session) {
            setError(
              "This recovery link is invalid or has expired. Please request a new one."
            );
          }
        }
      } catch {
        if (active) {
          setError(
            "Unable to verify your recovery link. Please request a new one."
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoveryReady(true);
        setError("");
      }
    });

    checkRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!recoveryReady) {
      setError("Please open a valid password recovery link first.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setPassword("");
      setConfirmPassword("");
      setRecoveryReady(false);

      // Sign out after changing the password.
      try {
        const { error: signOutError } =
          await supabase.auth.signOut();

        if (signOutError) {
          console.error(
            "Could not end the recovery session:",
            signOutError
          );
        }
      } catch (signOutError) {
        console.error(
          "Could not end the recovery session:",
          signOutError
        );
      }

      // Return to Login with a success message.
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Password changed successfully! Please sign in with your new password.",
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to change your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h1>Reset your password</h1>

        {checkingSession ? (
          <p>Verifying your recovery link...</p>
        ) : !recoveryReady ? (
          <>
            {error && (
              <p className="auth-feedback auth-error" role="alert">
                {error}
              </p>
            )}

            <p>Request a fresh recovery email to continue.</p>

            <p className="auth-switch">
              <Link to="/forgot-password">
                Request a new reset link
              </Link>
            </p>
          </>
        ) : (
          <>
            <p>Choose a new password for your NovaCart account.</p>

            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <label htmlFor="confirm-new-password">
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter the password again"
              minLength={8}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
            />

            {error && (
              <p className="auth-feedback auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Updating password..." : "Update password"}
            </button>
          </>
        )}
      </form>
    </main>
  );
}

export default ResetPassword;
