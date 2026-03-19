import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Search, Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { TableRowSkeleton } from "@/components/SkeletonLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { authenticatedFetch } from "@/lib/api";

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: "success" | "failed";
  timestamp: string;
  messageId: string;
}

// Define the shape of the API response (no any!)
interface LogsResponse {
  success: boolean;
  logs: Array<{
    id: number | string;
    to: string;
    subject: string | null;
    status: "success" | "failed";
    timestamp: string;
    messageId: string | null;
  }>;
  message?: string;
}

const statusColors: Record<EmailLog["status"], string> = {
  success: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Logs() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch("/api/logs/get");

      if (!response) {
        setLogs([]);
        return;
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response for logs");
      }

      const data: LogsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch logs");
      }

      // Map backend logs to frontend shape (no any!)
      const formattedLogs: EmailLog[] = data.logs.map((log) => ({
        id: String(log.id),
        to: log.to,
        subject: log.subject || "No subject",
        status: log.status,
        timestamp: log.timestamp,
        messageId: log.messageId || `msg_${log.id}`,
      }));

      setLogs(formattedLogs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.to.toLowerCase().includes(search.toLowerCase()) ||
      log.subject.toLowerCase().includes(search.toLowerCase()) ||
      log.messageId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    fetchLogs();
  };

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Email Logs</h1>
            <p className="text-muted-foreground">
              View and track all your sent emails
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, subject, or message ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Table Header */}
        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b border-border">
          <div className="col-span-3">Recipient</div>
          <div className="col-span-4">Subject</div>
          <div className="col-span-2">Message ID</div>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1">Status</div>
        </div>

        {/* Loading State */}
        {loading && (
          <div>
            {[...Array(5)].map((_, i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLogs.length === 0 && (
          <EmptyState
            icon={Mail}
            title="No emails found"
            description={
              search || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "You haven't sent any emails yet"
            }
            action={
              search || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Data */}
        {!loading && filteredLogs.length > 0 && (
          <div>
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="grid sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <div className="sm:col-span-3">
                  <span className="sm:hidden text-xs text-muted-foreground">To: </span>
                  <span className="font-medium truncate">{log.to}</span>
                </div>
                <div className="sm:col-span-4">
                  <span className="sm:hidden text-xs text-muted-foreground">Subject: </span>
                  <span className="text-muted-foreground truncate">{log.subject}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="sm:hidden text-xs text-muted-foreground">ID: </span>
                  <code className="font-mono text-xs text-muted-foreground">{log.messageId}</code>
                </div>
                <div className="sm:col-span-2">
                  <span className="sm:hidden text-xs text-muted-foreground">Time: </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="sm:col-span-1">
                  <Badge
                    variant="outline"
                    className={`${statusColors[log.status]} capitalize`}
                  >
                    {log.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pagination hint */}
      {!loading && filteredLogs.length > 0 && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} emails
        </div>
      )}
    </div>
  );
}