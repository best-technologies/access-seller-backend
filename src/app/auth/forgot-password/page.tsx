"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Mail, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(true);
      form.reset();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Forgot Password
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>

          <Card className="border-none shadow-none">
            <CardContent className="pt-6">
              {success ? (
                <div className="text-center space-y-6">
                  <div className="bg-green-50 text-green-600 p-4 rounded-lg">
                    Password reset link has been sent to your email
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSuccess(false)}
                    className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  >
                    Send another link
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Email address
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Enter your email"
                                className="pl-10 bg-gray-50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                          Sending...
                        </div>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                    <div className="text-sm text-center">
                      <Link
                        href="/login"
                        className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to sign in
                      </Link>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image/Pattern */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-blue-600" />
        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-opacity-10" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-lg text-white">
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="h-8 w-8" />
              <span className="text-2xl font-bold">AccessSellr</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Reset Your Password
            </h2>
            <p className="text-lg text-indigo-100 mb-8">
              Don&apos;t worry! It happens. Please enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">24/7</div>
                <div className="text-indigo-100">Support Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">100%</div>
                <div className="text-indigo-100">Secure Process</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 