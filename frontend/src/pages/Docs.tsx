import { useState } from "react";
import { motion } from "framer-motion";
import { Book, Key, Send, AlertTriangle, Code, ChevronRight } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { cn } from "@/lib/utils";

const sections = [
  { id: "authentication", label: "Authentication", icon: Key },
  { id: "send-email", label: "Send Email", icon: Send },
  { id: "status-codes", label: "Status Codes", icon: AlertTriangle },
  { id: "examples", label: "Code Examples", icon: Code },
  { id: "rate-limits", label: "Rate Limits", icon: Book },
];

// ────────────────────────────────────────────────
// Updated examples: using Authorization: Bearer
// ────────────────────────────────────────────────
const curlExample = `curl -X POST https://airmailer.vercel.app/api/email/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-api-key-here" \\
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from AirMailer",
    "html": "<h1>Welcome!</h1><p>Your content here.</p>",
    "text": "Welcome! Your content here."
  }'`;

const jsExample = `fetch('https://airmailer.vercel.app/api/email/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key-here'
  },
  body: JSON.stringify({
    to: 'recipient@example.com',
    subject: 'Hello from AirMailer',
    html: '<h1>Welcome!</h1><p>Your content here.</p>',
    text: 'Welcome! Your content here.'
  })
})
.then(res => res.json())
.then(console.log)
.catch(err => console.error(err));`;

const pythonExample = `import requests

response = requests.post(
    'https://airmailer.vercel.app/api/email/send',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-api-key-here'
    },
    json={
        'to': 'recipient@example.com',
        'subject': 'Hello from AirMailer',
        'html': '<h1>Welcome!</h1><p>Your content here.</p>',
        'text': 'Welcome! Your content here.'
    }
)

print(response.json())`;

const javaExample = `import java.net.http.*;
import java.net.URI;

HttpClient client = HttpClient.newHttpClient();

String json = """
    {
        "to": "recipient@example.com",
        "subject": "Hello from AirMailer",
        "html": "<h1>Welcome!</h1><p>Your content here.</p>",
        "text": "Welcome! Your content here."
    }
    """;

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://airmailer.vercel.app/api/email/send"))
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer your-api-key-here")
    .POST(HttpRequest.BodyPublishers.ofString(json))
    .build();

HttpResponse<String> response = client.send(request, 
    HttpResponse.BodyHandlers.ofString());

System.out.println(response.body());`;

const successResponse = `{
  "success": true,
  "message": "Email sent successfully!"
}`;

const errorResponse = `{
  "success": false,
  "message": "Invalid or missing Authorization header"
}`;

const statusCodes = [
  { code: "200", description: "Success - Email sent", type: "success" },
  { code: "400", description: "Bad Request - Invalid input", type: "error" },
  { code: "401", description: "Unauthorized - Invalid or missing API key", type: "error" },
  { code: "429", description: "Rate limit exceeded (10 emails/day)", type: "warning" },
  { code: "500", description: "Server error", type: "error" },
];

// Updated request fields — no apiKey in body anymore
const requestFields = [
  { name: "to", type: "string", required: true, description: "Recipient email address" },
  { name: "subject", type: "string", required: true, description: "Email subject line" },
  { name: "html", type: "string", required: false, description: "HTML content of the email" },
  { name: "text", type: "string", required: false, description: "Plain text content of the email" },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState("authentication");
  const [activeExample, setActiveExample] = useState("curl");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-64 flex-shrink-0"
        >
          <div className="lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Documentation
            </h2>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                    activeSection === section.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                  <ChevronRight
                    className={cn(
                      "ml-auto h-4 w-4 transition-transform",
                      activeSection === section.id && "rotate-90"
                    )}
                  />
                </button>
              ))}
            </nav>
          </div>
        </motion.aside>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {/* Authentication */}
            <section id="authentication" className="mb-16 scroll-mt-24">
              <h1 className="text-3xl font-bold mb-4">Authentication</h1>
              <p className="text-muted-foreground mb-6">
                Authenticate requests by including your API key in the <code>Authorization</code> header using the Bearer scheme.
              </p>
              <CodeBlock
                code={`Authorization: Bearer your-api-key-here`}
                language="http"
              />
              <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Security:</strong> Never expose your API key in client-side code, browser console, or public repositories.
                    Always send it in the Authorization header from server-side code.
                  </span>
                </p>
              </div>
            </section>

            {/* Send Email */}
            <section id="send-email" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Send Email</h2>
              <p className="text-muted-foreground mb-6">
                Send a transactional email using the POST <code>/api/email/send</code> endpoint.
              </p>

              <h3 className="text-lg font-semibold mb-4">Endpoint</h3>
              <CodeBlock code={`POST https://airmailer.vercel.app/api/email/send`} language="http" />

              <h3 className="text-lg font-semibold mt-8 mb-4">Request Fields</h3>
              <div className="rounded-lg border border-border overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Field</th>
                      <th className="text-left px-4 py-3 font-medium">Type</th>
                      <th className="text-left px-4 py-3 font-medium">Required</th>
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestFields.map((field) => (
                      <tr key={field.name} className="border-t border-border">
                        <td className="px-4 py-3">
                          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {field.name}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{field.type}</td>
                        <td className="px-4 py-3">
                          {field.required ? (
                            <span className="text-primary font-medium">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{field.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold mt-8 mb-4">Response</h3>
              <p className="text-muted-foreground mb-4">Success response (200):</p>
              <CodeBlock code={successResponse} language="json" />

              <p className="text-muted-foreground mt-6 mb-4">Error response example:</p>
              <CodeBlock code={errorResponse} language="json" />
            </section>

            {/* Status Codes */}
            <section id="status-codes" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">HTTP Status Codes</h2>
              <p className="text-muted-foreground mb-6">
                The API uses standard HTTP status codes to indicate success or failure.
              </p>

              <div className="space-y-3">
                {statusCodes.map((status) => (
                  <div
                    key={status.code}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border"
                  >
                    <code
                      className={cn(
                        "font-mono text-sm font-bold px-2 py-1 rounded",
                        status.type === "success" && "bg-success/10 text-success",
                        status.type === "error" && "bg-destructive/10 text-destructive",
                        status.type === "warning" && "bg-warning/10 text-warning"
                      )}
                    >
                      {status.code}
                    </code>
                    <p className="text-muted-foreground">{status.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Code Examples */}
            <section id="examples" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Code Examples</h2>
              <p className="text-muted-foreground mb-6">
                Copy-paste ready examples for common programming languages.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { id: "curl", label: "cURL" },
                  { id: "javascript", label: "JavaScript" },
                  { id: "python", label: "Python" },
                  { id: "java", label: "Java" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setActiveExample(lang.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeExample === lang.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {activeExample === "curl" && (
                <CodeBlock code={curlExample} language="bash" showLineNumbers />
              )}
              {activeExample === "javascript" && (
                <CodeBlock code={jsExample} language="javascript" showLineNumbers />
              )}
              {activeExample === "python" && (
                <CodeBlock code={pythonExample} language="python" showLineNumbers />
              )}
              {activeExample === "java" && (
                <CodeBlock code={javaExample} language="java" showLineNumbers />
              )}
            </section>

            {/* Rate Limits */}
            <section id="rate-limits" className="mb-16 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4">Rate Limits & Common Errors</h2>
              <p className="text-muted-foreground mb-6">
                Understanding rate limits and how to handle common errors.
              </p>

              <h3 className="text-lg font-semibold mb-4">Rate Limits</h3>
              <div className="rounded-lg border border-border p-6 mb-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-primary">Unlimited</div>
                    <div className="text-sm text-muted-foreground">API requests</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">10</div>
                    <div className="text-sm text-muted-foreground">Emails per day (free tier)</div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Common Errors</h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="font-mono text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                      INVALID_API_KEY
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    The API key provided in the Authorization header is invalid or expired.
                  </p>
                  <p className="text-sm">
                    <strong>Solution:</strong> Check your key in dashboard or regenerate it.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="font-mono text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                      RATE_LIMIT_EXCEEDED
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Daily limit of 10 emails reached.
                  </p>
                  <p className="text-sm">
                    <strong>Solution:</strong> Wait until tomorrow or create another account.
                  </p>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="font-mono text-xs bg-destructive/10 text-destructive px-2 py-1 rounded">
                      INVALID_RECIPIENT
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    The recipient email is invalid.
                  </p>
                  <p className="text-sm">
                    <strong>Solution:</strong> Validate the email before sending.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}