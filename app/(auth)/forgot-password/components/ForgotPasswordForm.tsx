"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordSchema } from "../schema";
import { forgotPasswordAction } from "../actions";
import { Mail, CheckCircle, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const ForgotPasswordForm = () => {
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    try {
      const response = await forgotPasswordAction(data);
      if (response.success) {
        toast.success("Reset link sent!");
        setIsSuccess(true);
        reset();
      } else {
        toast.error(response.error || "Failed to send reset link.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-card/60 backdrop-blur-md border border-border shadow-2xl rounded-3xl max-w-md w-full animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-heading mb-2">Check Your Email</h2>
        <p className="text-body text-sm mb-8">
          We have sent a secure password reset link to your email address. Please follow the instructions in the email to set a new password.
        </p>
        <Link
          href="/login"
          className="w-full bg-primary hover:bg-primary-hover text-white dark:text-background font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      

      <div className="bg-card/60 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-8 max-w-md w-full transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-heading tracking-tight mb-2">
            Reset Password
          </h2>
          <p className="text-body text-sm">
            Enter your registered email address and we will send you a link to reset your password.
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white dark:text-background font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending link...
              </>
            ) : (
              <>
                Send Reset Link
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-divider text-center">
          <p className="text-body text-sm">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-hover font-semibold transition-colors duration-200"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordForm;
