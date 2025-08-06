import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const newUser = { username, email, password };
      localStorage.setItem("user", JSON.stringify(newUser));

      setLoading(false);
      alert("Account registered!");
      navigate("/auth/login");
    }, 3000);
  };

  const goToLogin = () => {
    if (!loading) navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-accent flex flex-col justify-between">
      {/* Logo and Title */}
      <div className="text-center pt-10 relative flex flex-col items-center">
        <div className="absolute w-30 h-30 rounded-full border-3 border-dotted border-white animate-spin-slow"></div>

        <img
          src="/icons/eduar1.png"
          alt="EduAR Logo"
          className="mx-auto w-35 h-30 mb-3 ml-28 relative z-10"
        />
        <h1 className="text-2xl font-bold text-white relative z-10">EduAR</h1>
      </div>

      <div className="w-full bg-base-100 shadow-xl rounded-t-3xl px-6 py-8 h-[70vh]">
        <h2 className="text-3xl font-bold text-center mt-3 mb-10 font-serif">
          Create Account
        </h2>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Username</span>
            </label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-bordered w-full focus:outline-none focus:ring-1 focus:border-primary/50"
              required
              disabled={loading}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Gmail</span>
            </label>
            <input
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full focus:outline-none focus:ring-1 focus:border-primary/50"
              required
              disabled={loading}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full focus:outline-none focus:ring-1 focus:border-primary/50"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center mt-6">
          Already have an account?{" "}
          <button
            type="button"
            onClick={goToLogin}
            className="link link-secondary"
            disabled={loading}
          >
            Log In
          </button>
        </p>
      </div>

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

export default SignUp;
