"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginSchema } from "../schema";
import { loginAction } from "../actions";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, LogIn } from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      const response = await loginAction(data);
      if (response.success) {
        toast.success("Welcome back! Signing you in...");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(response.error || "Invalid credentials.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <div className="bg-card/60 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-8 max-w-md w-full transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-heading tracking-tight mb-2">
            Welcome Back
          </h2>
          <p className="text-body text-sm">
            Sign in to access your dashboard, health records, and appointments.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-heading mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                <Mail className="w-5 h-5" />
              </span>
              <input
                id="email"
                type="email"
                disabled={isSubmitting}
                placeholder="you@example.com"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-input border ${
                  errors.email ? "border-danger focus:ring-danger/20" : "border-input-border focus:ring-primary/20"
                } text-foreground placeholder:text-muted focus:outline-none focus:ring-4 focus:border-primary transition-all duration-200 disabled:opacity-50`}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-danger text-xs mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-heading">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors duration-200"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                disabled={isSubmitting}
                placeholder="••••••••"
                className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-input border ${
                  errors.password ? "border-danger focus:ring-danger/20" : "border-input-border focus:ring-primary/20"
                } text-foreground placeholder:text-muted focus:outline-none focus:ring-4 focus:border-primary transition-all duration-200 disabled:opacity-50`}
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-danger text-xs mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white dark:text-background font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-divider text-center">
          <p className="text-body text-sm">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary-hover font-semibold transition-colors duration-200"
            >
              Register Now
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginForm;
