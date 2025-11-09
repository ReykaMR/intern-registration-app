import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.full_name || !formData.email || !formData.password) {
      setError("Semua field yang bertanda * harus diisi");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password harus minimal 6 karakter");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak sama");
      setLoading(false);
      return;
    }

    const { confirmPassword, ...submitData } = formData;
    const result = await register(submitData);

    if (result.success) {
      // Register berhasil, redirect sudah ditangani oleh useEffect
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
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
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Registrasi Akun Peserta</h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="full_name" className="form-label">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="contoh@email.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
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
                        minLength={6}
                        placeholder="Minimal 6 karakter"
                      />
                      <div className="form-text">
                        <i className="bi bi-info-circle me-1"></i>
                        Password minimal 6 karakter
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Konfirmasi Password *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Ulangi password"
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">
                        Nomor Telepon
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="address" className="form-label">
                        Alamat
                      </label>
                      <textarea
                        className="form-control"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                        rows="2"
                        placeholder="Masukkan alamat lengkap"
                      />
                    </div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <strong>
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Informasi:
                  </strong>
                  <ul className="mb-0 mt-2">
                    <li>Password harus minimal 6 karakter</li>
                    <li>Pastikan email yang digunakan valid</li>
                    <li>
                      Setelah registrasi, Anda dapat login dan mendaftar program
                    </li>
                    <li>Data pribadi Anda akan dilindungi</li>
                  </ul>
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
                        Mendaftarkan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus-fill me-2"></i>
                        Daftar Sekarang
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-3 text-center">
                <p className="mb-0">
                  Sudah punya akun?{" "}
                  <Link to="/login" className="text-decoration-none fw-semibold">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Login di sini
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;