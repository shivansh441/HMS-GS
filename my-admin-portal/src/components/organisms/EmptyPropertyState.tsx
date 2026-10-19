import { NavLink } from "react-router-dom";

export function EmptyPropertyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6">
      <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-5xl animate-pulse shadow-sm">
        🏨
      </div>
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">Ready to Begin?</h1>
      <p className="text-slate-500 font-medium max-w-sm">
        Select an existing property or create a new one to start managing your operations.
      </p>
      <NavLink
        to="/admin"
        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
      >
        Go to Properties
      </NavLink>
    </div>
  );
}