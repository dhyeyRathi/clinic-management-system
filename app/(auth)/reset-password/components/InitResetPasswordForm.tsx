"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordSchema } from "../schema";
import { resetPasswordAction } from "../actions";
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InitResetPasswordFormProps {
  role: string;
}

const InitResetPasswordForm = ({ role }: InitResetPasswordFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password") || "";

  const passwordCriteria = [
    { label: "At least 8 characters", valid: passwordValue.length >= 8 },
    { label: "At least one uppercase letter (A-Z)", valid: /[A-Z]/.test(passwordValue) },
    { label: "At least one lowercase letter (a-z)", valid: /[a-z]/.test(passwordValue) },
    { label: "At least one number (0-9)", valid: /[0-9]/.test(passwordValue) },
    { label: "At least one special character (e.g. @, #, $, etc.)", valid: /[^a-zA-Z0-9]/.test(passwordValue) },
  ];

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      const response = await resetPasswordAction(data);
      if (response.success) {
        toast.success("Password updated successfully! Redirecting to your dashboard...");
        
        const dashboards: Record<string, string> = {
          CLIENT: "/client",
          DOCTOR: "/doctor",
          RECEPTIONIST: "/receptionist",
          LAB_MANAGER: "/lab-manager",
          MANAGER: "/manager"
        };
        const targetPath = dashboards[role] || "/client";
        
        setTimeout(() => {
          router.push(targetPath);
          router.refresh();
        }, 1500);
      } else {
        toast.error(response.error || "Failed to update password.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <>
      

      <div className="bg-card/60 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-8 max-w-md w-full transition-all duration-300">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold mb-3">
            First Time Login
          </span>
          <h2 className="text-2xl font-extrabold text-heading tracking-tight mb-2">
            Secure Your Account
          </h2>
          <p className="text-body text-sm">
            Please set a new secure password before accessing your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-heading mb-1.5">
              New Password
            </label>
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
            {passwordValue.length > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-hover/50 border border-border/60 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-semibold text-heading mb-1 font-sans">Password requirements:</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {passwordCriteria.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span
                        className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                          item.valid ? "bg-success shadow-[0_0_8px_rgba(22,163,74,0.4)]" : "bg-muted"
                        }`}
                      />
                      <span
                        className={`transition-colors duration-300 ${
                          item.valid ? "text-success font-medium" : "text-muted"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors.password && (
              <p className="text-danger text-xs mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-heading mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                <Lock className="w-5 h-5" />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                disabled={isSubmitting}
                placeholder="••••••••"
                className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-input border ${
                  errors.confirmPassword ? "border-danger focus:ring-danger/20" : "border-input-border focus:ring-primary/20"
                } text-foreground placeholder:text-muted focus:outline-none focus:ring-4 focus:border-primary transition-all duration-200 disabled:opacity-50`}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-danger text-xs mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white dark:text-background font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating password...
              </>
            ) : (
              <>
                Set Password & Proceed
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default InitResetPasswordForm;
