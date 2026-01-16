import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Mail,
  Server,
  Zap,
  Code2,
  Shield,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/CodeBlock";
import type { LucideIcon } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Send emails in milliseconds with our serverless infrastructure.",
  },
  {
    icon: Code2,
    title: "Developer First",
    description: "Simple REST API with easy integration for any project.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "HTTPS, password hashing, and rate limiting built-in.",
  },
  {
    icon: Gauge,
    title: "Track Everything",
    description: "Real-time logs and delivery status.",
  },
];

const pricingFeatures = [
  "10 free emails/day",
  "REST API access",
  "Delivery logs",
  "Regenerate key anytime",
  "Simple setup",
];

// ────────────────────────────────────────────────
// Updated example: using Authorization header (Bearer)
// ────────────────────────────────────────────────
const exampleCode = `fetch('https://airmailer.vercel.app/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'   // ← Your secure API key here
  },
  body: JSON.stringify({
    to: 'recipient@example.com',
    subject: 'Hello from AirMailer',
    text: 'Welcome! Your content here.',
    // html: '<p>Welcome! Your content here.</p>' // optional HTML version
  })
})
.then(res => res.json())
.then(console.log)
.catch(err => console.error(err));`;

export default function Landing() {
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 text-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">Free Email API (10/day)</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Email API for <span className="gradient-text">Everyone</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Send transactional emails easily with a simple REST API.
              10 emails/day free, no setup, instant delivery.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isLoggedIn ? "/dashboard" : "/auth"}>
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  {isLoggedIn ? "Go to Dashboard" : "Get API Key"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/docs">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Documentation
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8"
          >
            <FlowCard icon={Code2} title="Your App" subtitle="Send request" />
            <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
            <FlowCard
              icon={Server}
              title="AirMailer API"
              subtitle="Process & send"
              primary
            />
            <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
            <FlowCard icon={Mail} title="Inbox" subtitle="Delivered" success />
          </motion.div>
        </div>
      </section>

      {/* Code Example */}
      <section className="py-20">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">One API call. Delivered.</h2>
            <p className="text-muted-foreground mb-6">
              No servers, no config. Just send.
            </p>

            <ul className="space-y-3">
              {["Simple JSON API", "10 free emails/day", "Real-time logs"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{item}</span>
                  </li>
                )
              )}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <CodeBlock code={exampleCode} language="javascript" showLineNumbers />
            <p className="text-sm text-muted-foreground mt-3">
              Use your API key in the <code>Authorization</code> header with Bearer scheme.
              Keep it secret — never expose it in client-side code.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for students, developers, and small projects.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Simple & Free</h2>
            <p className="text-muted-foreground mb-8">
              Perfect for class projects and learning.
            </p>

            <div className="p-8 rounded-2xl border border-border bg-card">
              <div className="text-sm text-muted-foreground mb-2">Starting at</div>
              <div className="text-4xl font-bold mb-1">Free</div>
              <div className="text-muted-foreground mb-6">10 emails/day included</div>

              <ul className="space-y-3 text-left mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to={isLoggedIn ? "/dashboard" : "/auth"}>
                <Button className="w-full" size="lg">
                  {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              <span>© {new Date().getFullYear()} AirMailer. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/docs" className="hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FlowCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  primary?: boolean;
  success?: boolean;
}

function FlowCard({
  icon: Icon,
  title,
  subtitle,
  primary = false,
  success = false,
}: FlowCardProps) {
  return (
    <div
      className={`flex items-center gap-3 px-6 py-4 rounded-xl border ${
        primary
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          success
            ? "bg-success/10"
            : primary
            ? "bg-primary-foreground/20"
            : "bg-primary/10"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${
            success ? "text-success" : primary ? "" : "text-primary"
          }`}
        />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm opacity-80">{subtitle}</p>
      </div>
    </div>
  );
}