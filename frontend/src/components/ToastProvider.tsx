"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { IconCheck, IconX, IconInfo } from "@/components/Icons";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType = "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: "fixed",
        bottom: "var(--space-xl)",
        right: "var(--space-xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        zIndex: 9999,
        pointerEvents: "none"
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: toast.type === "error" ? "var(--error)" : toast.type === "success" ? "var(--success)" : "var(--bg-card)",
              color: toast.type === "info" ? "var(--text-primary)" : "white",
              padding: "var(--space-sm) var(--space-md)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-lg)",
              minWidth: "250px",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              pointerEvents: "auto",
              animation: "slideIn 0.3s ease-out forwards",
              border: toast.type === "info" ? "1px solid var(--border)" : "none"
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>
              {toast.type === "success" ? <IconCheck size={16} /> : toast.type === "error" ? <IconX size={16} /> : <IconInfo size={16} />}
            </span>
            <span style={{ fontSize: "0.95rem" }}>{toast.message}</span>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
