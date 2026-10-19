import { useRef, useActionState, useState } from "react";
import { useNavigate } from "react-router-dom";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { ThemeToggle } from "../components/molecules/ThemeToggle";
import { LoginForm } from "../components/organisms/Loginform";
import { ShowcasePanel } from "../components/organisms/Showcasepanel";

// 1. Import your Redux hooks and the login thunk
import { useAppDispatch } from "../store/hooks";
import { loginUser } from "../store/slices/authSlice";
import { fetchProperties } from "../store/slices/propertiesSlice";

gsap.registerPlugin(useGSAP);

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch(); // 2. Initialize the dispatch function
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // GSAP Initial Animations
  const { contextSafe } = useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(leftPanelRef.current, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 1.2 })
        .fromTo(".logo-icon", { scale: 0, rotation: -180 }, { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.5)" }, "-=0.9")
        .fromTo(".stagger-el", { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 }, "-=0.6")
        .fromTo(".divider-line", { scaleX: 0 }, { scaleX: 1, duration: 0.8, transformOrigin: "left", ease: "power2.out" }, "-=0.5");
    },
    { scope: containerRef }
  );

  // Triggered on login error
  const shakeForm = contextSafe(() => {
    gsap.fromTo(".form-container", { x: -5 }, { x: 5, duration: 0.06, repeat: 5, yoyo: true, ease: "none", clearProps: "x" });
  });

  // React 19 Action State [state, action, isPending]
  const [formState, formAction, isPending] = useActionState(
    async (_prevState: { error: string | null }, formData: FormData) => {
      // Prevent multiple submissions
      if (isSubmitting) {
        return { error: "Please wait, login is in progress..." };
      }

      setIsSubmitting(true);
      
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      try {
        // 3. Dispatch the thunk and unwrap it to properly trigger the catch block on failure
        await dispatch(loginUser({ email, password })).unwrap();
        await dispatch(fetchProperties({ force: true })).unwrap();
        navigate("/");
        return { error: null };
      } catch (err: any) {
        shakeForm();
        // Since we used rejectWithValue in AuthSlice, err will be our custom string message
        return { error: err?.message || err?.toString() || "Login failed." };
      } finally {
        setIsSubmitting(false);
      }
    },
    { error: null }
  );

  return (
    <div ref={containerRef} className="min-h-screen flex transition-colors duration-500 bg-white dark:bg-slate-950 relative">
      <ThemeToggle />

      <div ref={leftPanelRef} className="w-full lg:w-[45%] flex flex-col relative z-10 bg-white dark:bg-slate-950 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[20px_0_40px_-15px_rgba(0,0,0,0.5)] transition-colors duration-500">
        <div className="p-8 flex items-center gap-3">
          <div className="logo-icon w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <i className="fas fa-building text-sm"></i>
          </div>
          <span className="stagger-el font-bold text-xl text-slate-900 dark:text-white tracking-tight">Maharana Pratap Hostels</span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 md:px-20">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-10">
              <h1 className="stagger-el text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">Admin Portal Access</h1>
              <p className="stagger-el text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
                Welcome to the centralized management system for Maharana Pratap Hostels.
              </p>
              <div className="divider-line h-px w-full bg-slate-200 dark:bg-slate-800 mt-8"></div>
            </div>

            {/* Form component receives action, state, and pending status */}
            <LoginForm action={formAction} error={formState.error} isPending={isPending} />

            <div className="mt-10 text-center stagger-el">
              <p className="text-xs text-slate-400 dark:text-slate-500">&copy; {new Date().getFullYear()} Maharana Pratap Hostels.</p>
            </div>
          </div>
        </div>
      </div>

      <ShowcasePanel />
    </div>
  );
}