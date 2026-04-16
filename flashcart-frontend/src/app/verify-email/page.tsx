"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import toast from "react-hot-toast";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(`${apiUrl}/api/auth/verify-email/?token=${token}`);
        const data = await response.json();
        
        if (data.success) {
          setStatus("success");
          toast.success("Email verified successfully!");
          setTimeout(() => router.push("/login"), 3000);
        } else {
          setStatus("error");
        }
      } catch (error) {
        setStatus("error");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {status === "loading" && (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
              <h1 className="text-2xl font-bold mb-4">Verifying Your Email...</h1>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You will be redirected to the login page.
              </p>
              <Link href="/login" className="text-orange-600 hover:underline">
                Go to Login
              </Link>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">
                The verification link is invalid or has expired.
              </p>
              <Link href="/login" className="text-orange-600 hover:underline">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}