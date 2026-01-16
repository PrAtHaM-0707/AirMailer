import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { authenticatedFetch } from "@/lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid verification link");
      setVerifying(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setVerified(true);
          localStorage.setItem("emailVerified", "true");
          toast({ title: "Email verified!", description: "Your account is now fully activated." });
        } else {
          setError(data.message || "Verification failed");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleContinue = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          {verifying ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Verifying Email</h1>
                <p className="text-muted-foreground">Please wait while we verify your email...</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Verifying...</span>
              </div>
            </div>
          ) : verified ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2 text-green-700 dark:text-green-300">Email Verified!</h1>
                <p className="text-muted-foreground">Your email has been successfully verified. You can now access all features.</p>
              </div>
              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2 text-red-700 dark:text-red-300">Verification Failed</h1>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}