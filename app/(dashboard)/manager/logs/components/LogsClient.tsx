"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  ScrollText,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  FileCode,
  Globe,
} from "lucide-react";

interface LogsClientProps {
  initialLogs: any[];
}

export default function LogsClient({ initialLogs }: LogsClientProps) {
  const [logs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const actorName = log.actor?.name || "System";
    const matchesSearch =
      actorName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = entityFilter === "ALL" || log.entity_type === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by actor or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted bg-input border border-input-border rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Entity Type:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-transparent text-heading font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              <option value="PROFILE">Profiles</option>
              <option value="LAB_TEST_TYPE">Lab Test Catalog</option>
              <option value="INVOICE">Invoices</option>
              <option value="STAFF_RESOURCE">Staff Resources</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-hover/50 border-b border-border text-muted text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6 w-10"></th>
                <th className="py-4 px-6">Timestamp</th>
                <th className="py-4 px-6">Actor</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Entity</th>
                <th className="py-4 px-6">Network / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    No system log entries found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <>
                      <tr

                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="hover:bg-hover/20 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6 text-center text-muted">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </td>
                        <td className="py-4 px-6 text-muted text-xs">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span>
                              {new Date(log.timestamp).toLocaleString("en-US", {
                                dateStyle: "short",
                                timeStyle: "medium",
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-heading">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted shrink-0" />
                            <div>
                              <p className="font-medium text-heading">
                                {log.actor?.name || "System Automated"}
                              </p>
                              {log.actor?.role && (
                                <p className="text-xxs text-primary font-bold uppercase mt-0.5 tracking-wider">
                                  {log.actor.role}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-heading font-medium">{log.action}</td>
                        <td className="py-4 px-6">
                          <span className="text-xxs font-extrabold bg-muted/20 text-muted px-2 py-0.5 rounded border border-border uppercase">
                            {log.entity_type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-muted text-xs">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span>{log.ip_address || "Internal Server"}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable change detail panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-hover/10 px-8 py-5">
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-150">
                              <div className="flex items-center gap-2 border-b border-border pb-2">
                                <FileCode className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold text-heading uppercase tracking-wider">
                                  Metadata & State Changes (Entity ID: {log.entity_id || "N/A"})
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xxs font-bold text-muted uppercase tracking-wider mb-1.5">
                                    Before State
                                  </p>
                                  <pre className="text-xs bg-card border border-border rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-body">
                                    {log.before_data
                                      ? JSON.stringify(log.before_data, null, 2)
                                      : "Null (Record Creation)"}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xxs font-bold text-muted uppercase tracking-wider mb-1.5">
                                    After State
                                  </p>
                                  <pre className="text-xs bg-card border border-border rounded-xl p-3 max-h-48 overflow-y-auto font-mono text-body">
                                    {log.after_data
                                      ? JSON.stringify(log.after_data, null, 2)
                                      : "Null (Record Deletion)"}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
