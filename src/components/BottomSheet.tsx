"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const portalRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    portalRef.current = document.body;
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !portalRef.current) return null;

  return createPortal(
    <div
      className="sheet-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="sheet-content">
        <div className="sheet-handle" />
        <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
        {children}
      </div>
    </div>,
    portalRef.current
  );
}