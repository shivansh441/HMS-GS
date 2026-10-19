import type { InputHTMLAttributes, ReactNode } from "react";
import type { PropertyRef } from "./account.types";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: string;
  rightElement?: ReactNode;
}

export interface AuthUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  managedProperties?: PropertyRef[];
  staffProperties?: PropertyRef[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  error: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  hasAttemptedUserFetch: boolean;
}

