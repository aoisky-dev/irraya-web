import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      width: "100vw", height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 99999,
      padding: "20px"
    }}>
      <div style={{
        background: "var(--bg-primary, #ffffff)",
        padding: "24px",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        maxWidth: "400px",
        width: "100%",
        textAlign: "center"
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "1.2rem", fontWeight: 600 }}>Confirm Action</h3>
        <p style={{ margin: "0 0 24px 0", fontSize: "0.95rem", color: "var(--text-secondary, #666)" }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button 
            onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: "4px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{ padding: "8px 16px", borderRadius: "4px", border: "none", background: "var(--error, #dc2626)", color: "white", cursor: "pointer", fontWeight: 500 }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
