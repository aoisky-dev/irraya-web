"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getMe } from "@/lib/api/auth";
import { jwtDecode } from "jwt-decode";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");
    
    if (errorParam) {
      router.push("/login?error=auth_failed");
      return;
    }

    if (code && state) {
      hasFetched.current = true;
      const backendUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BASE_URL || "http://localhost:9000"}/auth/customer/google/callback${window.location.search}`;
      
      fetch(backendUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      })
      .then(res => res.json())
      .then(async (data) => {
        let token = data.token;
        if (token) {
          try {
            // Check if actor_id is empty (Medusa v2 behavior for new identities)
            const decoded: any = jwtDecode(token);
            if (!decoded.actor_id) {
              const userMeta = decoded.user_metadata || {};
              // Attempt to create the customer and link identity
              const customerRes = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BASE_URL || "http://localhost:9000"}/store/customers`, {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${token}`, 
                  'Content-Type': 'application/json',
                  'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || ''
                },
                body: JSON.stringify({
                  email: userMeta.email || "google@example.com",
                  first_name: userMeta.given_name || "Google",
                  last_name: userMeta.family_name || "User"
                })
              });
              
              if (!customerRes.ok) {
                // If customer already exists, call our custom link endpoint
                const linkRes = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BASE_URL || "http://localhost:9000"}/store/auth/google/link`, {
                  method: 'POST',
                  headers: { 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json',
                    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY || ''
                  }
                });
                if (linkRes.ok) {
                  const linkData = await linkRes.json();
                  if (linkData.token) token = linkData.token;
                } else {
                  console.error("Failed to link customer for existing identity");
                }
              } else {
                // Refresh the token to get the populated actor_id for newly created customer
                const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BASE_URL || "http://localhost:9000"}/auth/token/refresh`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                
                if (refreshRes.ok) {
                  const refreshData = await refreshRes.json();
                  if (refreshData.token) token = refreshData.token;
                }
              }
            }

            const user = await getMe(token);
            login(token, user);
            const nextPath = sessionStorage.getItem("post_login_redirect") || "/";
            sessionStorage.removeItem("post_login_redirect");
            router.push(nextPath);
          } catch (err) {
            console.error("Failed to fetch user profile", err);
            router.push("/login?error=auth_failed");
          }
        } else {
          console.error("Backend responded without token:", data);
          router.push("/login?error=no_token");
        }
      })
      .catch(err => {
        console.error("Failed to process Google callback", err);
        router.push("/login?error=auth_failed");
      });
    } else {
      router.push("/login?error=invalid_callback");
    }
  }, [searchParams, login, router]);

  return <div style={{ padding: "2rem", textAlign: "center" }}>Authenticating with Google...</div>;
}

function GoogleCallbackPageContent() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleCallbackPageContent />
    </Suspense>
  );
}
