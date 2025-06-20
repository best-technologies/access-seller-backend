"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tokenManager } from "@/services/api";

export default function VerifyOtpPage() {
    const { login, handleAuthStateChange } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const role = searchParams.get("role") || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [resending, setResending] = useState(false);

  // Countdown effect
  useEffect(() => {
    if (resendTimer === 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // 1. Call OTP verification endpoint
      const response = await api.auth.verifyOTP(otp, email);

      // 2. Get the access token from the response
      const accessToken = response.data?.access_token;
      if (!accessToken) throw new Error("No access token returned after OTP verification.");

      // 3. Store the token
      tokenManager.set(accessToken);

      // 4. Fetch user profile
      const userProfile = await api.user.getProfile();
      if (!userProfile.success) {
        throw new Error(userProfile.message || "Failed to fetch user details");
      }

      // 5. Set auth state (using login logic)
      handleAuthStateChange(true, userProfile.data);

      // 6. Redirect to home/dashboard
      router.replace("/");

      toast.success("OTP verified! You are now logged in.");
    } catch (error: any) {
      setError(error?.message || "Failed to verify OTP");
      toast.error(error?.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.auth.resendLoginOtp(email);
      toast.success("OTP resent to your email.");
      setResendTimer(30);
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Verify Your Identity
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter the OTP sent to your email to continue
            </p>
          </div>

          <Card className="border-none shadow-none">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      disabled
                      className="pl-10 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 cursor-not-allowed"
                    />
                  </div>
                  {role && (
                    <div className="text-xs text-indigo-600 mt-1">Role: {role}</div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">OTP</label>
                  <Input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Verifying...
                    </div>
                  ) : (
                    "Verify"
                  )}
                </Button>
                <div className="text-center mt-4">
                  <span className="text-sm text-gray-600">Didn't get the OTP?</span>
                  <Button
                    type="button"
                    variant="link"
                    className="ml-2 p-0 h-auto text-indigo-600 hover:text-indigo-700 font-medium text-sm disabled:opacity-50 disabled:pointer-events-none"
                    onClick={handleResend}
                    disabled={resendTimer > 0 || resending}
                  >
                    {resending
                      ? "Resending..."
                      : resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend OTP"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Branding/Info */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-600" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-opacity-10" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-white">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="h-8 w-8" />
              <span className="text-2xl font-bold">AccessSellr Admin</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Secure Access for Privileged Users
            </h2>
            <p className="text-lg text-indigo-100 mb-8">
              For your security, we require OTP verification for admin and privileged accounts. Please check your email for the code and enter it here to continue.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">100%</div>
                <div className="text-indigo-100">Secure Login</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">24/7</div>
                <div className="text-indigo-100">Admin Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 