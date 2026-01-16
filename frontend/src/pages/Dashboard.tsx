import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Copy, Check, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeBlock } from "@/components/CodeBlock";
import { toast } from "@/components/ui/use-toast";
import { authenticatedFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const exampleRequest = `fetch('https://airmailer.vercel.app/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    to: 'recipient@example.com',
    subject: 'Hello from AirMailer',
    html: '<h1>Welcome!</h1><p>Your email content here.</p>'
  })
}).then(res => res.json()).then(console.log);`;

export default function Dashboard() {
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [sentToday, setSentToday] = useState<number>(0);
  const [emailVerified, setEmailVerified] = useState<boolean>(true);
  const [resendingVerification, setResendingVerification] = useState(false);

  const maskedKey = apiKey ? apiKey.replace(/(?<=.{8}).(?=.{4})/g, "•") : "••••••••••••••••";

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const res = await authenticatedFetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (!res) return;

      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "Verification email sent!", description: "Please check your email." });
      } else {
        toast({ title: "Error", description: data.message || "Failed to send verification email", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send verification email", variant: "destructive" });
    } finally {
      setResendingVerification(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({ title: "Error", description: "Not logged in", variant: "destructive" });
        setLoading(false);
        return;
      }

      try {
        // First, check verification status from backend
        const statusRes = await authenticatedFetch("/api/auth/status");
        let isVerified = false;
        if (statusRes && statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success) {
            isVerified = statusData.emailVerified;
            localStorage.setItem("emailVerified", isVerified ? "true" : "false");
            setEmailVerified(isVerified);
          }
        }

        // If not verified, stop here
        if (!isVerified) {
          setLoading(false);
          return;
        }

        // Fetch API key and logs only if verified
        const keyRes = await authenticatedFetch("/api/keys/get");

        if (keyRes && keyRes.ok) {
          const contentType = keyRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const keyData = await keyRes.json();
            if (keyData.success) {
              setApiKey(keyData.apiKey);
            }
          }
        }

        // Fetch logs to calculate today's sent count
        const logsRes = await authenticatedFetch("/api/logs/get");

        if (!logsRes || !logsRes.ok) throw new Error("Failed to load logs");

        const logsContentType = logsRes.headers.get("content-type");
        if (!logsContentType || !logsContentType.includes("application/json")) {
          throw new Error("Server returned non-JSON response for logs");
        }

        const logsData = await logsRes.json();
        if (!logsData.success) throw new Error(logsData.message || "Error");

        // Count successful sends today
        const today = new Date().toISOString().split("T")[0];
        const todaySends = logsData.logs.filter((log: { timestamp: string; status: string }) => {
          const logDate = new Date(log.timestamp).toISOString().split("T")[0];
          return logDate === today && log.status === "success";
        }).length;

        setSentToday(todaySends);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load data";
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRevealKey = () => {
    setShowConfirmModal(true);
    setPassword("");
    setPasswordError("");
  };

  const confirmReveal = async () => {
    setPasswordError("");
    try {
      const res = await authenticatedFetch("/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res) return; // Redirected

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordError(data.message || "Incorrect password");
        return;
      }

      setApiKeyVisible(true);
      setShowConfirmModal(false);
      setPassword("");
    } catch (err: unknown) {
      setPasswordError("Failed to verify password");
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not logged in");

      // Optional: verify password again before regenerate (extra security)
      const verifyRes = await authenticatedFetch("/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!verifyRes) return; // Redirected

      const verifyContentType = verifyRes.headers.get("content-type");
      if (!verifyContentType || !verifyContentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response for password verification");
      }

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || "Incorrect password");
      }

      // Proceed with regenerate
      const regenRes = await authenticatedFetch("/api/keys/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!regenRes) return; // Redirected

      const regenContentType = regenRes.headers.get("content-type");
      if (!regenContentType || !regenContentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response for API key regeneration");
      }

      const data = await regenRes.json();

      if (!regenRes.ok) throw new Error(data.message || "Failed to regenerate");

      setApiKey(data.newApiKey);
      toast({ title: "Success", description: "New API key generated!" });
      setShowRegenerateModal(false);
      setPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="container py-8 flex items-center justify-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-lg">Loading dashboard...</span>
    </div>
  );

  return (
    <div className="container py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your API key and monitor email activity (10 emails/day limit)
        </p>
      </motion.div>

      {!emailVerified && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Email Verification Required</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Please verify your email address to access your API key and email logs.
                </p>
              </div>
            </div>
            <Button
              onClick={handleResendVerification}
              disabled={resendingVerification}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-800"
            >
              {resendingVerification ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  Sending...
                </span>
              ) : (
                "Resend Email"
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {emailVerified ? (
        <>
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">{sentToday}/10</div>
          <div className="text-sm text-muted-foreground">Emails Sent Today</div>
        </div>
        {/* You can add more real stats cards later */}
      </motion.div>

      {/* API Key Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Your API Key</h2>
            <p className="text-sm text-muted-foreground">
              Use this key in the Authorization header (keep it secret!)
            </p>
          </div>
          <div className="flex gap-2">
            {apiKeyVisible ? (
              <Button variant="outline" size="sm" onClick={() => setApiKeyVisible(false)}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleRevealKey}>
                <Eye className="h-4 w-4 mr-2" />
                Reveal
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowRegenerateModal(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              readOnly
              value={apiKeyVisible ? apiKey : maskedKey}
              className="font-mono pr-12"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={copyToClipboard}
              disabled={!apiKeyVisible}
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Use in header: <code>Authorization: Bearer {maskedKey}</code>
        </p>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-lg font-semibold mb-2">Quick Start</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Send your first email (10/day limit)
        </p>
        <CodeBlock code={exampleRequest} language="javascript" showLineNumbers />
        <p className="text-xs text-muted-foreground mt-3">
          Replace YOUR_API_KEY with your actual key from above.
        </p>
      </motion.div>
      </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-8 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Dashboard Locked</h3>
              <p className="text-muted-foreground">
                Please verify your email address to access your API key and email features.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reveal Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm your password</DialogTitle>
            <DialogDescription>
              Enter your account password to reveal your API key
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmReveal} disabled={password.length < 1}>
              Reveal API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Confirmation Modal */}
      <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Key?</DialogTitle>
            <DialogDescription>
              Enter your password to confirm. This will invalidate the current key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="regen-password">Password</Label>
              <Input
                id="regen-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
              />
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenerateModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRegenerate}
              disabled={regenerating || password.length < 1}
            >
              {regenerating ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Regenerating...
                </span>
              ) : (
                "Regenerate Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}