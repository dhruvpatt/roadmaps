"use client";

import React from "react";
import PropTypes from "prop-types";
import { ArrowLeft, Copy, UserPlus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToastProvider } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export default function ClassroomHeader({
  title,
  subtitle,
  code,
  teacher,
  subject,
  onInviteClick,
  onSettingsClick,
}) {
  const router = useRouter();
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Copied!", description: "Class code has been copied." });
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy code.",
      });
    }
  };

  return (
    <ToastProvider>
      <header className="bg-gradient-to-r from-amber-500 via-amber-500 to-amber-500 text-white shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Title & Subject */}
          <div className="flex items-start md:items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Go back"
              className="text-white hover:bg-white/25"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight leading-none">
                {title}
              </h1>
              {subtitle && <p className="mt-1">{subtitle}</p>}
              {subject && (
                <Badge className="mt-2 bg-white/20 text-white px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                  {subject}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions & Code */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm uppercase tracking-wide text-white/80">
                Class Code
              </span>
              <div className="mt-1 flex items-center bg-white/20 px-4 py-1 rounded-lg font-mono font-semibold text-lg">
                {code}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="ml-2 text-white hover:bg-white/30"
                  aria-label="Copy code"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/30 py-3">
          <div className="max-w-7xl mx-auto px-8 text-sm text-white/80">
            Teacher: <span className="font-medium text-white">{teacher}</span>
          </div>
        </div>
      </header>
    </ToastProvider>
  );
}

ClassroomHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  code: PropTypes.string.isRequired,
  teacher: PropTypes.string.isRequired,
  subject: PropTypes.string,
  onInviteClick: PropTypes.func,
  onSettingsClick: PropTypes.func,
};

ClassroomHeader.defaultProps = {
  subtitle: "",
  subject: "",
  onInviteClick: () => {},
  onSettingsClick: () => {},
};
