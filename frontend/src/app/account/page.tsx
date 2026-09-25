"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  saveCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  type AddressInput
} from "@/lib/api/auth";
import { IconPackage, IconHeart, IconCornerDownLeft } from "@/components/Icons";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman & Nicobar Islands","Chandigarh","Dadra & Nagar Haveli and Daman & Diu","Delhi",
  "Jammu & Kashmir","Ladakh","Lakshadweep","Puducherry"
];

type AddressForm = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  postal_code: string;
  phone: string;
};

const emptyAddressForm: AddressForm = {
  first_name: "", last_name: "", address_1: "", address_2: "",
  city: "", province: "", postal_code: "", phone: ""
};

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidIndianPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone);
  return digits.length === 10;
}

function AddressFormModal({
  title,
  initial,
  onSave,
  onClose,
  isSaving
}: {
  title: string;
  initial: AddressForm;
  onSave: (form: AddressForm) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<AddressForm>(initial);
  const [phoneError, setPhoneError] = useState("");
  const update = (field: keyof AddressForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    const digits = normalizePhoneDigits(form.phone);
    if (!digits) {
      setPhoneError("Phone number is required.");
      return;
    }
    if (!isValidIndianPhone(form.phone)) {
      setPhoneError("Please enter a valid 10-digit Indian phone number.");
      return;
    }
    setPhoneError("");
    onSave({ ...form, phone: digits });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="form-grid" style={{ gap: "12px" }}>
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input className="form-input" value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input className="form-input" value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
          </div>
          <div className="form-group full">
            <label className="form-label">Address Line 1 *</label>
            <input className="form-input" placeholder="House no., street, locality" value={form.address_1} onChange={(e) => update("address_1", e.target.value)} />
          </div>
          <div className="form-group full">
            <label className="form-label">Address Line 2</label>
            <input className="form-input" placeholder="Apartment, landmark (optional)" value={form.address_2} onChange={(e) => update("address_2", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <input className="form-input" value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <select className="form-input" value={form.province} onChange={(e) => update("province", e.target.value)}>
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">PIN Code *</label>
            <input className="form-input" maxLength={6} value={form.postal_code}
              onChange={(e) => update("postal_code", e.target.value.replace(/\D/g, ""))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input
              className={`form-input${phoneError ? " input-error" : ""}`}
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                update("phone", digits);
                if (phoneError) setPhoneError("");
              }}
            />
            {phoneError && <p style={{ color: "var(--error)", fontSize: "0.78rem", marginTop: "4px" }}>{phoneError}</p>}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button
            className="btn"
            disabled={isSaving || !form.first_name || !form.last_name || !form.address_1 || !form.city || !form.postal_code || !form.phone}
            onClick={handleSave}
          >
            {isSaving ? "Saving…" : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, token, isLoading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Address management state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddressForm, setEditingAddressForm] = useState<AddressForm>(emptyAddressForm);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (isClient && !isLoading && !user) router.push("/login?next=%2Faccount");
  }, [user, isLoading, router, isClient]);

  if (!isClient || isLoading || !user) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading your account...
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  const handleSaveNewAddress = async (form: AddressForm) => {
    if (!token) return;
    setIsSavingAddress(true);
    setAddressError("");
    setAddressSuccess("");
    try {
      const input: AddressInput = {
        first_name: form.first_name,
        last_name: form.last_name,
        address_1: form.address_1,
        address_2: form.address_2 || undefined,
        city: form.city,
        province: form.province || undefined,
        postal_code: form.postal_code,
        country_code: "in",
        phone: form.phone || undefined,
      };
      await saveCustomerAddress(token, input);
      await refreshUser();
      setShowAddressForm(false);
      setAddressSuccess("Address saved successfully.");
      setTimeout(() => setAddressSuccess(""), 3000);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Failed to save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleUpdateAddress = async (form: AddressForm) => {
    if (!token || !editingAddressId) return;
    setIsSavingAddress(true);
    setAddressError("");
    setAddressSuccess("");
    try {
      await updateCustomerAddress(token, editingAddressId, {
        first_name: form.first_name,
        last_name: form.last_name,
        address_1: form.address_1,
        address_2: form.address_2 || undefined,
        city: form.city,
        province: form.province || undefined,
        postal_code: form.postal_code,
        country_code: "in",
        phone: form.phone || undefined,
      });
      await refreshUser();
      setEditingAddressId(null);
      setAddressSuccess("Address updated successfully.");
      setTimeout(() => setAddressSuccess(""), 3000);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Failed to update address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!token) return;
    setDeletingAddressId(addressId);
    setAddressError("");
    try {
      await deleteCustomerAddress(token, addressId);
      await refreshUser();
      setAddressSuccess("Address deleted.");
      setTimeout(() => setAddressSuccess(""), 3000);
    } catch (err) {
      setAddressError(err instanceof Error ? err.message : "Failed to delete address.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const openEditAddress = (addr: NonNullable<typeof user.addresses>[number]) => {
    setEditingAddressId(addr.id || "");
    setEditingAddressForm({
      first_name: addr.first_name || "",
      last_name: addr.last_name || "",
      address_1: addr.address_1 || "",
      address_2: addr.address_2 || "",
      city: addr.city || "",
      province: addr.province || "",
      postal_code: addr.postal_code || "",
      phone: addr.phone || "",
    });
  };

  return (
    <section className="account-shell">
      <div className="account-top-card">
        <div className="account-top-left">
          <div className="account-avatar">{initials}</div>
          <div>
            <span className="hero-tag">My Account</span>
            <h1 className="page-title account-title">{user.firstName} {user.lastName}</h1>
            <p className="text-secondary">{user.email}</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={logout}>Sign Out</button>
      </div>

      <div className="account-layout">
        {/* Sidebar — Profile Info */}
        <aside className="account-panel account-profile-panel">
          <h3 className="account-panel-title">Profile</h3>
          <div className="account-field">
            <span className="account-field-label">Full Name</span>
            <strong>{user.firstName} {user.lastName}</strong>
          </div>
          <div className="account-field">
            <span className="account-field-label">Email</span>
            <strong>{user.email}</strong>
          </div>
          {user.phone && (
            <div className="account-field">
              <span className="account-field-label">Phone</span>
              <strong>{user.phone}</strong>
            </div>
          )}
          <div className="account-field">
            <span className="account-field-label">Member Since</span>
            <strong>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
          </div>

          <hr className="divider" />

          <h3 className="account-panel-title">Security</h3>
          <p className="text-muted" style={{ marginBottom: "var(--space-md)", fontSize: "0.84rem" }}>Update your account password.</p>
          <Link href="/account/change-password" className="btn btn-outline btn-full">
            Change Password
          </Link>
        </aside>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
          {/* Quick Links */}
          <div className="account-panel">
            <h3 className="account-panel-title">My Stuff</h3>
            <div className="account-quick-links">
              <Link href="/orders" className="account-quick-link">
                <span className="account-quick-link-icon"><IconPackage size={20} /></span>
                <div>
                  <p className="account-quick-link-title">My Orders</p>
                  <p className="account-quick-link-desc">View order history, track shipments, manage exchanges</p>
                </div>
                <span className="account-quick-link-arrow">→</span>
              </Link>
              <Link href="/wishlist" className="account-quick-link">
                <span className="account-quick-link-icon"><IconHeart size={20} /></span>
                <div>
                  <p className="account-quick-link-title">Wishlist</p>
                  <p className="account-quick-link-desc">View your saved items</p>
                </div>
                <span className="account-quick-link-arrow">→</span>
              </Link>
              <Link href="/returns" className="account-quick-link">
                <span className="account-quick-link-icon"><IconCornerDownLeft size={20} /></span>
                <div>
                  <p className="account-quick-link-title">Exchange Policy</p>
                  <p className="account-quick-link-desc">Learn about our 48-hour exchange policy</p>
                </div>
                <span className="account-quick-link-arrow">→</span>
              </Link>
            </div>
          </div>

          {/* Addresses */}
          <div className="account-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="account-panel-title" style={{ borderBottom: "none", paddingBottom: 0 }}>Saved Addresses</h3>
              <button className="btn btn-secondary" onClick={() => { setShowAddressForm(true); setAddressError(""); }}>
                + Add Address
              </button>
            </div>

            {addressSuccess && (
              <div style={{ padding: "8px 12px", background: "rgba(5,150,105,0.1)", color: "#059669", fontSize: "0.84rem", borderRadius: "4px" }}>
                {addressSuccess}
              </div>
            )}
            {addressError && (
              <div style={{ padding: "8px 12px", background: "rgba(220,38,38,0.1)", color: "#dc2626", fontSize: "0.84rem", borderRadius: "4px" }}>
                {addressError}
              </div>
            )}

            {user.addresses && user.addresses.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-md)" }}>
                {user.addresses.map((addr, i) => (
                  <div key={addr.id || i} className="account-address-item" style={{ position: "relative" }}>
                    {(addr.first_name || addr.last_name) && (
                      <p className="account-address-name">{[addr.first_name, addr.last_name].filter(Boolean).join(" ")}</p>
                    )}
                    {addr.address_1 && <p className="account-address-line">{addr.address_1}</p>}
                    {addr.address_2 && <p className="account-address-line">{addr.address_2}</p>}
                    <p className="account-address-line">
                      {[addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ")}
                    </p>
                    {addr.phone && <p className="account-address-line">Phone: {addr.phone}</p>}
                    {addr.country_code && (
                      <p className="account-address-country">{addr.country_code.toUpperCase()}</p>
                    )}
                    <div className="account-address-actions">
                      {addr.id && (
                        <>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "4px 12px", fontSize: "0.76rem" }}
                            onClick={() => openEditAddress(addr)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: "4px 12px", fontSize: "0.76rem", color: "var(--error)", borderColor: "var(--error)" }}
                            onClick={() => { if (confirm("Delete this address?")) handleDeleteAddress(addr.id!); }}
                            disabled={deletingAddressId === addr.id}
                          >
                            {deletingAddressId === addr.id ? "…" : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted" style={{ fontSize: "0.84rem" }}>
                No saved addresses yet. Add one to speed up your checkout.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressForm && (
        <AddressFormModal
          title="Add New Address"
          initial={{ ...emptyAddressForm, first_name: user.firstName, last_name: user.lastName }}
          onSave={handleSaveNewAddress}
          onClose={() => setShowAddressForm(false)}
          isSaving={isSavingAddress}
        />
      )}

      {/* Edit Address Modal */}
      {editingAddressId && (
        <AddressFormModal
          title="Edit Address"
          initial={editingAddressForm}
          onSave={handleUpdateAddress}
          onClose={() => setEditingAddressId(null)}
          isSaving={isSavingAddress}
        />
      )}
    </section>
  );
}
