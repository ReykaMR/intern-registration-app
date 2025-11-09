import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    isAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isAdmin) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email dan password harus diisi");
      setLoading(false);
      return;
    }

    const result = await login(
      formData.email,
      formData.password,
      formData.isAdmin
    );

    if (result.success) {
      // Redirect sudah ditangani oleh useEffect
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Memeriksa autentikasi...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Login</h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    {formData.isAdmin ? "Email Address" : "Email Address"} *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder={formData.isAdmin ? "admin@gmail.com" : "user@gmail.com"}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password *
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="••••••"
                  />
                </div>

                <div className="mb-3 form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isAdmin"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label className="form-check-label" htmlFor="isAdmin">
                    Login sebagai Admin
                  </label>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-3 text-center">
                <p className="mb-0">
                  {formData.isAdmin ? (
                    <span>
                      Login sebagai peserta?{" "}
                      <Link
                        to="/login"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormData(prev => ({ ...prev, isAdmin: false, email: "", password: "" }));
                        }}
                        className="text-decoration-none fw-semibold"
                      >
                        Klik di sini
                      </Link>
                    </span>
                  ) : (
                    <>
                      Belum punya akun?{" "}
                      <Link to="/register" className="text-decoration-none fw-semibold">
                        Daftar di sini
                      </Link>
                    </>
                  )}
                </p>
              </div>

              <div className="mt-4">
                <div className="alert alert-info">
                  <strong>
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Demo Credentials:
                  </strong>
                  <br />
                  <div className="mt-2">
                    <strong>Admin:</strong> admin@gmail.com / admin
                    <br />
                    <strong>User 1:</strong> user1@gmail.com / user123
                    <br />
                    <strong>User 2:</strong> user2@gmail.com / user321
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;