"use client";

import { useState } from "react";
import { WeeklyEntry } from "@/types/weekly-view";

/**
 * ShareModal - Modal for sharing an entry
 */
export function ShareModal({
  entry,
  isOpen,
  onClose,
  onShare,
}: {
  entry: WeeklyEntry;
  isOpen: boolean;
  onClose: () => void;
  onShare: (entryId: string, expiresAt?: string) => Promise<{ success: boolean; shareUrl?: string; error?: string }>;
}) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const result = await onShare(entry.id, expiresAt || undefined);
      if (result.success && result.shareUrl) {
        setShareUrl(result.shareUrl);
      }
      if (result.error) {
        alert(result.error);
      }
    } catch (error) {
      console.error("Failed to share entry:", error);
      alert("Failed to create share link");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setExpiresAt("");
    setCopySuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  // Build share URL (will be updated with actual path in production)
  const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareLink = shareUrl ? `${currentUrl}${shareUrl}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">Share Entry</h3>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {shareUrl ? (
            // Share link created state
            <div className="space-y-4">
              <div className="rounded-lg bg-indigo-50 p-4">
                <p className="text-sm text-indigo-700">
                  Share link created successfully!
                </p>
                <p className="mt-1 text-xs text-indigo-600">
                  Anyone with this link can view the entry.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareLink}
                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    {copySuccess ? (
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Copied
                      </span>
                    ) : (
                      "Copy"
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShareUrl(null);
                    setExpiresAt("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Create Another
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // Create share link form
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Share this entry with others. They can view the entry and its images without needing an account.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  No contact information is shared.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500">Expiration (optional)</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-xs text-slate-400">
                  Link will expire on this date. Leave empty for no expiration.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSharing ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    "Create Share Link"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
