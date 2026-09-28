"use client";

import { useState } from "react";
import { IconTruck, IconCheck, IconX } from "@/components/Icons";

export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; date?: string } | null>(null);

  const checkPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      setResult({ success: false, message: "Please enter a valid 6-digit pincode." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BASE_URL || "https://api.irraya.com";
      const response = await fetch(`${baseUrl}/store/shiprocket/serviceability?delivery_postcode=${pincode}&weight=0.5&cod=0`, {
        headers: {
          "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || ""
        }
      });
      if (!response.ok) throw new Error("API failed");
      
      const data = await response.json();
      
      if (data.status === 200 && data.data?.available_courier_companies?.length > 0) {
        const fastestCourier = data.data.available_courier_companies.sort(
          (a: any, b: any) => a.etd_hours - b.etd_hours
        )[0];
        
        const etdStr = fastestCourier.etd;
        let displayStr = `Estimated delivery by ${etdStr}`;
        const etdDate = new Date(etdStr);
        if (!isNaN(etdDate.getTime())) {
          const maxDate = new Date(etdDate);
          maxDate.setDate(maxDate.getDate() + 2);
          const formatDate = (d: Date) => d.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
          displayStr = `Estimated delivery by ${formatDate(etdDate)} to ${formatDate(maxDate)}`;
        }
        
        setResult({ 
          success: true, 
          message: displayStr 
        });
      } else {
        setResult({ success: false, message: "Sorry, delivery is not available to this pincode." });
      }
    } catch (error) {
      setResult({ success: false, message: "Failed to check serviceability. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pincode-checker" style={{ marginTop: "1rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", fontWeight: 500 }}>
        <IconTruck size={18} /> Check Delivery Options
      </div>
      <form onSubmit={checkPincode} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Enter Pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          style={{ flex: 1, padding: "0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
        />
        <button type="submit" disabled={loading} className="btn" style={{ padding: "0.5rem 1rem" }}>
          {loading ? "Checking..." : "Check"}
        </button>
      </form>
      
      {result && (
        <div style={{ 
          marginTop: "0.75rem", 
          fontSize: "0.9rem", 
          display: "flex", 
          alignItems: "center", 
          gap: "0.25rem",
          color: result.success ? "var(--success)" : "var(--error)"
        }}>
          {result.success ? <IconCheck size={16} /> : <IconX size={16} />}
          {result.message}
        </div>
      )}
    </div>
  );
}
