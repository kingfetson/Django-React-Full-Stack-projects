"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Layout from "@/components/Layout";
import toast from "react-hot-toast";

type VerificationStatus = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const verifyEmail = useCallback(async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/auth/verify-email/?token=${token}`);
      const data = await response.json();
      
      if (data.success) {
        setStatus("success");
        toast.success("Email verified successfully!");
        // Redirect after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setStatus("error");
        setErrorMessage(data.message || "Verification failed. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      const errorMsg = err instanceof Error ? err.message : "Network error. Please check your connection.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  }, [router]);

  useEffect(() => {
    // Use a timeout to make the state update asynchronous
    const timer = setTimeout(() => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        setErrorMessage("No verification token provided. Please check your email link.");
        return;
      }
      
      verifyEmail(token);
    }, 0);

    return () => clearTimeout(timer);
  }, [searchParams, verifyEmail]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {status === "loading" && (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
              <h1 className="text-2xl font-bold mb-4">Verifying Your Email...</h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
              <p className="text-gray-600 mb-4">
                Your email has been successfully verified.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Redirecting you to the login page...
              </p>
              <Link 
                href="/login" 
                className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Go to Login Now
              </Link>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-4">
                {errorMessage || "The verification link is invalid or has expired."}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Please request a new verification email or contact support.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/login" 
                  className="block text-orange-600 hover:underline"
                >
                  Back to Login
                </Link>
                <Link 
                  href="/forgot-password" 
                  className="block text-gray-600 hover:text-gray-800 text-sm"
                >
                  Forgot Password?
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}