"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterSchema } from "../schema";
import { registerAction } from "../actions";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const RegistrationForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
    } = useForm<RegisterSchema>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
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

    const onSubmit = async (data: RegisterSchema) => {
        try {
            const response = await registerAction(data);
            if (response.success) {
                toast.success("User registered, please confirm your email address before logging in");
                setIsSuccess(true);
                reset();
            } else {
                toast.error(response.error || "Failed to register.");
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
                <h2 className="text-2xl font-bold text-heading mb-2">User Registered!</h2>
                <p className="text-body text-sm mb-8">
                    User registered, please confirm your email address before logging in.
                </p>
                <Link
                    href="/login"
                    className="w-full bg-primary hover:bg-primary-hover text-white dark:text-background font-semibold py-3.5 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                >
                    Go to Sign In
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <>
            

            <div className="bg-card/60 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-8 max-w-md w-full transition-all duration-300">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-heading tracking-tight mb-2">
                        Create Account
                    </h2>

                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Name Field */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-heading mb-1.5">
                            Full Name
                        </label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                                <User className="w-5 h-5" />
                            </span>
                            <input
                                id="name"
                                type="text"
                                disabled={isSubmitting}
                                placeholder="John Doe"
                                className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-input border ${errors.name ? "border-danger focus:ring-danger/20" : "border-input-border focus:ring-primary/20"
                                    } text-foreground placeholder:text-muted focus:outline-none focus:ring-4 focus:border-primary transition-all duration-200 disabled:opacity-50`}
                                {...register("name")}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-danger text-xs mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

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
                                placeholder="johndoe@example.com"
                                className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-input border ${errors.email ? "border-danger focus:ring-danger/20" : "border-input-border focus:ring-primary/20"
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
                        <label htmlFor="password" className="block text-sm font-semibold text-heading mb-1.5">
                            Password
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
                                className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-input border ${errors.password ? "border-danger focus:ring-danger/20" : "border-input-border focus:ring-primary/20"
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
                                <p className="text-xs font-semibold text-heading mb-1">Password requirements:</p>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {passwordCriteria.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                                                item.valid ? "bg-success shadow-[0_0_8px_rgba(22,163,74,0.4)]" : "bg-muted"
                                            }`} />
                                            <span className={`transition-colors duration-300 ${
                                                item.valid ? "text-success font-medium" : "text-muted"
                                            }`}>
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
                            Confirm Password
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
                                className={`w-full pl-10 pr-11 py-3 rounded-2xl bg-input border ${errors.confirmPassword ? "border-danger focus:ring-danger/20" : "border-input-border focus:ring-primary/20"
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
                        className="w-full bg-primary hover:bg-primary-hover text-white dark:text-background font-semibold py-3.5 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                Register Account
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-divider text-center">
                    <p className="text-body text-sm">
                        Already have an account?{" "}
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

export default RegistrationForm;