"use client";

import { useState } from "react";
import {
  FileText,
  Search,
  Calendar,
  Download,
  ExternalLink,
  Eye,
} from "lucide-react";

interface Report {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  created_at: string;
  doctor_name: string;
}

interface ReportsClientProps {
  initialReports: Report[];
}

export default function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports] = useState<Report[]>(initialReports);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = reports.filter((report) => {
    const query = searchQuery.toLowerCase();
    return (
      report.title.toLowerCase().includes(query) ||
      (report.description && report.description.toLowerCase().includes(query)) ||
      report.doctor_name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search reports by title or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-input border border-input-border text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs font-semibold text-muted hidden sm:inline-block">
          Showing {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
          <FileText className="w-12 h-12 text-muted/40" />
          <p className="text-sm font-medium">No reports found.</p>
          <p className="text-xs">Your clinical reports and lab results will appear here once generated.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-heading text-sm md:text-base leading-tight">
                      {report.title}
                    </h3>
                    <p className="text-[11px] text-muted font-medium mt-0.5">
                      Provided by: <span className="text-heading">{report.doctor_name}</span>
                    </p>
                  </div>
                </div>

                {/* Description */}
                {report.description && (
                  <p className="text-xs text-body leading-relaxed pl-1">
                    {report.description}
                  </p>
                )}

                {/* Meta details */}
                <div className="flex items-center gap-1.5 text-xs text-muted pl-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Uploaded on:{" "}
                    <strong className="text-heading font-medium">
                      {new Date(report.created_at).toLocaleDateString([], {
                        dateStyle: "medium",
                      })}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-hover hover:bg-hover-dark text-heading text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Report</span>
                </a>
                <a
                  href={report.file_url}
                  download
                  className="flex items-center justify-center p-2 bg-primary/10 hover:bg-primary/15 text-primary rounded-xl transition-all cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
