
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useStore } from "../StoreContext";

function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useStore();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [reference, setReference] = useState("");

  useEffect(() => {
    let active = true;

    const verifyPayment = async () => {
      const paymentReference = searchParams.get("reference");

      if (!paymentReference) {
        if (active) {
          setStatus("failed");
          setMessage("Payment reference is missing.");
        }
        return;
      }

      setReference(paymentReference);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        if (active) {
          setStatus("failed");
          setMessage("Please log in again to verify your payment.");
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "verify-payment",
        {
          body: {
            reference: paymentReference,
          },
        }
      );

      if (!active) return;

      if (error || !data) {
        setStatus("failed");
        setMessage(
          error?.message ||
            "We couldn't verify your payment. Please try again."
        );
        return;
      }

      // A payment is successful only when the backend confirms paid: true.
      if (data.paid === true) {
        clearCart();
        setStatus("success");
        setMessage("Your payment was successfully verified!");
        return;
      }

      if (
        data.paymentStatus === "failed" ||
        data.paymentStatus === "abandoned"
      ) {
        setStatus("failed");
        setMessage(
          "Your payment was not completed. No successful payment was recorded."
        );
        return;
      }

      if (
        data.paymentStatus === "pending" ||
        data.paymentStatus === "ongoing"
      ) {
        setStatus("pending");
        setMessage(
          "Your payment is still being processed. Please check your orders again shortly."
        );
        return;
      }

      setStatus("failed");
      setMessage(
        data.error ||
          data.message ||
          "We couldn't confirm your payment. Please check your orders before trying again."
      );
    };

    verifyPayment();

    return () => {
      active = false;
    };
  }, [searchParams, clearCart]);

  return (
    <main className="page-container payment-callback-page">
      <div className="empty-state payment-callback-card">
        {status === "verifying" && (
          <>
            <div className="payment-spinner"></div>
            <h1>Verifying payment</h1>
            <p>{message}</p>
            <p>Please don't close this page.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="payment-status-icon success">✓</div>
            <h1>Payment successful!</h1>
            <p>{message}</p>

            <div className="order-confirmation">
              <p>Payment reference</p>
              <strong>{reference}</strong>
            </div>

            <Link to="/orders" className="primary-button">
              View my orders
            </Link>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="payment-status-icon failed">!</div>
            <h1>Payment not completed</h1>
            <p>{message}</p>

            {reference && (
              <div className="order-confirmation">
                <p>Payment reference</p>
                <strong>{reference}</strong>
              </div>
            )}

            <Link to="/orders" className="primary-button">
              Check my orders
            </Link>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="payment-spinner"></div>
            <h1>Payment processing</h1>
            <p>{message}</p>

            <div className="order-confirmation">
              <p>Payment reference</p>
              <strong>{reference}</strong>
            </div>

            <Link to="/orders" className="primary-button">
              Check my orders
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default PaymentCallback;
