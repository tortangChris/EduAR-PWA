import React from "react";
import { useNavigate } from "react-router-dom";

const LogIn = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex flex-col justify-between">
      {/* Logo and Title */}
      <div className="text-center pt-10 relative flex flex-col items-center">
        {/* Circular rotating dotted border */}
        <div className="absolute w-30 h-30 rounded-full border-3 border-dotted border-white animate-spin-slow"></div>

        {/* Logo */}
        <img
          src="/icons/eduar1.png"
          alt="EduAR Logo"
          className="mx-auto w-35 h-30 mb-3 ml-28 relative z-10"
        />
        <h1 className="text-2xl font-bold text-white relative z-10">EduAR</h1>
      </div>

      {/* Full-width Bottom Container */}
      <div className="w-full bg-base-100 shadow-xl rounded-t-3xl px-6 py-8 h-[70vh]">
        <h2 className="text-3xl font-bold text-center mb-6">Welcome Back</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Gmail</span>
            </label>
            <input
              type="email"
              placeholder="name@gmail.com"
              className="input input-bordered w-full focus:outline-none focus:ring-1 focus:border-primary/50"
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input input-bordered w-full focus:outline-none focus:ring-1 focus:border-primary/50"
              required
            />
          </div>

          <div className="flex justify-end text-sm">
            <a href="#" className="link link-hover text-primary">
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-2">
            Log In
          </button>
        </form>

        <p className="text-sm text-center mt-6">
          Don't have an account?{" "}
          <a href="#" className="link link-secondary">
            Sign up
          </a>
        </p>
      </div>

      {/* Custom animation for slow spin */}
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LogIn;
