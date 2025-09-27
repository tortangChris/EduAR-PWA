import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

      // Show success modal
      setShowSuccess(true);

      // Redirect after 2s
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/auth/login");
      }, 2000);
    }, 2000);
  };

  const goToLogin = () => {
    if (!loading) navigate("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-600 to-purple-900 flex flex-col justify-between relative">
      {/* Logo */}
      <div className="text-center pt-10 relative flex flex-col items-center">
        <img
          src="/icons/EduARLogo.png"
          alt="EduAR Logo"
          className="mx-auto w-42 h-42 mb-2 relative z-10"
        />
      </div>

      {/* Form Container */}
      <div className="w-full bg-base-100 rounded-t-3xl px-6 py-8 h-[70vh] shadow-[0_-12px_30px_-5px_rgba(0,0,0,0.5)] relative z-0">
        <h2 className="text-3xl font-bold text-center mb-10 font-serif text-indigo-600">
          Create Account
        </h2>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Username</span>
            </label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input input-bordered w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              required
              disabled={loading}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Gmail</span>
            </label>
            <input
              type="email"
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              required
              disabled={loading}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full mt-2 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-300">
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

      {/* Success Modal */}
      {showSuccess && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/20 rounded-3xl p-10 flex flex-col items-center backdrop-blur-md shadow-lg">
            <Check className="w-24 h-24 text-green-500 mb-6" />
            <h3 className="text-2xl font-bold mb-2 text-center text-white">
              Sign Up Successful!
            </h3>
            <p className="text-md text-center text-white/80">
              Redirecting to login...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;
