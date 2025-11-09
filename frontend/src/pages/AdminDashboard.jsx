import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import helpers from "../utils/helpers";

const AdminDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    program: "all",
    payment_status: "all",
    selection_status: "all",
    placement_status: "all",
    search: "",
  });
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    registration_status: "",
    notes: "",
  });
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    newRegistrations: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    paymentStats: {
      pending: 0,
      installment_1: 0,
      installment_2: 0,
      installment_3: 0,
      installment_4: 0,
      installment_5: 0,
      installment_6: 0,
      paid: 0,
      overdue: 0,
    },
    registrationStats: {
      menunggu: 0,
      lolos: 0,
      tidak_lolos: 0,
    },
    selectionStats: {
      menunggu: 0,
      lolos: 0,
      tidak_lolos: 0,
    },
    placementStats: {
      proses: 0,
      lolos: 0,
      ditempatkan: 0,
    },
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchPrograms();
    fetchStatistics();
    fetchRegistrations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        fetchRegistrations();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();

      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "all" && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/registrations?${params}`);
      if (response.data.success) {
        setRegistrations(response.data.data);
        updateStatisticsFromRegistrations(response.data.data);
      } else {
        setError("Gagal mengambil data pendaftaran");
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError(
        error.response?.data?.message || "Error loading registration data"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchPrograms = async () => {
    try {
      const response = await axios.get("/api/programs");
      if (response.data.success) {
        setPrograms(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get("/api/admin/statistics");
      if (response.data.success) {
        setStats((prevStats) => ({
          ...prevStats,
          ...response.data.data,
        }));
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      updateStatisticsFromRegistrations(registrations);
    }
  };

  const updateStatisticsFromRegistrations = (registrationsData) => {
    const totalRegistrations = registrationsData.length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newRegistrations = registrationsData.filter(
      (reg) => new Date(reg.registration_date) > oneWeekAgo
    ).length;

    const totalRevenue = registrationsData.reduce(
      (sum, reg) => sum + parseFloat(reg.amount_paid || 0),
      0
    );

    const paymentStats = {
      pending: 0,
      installment_1: 0,
      installment_2: 0,
      installment_3: 0,
      installment_4: 0,
      installment_5: 0,
      installment_6: 0,
      paid: 0,
      overdue: 0,
    };

    const registrationStats = {
      menunggu: 0,
      lolos: 0,
      tidak_lolos: 0,
    };

    const selectionStats = {
      menunggu: 0,
      lolos: 0,
      tidak_lolos: 0,
    };

    const placementStats = {
      proses: 0,
      lolos: 0,
      ditempatkan: 0,
    };

    registrationsData.forEach((reg) => {
      if (reg.payment_status && paymentStats.hasOwnProperty(reg.payment_status)) {
        paymentStats[reg.payment_status]++;
      } else if (!reg.payment_status) {
        paymentStats.pending++;
      }

      if (reg.registration_status && registrationStats.hasOwnProperty(reg.registration_status)) {
        registrationStats[reg.registration_status]++;
      }

      if (reg.selection_status && selectionStats.hasOwnProperty(reg.selection_status)) {
        selectionStats[reg.selection_status]++;
      }

      if (reg.placement_status && placementStats.hasOwnProperty(reg.placement_status)) {
        placementStats[reg.placement_status]++;
      }
    });

    const pendingVerifications =
      registrationStats.menunggu +
      selectionStats.menunggu +
      paymentStats.pending;

    setStats((prevStats) => ({
      ...prevStats,
      totalRegistrations,
      newRegistrations,
      totalRevenue,
      pendingVerifications,
      paymentStats,
      registrationStats,
      selectionStats,
      placementStats,
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearchChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowDetailModal(true);
  };

  const handleUpdateRegistrationStatus = (registration) => {
    setSelectedRegistration(registration);
    setStatusForm({
      registration_status: registration.registration_status || "menunggu",
      notes: "",
    });
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRegistration) return;

    try {
      setLoading(true);
      const response = await axios.put(
        `/api/registrations/${selectedRegistration.id}/registration-status`,
        {
          status: statusForm.registration_status,
          notes: statusForm.notes,
          evaluated_by: user?.id,
        }
      );

      if (response.data.success) {
        alert("Status pendaftaran berhasil diperbarui");

        const updatedRegistration = response.data.data.updated_registration;

        setRegistrations((prev) =>
          prev.map((reg) =>
            reg.id === selectedRegistration.id
              ? { ...reg, registration_status: statusForm.registration_status }
              : reg
          )
        );

        setSelectedRegistration((prev) =>
          prev
            ? { ...prev, registration_status: statusForm.registration_status }
            : prev
        );

        fetchStatistics();

        setShowStatusModal(false);
        setStatusForm({ registration_status: "", notes: "" });
      } else {
        throw new Error("Gagal memperbarui status");
      }
    } catch (error) {
      console.error("Error updating registration status:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setShowStatusModal(false);
    setSelectedRegistration(null);
    setStatusForm({ registration_status: "", notes: "" });
  };

  const getInstallmentText = (paymentStatus, installmentPlan) => {
    if (paymentStatus === "paid") return "Lunas";
    if (paymentStatus === "pending") return "Belum Bayar";
    if (paymentStatus === "overdue") return "Jatuh Tempo";
    if (paymentStatus === "cancelled") return "Dibatalkan";

    const installmentNumber = paymentStatus.split("_")[1];

    if (installmentPlan === "4_installments") {
      return `Cicilan ${installmentNumber}/4`;
    } else if (installmentPlan === "6_installments") {
      return `Cicilan ${installmentNumber}/6`;
    } else {
      return `Cicilan ${installmentNumber}`;
    }
  };

  const getPaymentStatusBadge = (paymentStatus, installmentPlan) => {
    const statusText = getInstallmentText(paymentStatus, installmentPlan);

    let badgeClass = "bg-secondary";
    if (paymentStatus === "paid") badgeClass = "bg-success";
    else if (paymentStatus === "pending") badgeClass = "bg-warning text-dark";
    else if (paymentStatus === "overdue") badgeClass = "bg-danger";
    else if (paymentStatus?.startsWith("installment_")) badgeClass = "bg-info";
    else if (paymentStatus === "cancelled") badgeClass = "bg-secondary";

    return <span className={`badge ${badgeClass}`}>{statusText}</span>;
  };

  const getRegistrationStatusBadge = (status) => {
    const statusConfig = {
      menunggu: { class: "bg-warning text-dark", text: "Menunggu Interview" },
      lolos: { class: "bg-success", text: "Lolos Interview" },
      tidak_lolos: { class: "bg-danger", text: "Tidak Lolos Interview" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status || "Belum Ditentukan",
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getSelectionStatusBadge = (status) => {
    const statusConfig = {
      menunggu: { class: "bg-warning text-dark", text: "Menunggu" },
      lolos: { class: "bg-success", text: "Lolos" },
      tidak_lolos: { class: "bg-danger", text: "Tidak Lolos" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status || "Belum Ditentukan",
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getPlacementStatusBadge = (status) => {
    const statusConfig = {
      proses: { class: "bg-warning text-dark", text: "Proses" },
      lolos: { class: "bg-info", text: "Lolos" },
      ditempatkan: { class: "bg-success", text: "Ditempatkan" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status || "Belum Ditentukan",
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const renderCertificates = (registration) => {
    const certificates = [];

    if (registration.n4_certificate_path) {
      const fileName = registration.n4_certificate_path.split("/").pop();
      certificates.push(
        <div key="n4" className="mb-1">
          <a
            href={`http://localhost:5000${registration.n4_certificate_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none d-flex align-items-center"
          >
            <i className="bi bi-file-earmark-pdf text-danger me-1"></i>
            {fileName}
          </a>
        </div>
      );
    }

    if (registration.ssw_certificate_path) {
      const fileName = registration.ssw_certificate_path.split("/").pop();
      certificates.push(
        <div key="ssw" className="mb-1">
          <a
            href={`http://localhost:5000${registration.ssw_certificate_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none d-flex align-items-center"
          >
            <i className="bi bi-file-earmark-pdf text-danger me-1"></i>
            {fileName}
          </a>
        </div>
      );
    }

    if (certificates.length === 0) {
      return <span className="text-muted">-</span>;
    }

    return <div>{certificates}</div>;
  };

  const handleResetFilters = () => {
    setFilters({
      program: "all",
      payment_status: "all",
      selection_status: "all",
      placement_status: "all",
      search: "",
    });
  };

  const renderPersonalInfo = (registration) => {
    return (
      <div className="row">
        <div className="col-md-6">
          <h6 className="fw-bold text-primary mb-3">Informasi Pribadi</h6>
          <div className="mb-2">
            <strong>NIK:</strong> {registration.nik || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Jenis Kelamin:</strong> {registration.gender === 'L' ? 'Laki-laki' : registration.gender === 'P' ? 'Perempuan' : <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Tempat Lahir:</strong> {registration.birth_place || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Tanggal Lahir:</strong> {registration.birth_date ? helpers.formatDateForBirthDate(registration.birth_date) : <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Status Pernikahan:</strong> {registration.marital_status || <span className="text-muted">-</span>}
          </div>
        </div>

        <div className="col-md-6">
          <h6 className="fw-bold text-primary mb-3">Informasi Pendidikan</h6>
          <div className="mb-2">
            <strong>Pendidikan Terakhir:</strong> {registration.last_education || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Jurusan:</strong> {registration.major || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Institusi Pendidikan:</strong> {registration.education_institution || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Aktivitas Saat Ini:</strong> {registration.current_activity || <span className="text-muted">-</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderParentInfo = (registration) => {
    return (
      <div className="row mt-3">
        <div className="col-12">
          <h6 className="fw-bold text-primary mb-3">Informasi Orang Tua</h6>
          <div className="mb-2">
            <strong>Nomor Telepon Orang Tua:</strong> {registration.parent_phone || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Hubungan dengan Orang Tua:</strong> {registration.parent_relationship || <span className="text-muted">-</span>}
          </div>
        </div>
      </div>
    );
  };

  const renderAddressInfo = (registration) => {
    return (
      <div className="row">
        <div className="col-md-6">
          <h6 className="fw-bold text-primary mb-3">Alamat KTP</h6>
          <div className="mb-2">
            <strong>Provinsi:</strong> {registration.ktp_province_name || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Kota/Kabupaten:</strong> {registration.ktp_city_name || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Alamat Lengkap:</strong> {registration.ktp_address || <span className="text-muted">-</span>}
          </div>
        </div>

        <div className="col-md-6">
          <h6 className="fw-bold text-primary mb-3">Alamat Domisili</h6>
          <div className="mb-2">
            <strong>Provinsi:</strong> {registration.domicile_province_name || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Kota/Kabupaten:</strong> {registration.domicile_city_name || <span className="text-muted">-</span>}
          </div>
          <div className="mb-2">
            <strong>Alamat Lengkap:</strong> {registration.domicile_address || <span className="text-muted">-</span>}
          </div>
        </div>
      </div>
    );
  };

  if (loading && registrations.length === 0) {
    return (
      <div className="container-fluid px-2 px-md-3 mt-3 mt-md-4">
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <div className="text-center">
          <p>Memuat dashboard admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-md-3 mt-3 mt-md-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Admin Dashboard</h2>
              <p className="text-muted mb-0">
                Kelola pendaftaran program dan peserta
              </p>
            </div>
            <div className="text-end">
              <p className="mb-0">
                Selamat datang, <strong>{user?.full_name || "Admin"}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-2 mb-3 mb-md-4">
        <div className="col-6 col-sm-3 col-md-3 mb-2">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <h6 className="card-title stats-label mb-1">Total Pendaftar</h6>
              <div className="fs-4 fw-bold">{stats.totalRegistrations}</div>
              <small>Semua Program</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3 col-md-3 mb-2">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <h6 className="card-title stats-label mb-1">Pendaftar Baru</h6>
              <div className="fs-4 fw-bold">{stats.newRegistrations}</div>
              <small>7 Hari Terakhir</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3 col-md-3 mb-2">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <h6 className="card-title stats-label mb-1">Total Pemasukan</h6>
              <div className="fs-4 fw-bold">
                {helpers.formatCurrency(stats.totalRevenue)}
              </div>
              <small>Dari {stats.paymentStats.paid} peserta lunas</small>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-3 col-md-3 mb-2">
          <div className="card bg-primary text-white h-100">
            <div className="card-body text-center p-2 p-md-3">
              <h6 className="card-title stats-label mb-1">
                Verifikasi Tertunda
              </h6>
              <div className="fs-4 fw-bold">{stats.pendingVerifications}</div>
              <small>Perlu tindakan</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Filter & Pencarian</h5>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleResetFilters}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Reset Filter
          </button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">Program</label>
              <select
                className="form-select"
                value={filters.program}
                onChange={(e) => handleFilterChange("program", e.target.value)}
              >
                <option value="all">Semua Program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Pembayaran</label>
              <select
                className="form-select"
                value={filters.payment_status}
                onChange={(e) =>
                  handleFilterChange("payment_status", e.target.value)
                }
              >
                <option value="all">Semua Status</option>
                <option value="pending">Belum Bayar</option>
                <option value="installment_1">Cicilan 1</option>
                <option value="installment_2">Cicilan 2</option>
                <option value="installment_3">Cicilan 3</option>
                <option value="installment_4">Cicilan 4</option>
                <option value="installment_5">Cicilan 5</option>
                <option value="installment_6">Cicilan 6</option>
                <option value="paid">Lunas</option>
                <option value="overdue">Jatuh Tempo</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Seleksi</label>
              <select
                className="form-select"
                value={filters.selection_status}
                onChange={(e) =>
                  handleFilterChange("selection_status", e.target.value)
                }
              >
                <option value="all">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="lolos">Lolos</option>
                <option value="tidak_lolos">Tidak Lolos</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Penyaluran</label>
              <select
                className="form-select"
                value={filters.placement_status}
                onChange={(e) =>
                  handleFilterChange("placement_status", e.target.value)
                }
              >
                <option value="all">Semua Status</option>
                <option value="proses">Proses</option>
                <option value="lolos">Lolos</option>
                <option value="ditempatkan">Ditempatkan</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Pencarian</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari nama, email, atau kode pendaftaran..."
                  value={filters.search}
                  onChange={handleSearchChange}
                />
                {filters.search && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => handleFilterChange("search", "")}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Data Pendaftar ({registrations.length})
          </h5>
          <div>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={fetchRegistrations}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Memuat...
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-warning d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <div>{error}</div>
            </div>
          )}

          {registrations.length === 0 ? (
            <div className="text-center py-5">
              <div className="text-muted mb-3">
                <i className="bi bi-clipboard-x" style={{ fontSize: "3rem" }}></i>
              </div>
              <h5>Tidak ada data pendaftaran</h5>
              <p className="text-muted">
                {filters.program !== "all" ||
                  filters.payment_status !== "all" ||
                  filters.search !== ""
                  ? "Coba ubah filter atau kata kunci pencarian Anda"
                  : "Belum ada pendaftaran yang tercatat"}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped">
                <thead className="table-light align-middle">
                  <tr>
                    <th>#</th>
                    <th>Pendaftar</th>
                    <th>Program</th>
                    <th>Kode</th>
                    <th>Tanggal</th>
                    <th>Status Pendaftaran</th>
                    <th>Status Pembayaran</th>
                    <th>Status Seleksi</th>
                    <th>Status Penyaluran</th>
                    <th>Sertifikat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody className="align-middle">
                  {registrations.map((registration, index) => (
                    <tr key={registration.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {registration.photo_path && (
                            <img
                              src={`http://localhost:5000${registration.photo_path}`}
                              alt={registration.full_name}
                              className="me-2"
                              style={{ width: '50px', height: '75px', objectFit: 'cover' }}
                            />
                          )}
                          <div>
                            <strong>{registration.full_name}</strong>
                            <br />
                            <small className="text-muted">
                              {registration.email}
                            </small>
                            <br />
                            <small>{registration.phone}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{registration.program_name}</strong>
                        <br />
                        <small className="text-muted">
                          {helpers.formatCurrency(
                            registration.program_training_cost
                          )}
                        </small>
                      </td>
                      <td>
                        <code className="bg-light px-1 rounded">
                          {registration.registration_code}
                        </code>
                      </td>
                      <td>
                        {helpers.formatDate(registration.registration_date)}
                      </td>
                      <td>
                        {getRegistrationStatusBadge(
                          registration.registration_status
                        )}
                      </td>
                      <td>
                        {getPaymentStatusBadge(
                          registration.payment_status,
                          registration.program_installment_plan
                        )}
                        {registration.amount_paid > 0 && (
                          <div className="mt-1">
                            <small>
                              Dibayar: {helpers.formatCurrency(registration.amount_paid)}
                            </small>
                          </div>
                        )}
                      </td>
                      <td>
                        {getSelectionStatusBadge(registration.selection_status)}
                      </td>
                      <td>
                        {getPlacementStatusBadge(registration.placement_status)}
                        {registration.company_name && (
                          <div className="mt-1">
                            <small>{registration.company_name}</small>
                          </div>
                        )}
                      </td>
                      <td>{renderCertificates(registration)}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleViewDetails(registration)}
                            title="Lihat Detail"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-outline-primary"
                            onClick={() =>
                              handleUpdateRegistrationStatus(registration)
                            }
                            title="Update Status Pendaftaran"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detail Lengkap Peserta</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                {/* Tab Navigation */}
                <ul className="nav nav-tabs mb-4" id="detailTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="basic-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#basic"
                      type="button"
                      role="tab"
                      aria-controls="basic"
                      aria-selected="true"
                    >
                      Informasi Dasar
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="personal-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#personal"
                      type="button"
                      role="tab"
                      aria-controls="personal"
                      aria-selected="false"
                    >
                      Data Pribadi
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="address-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#address"
                      type="button"
                      role="tab"
                      aria-controls="address"
                      aria-selected="false"
                    >
                      Alamat
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="status-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#status"
                      type="button"
                      role="tab"
                      aria-controls="status"
                      aria-selected="false"
                    >
                      Status & Dokumen
                    </button>
                  </li>
                </ul>

                {/* Tab Content */}
                <div className="tab-content" id="detailTabsContent">
                  {/* Tab 1: Informasi Dasar */}
                  <div className="tab-pane fade show active" id="basic" role="tabpanel" aria-labelledby="basic-tab">
                    <div className="row">
                      <div className="col-md-6">
                        <h6 className="fw-bold text-primary mb-3">Informasi Kontak</h6>
                        <div className="mb-3">
                          <strong>Nama Lengkap:</strong> {selectedRegistration.full_name}
                        </div>
                        <div className="mb-3">
                          <strong>Email:</strong> {selectedRegistration.email}
                        </div>
                        <div className="mb-3">
                          <strong>Telepon:</strong> {selectedRegistration.phone || <span className="text-muted">-</span>}
                        </div>
                        <div className="mb-3">
                          <strong>Tanggal Pendaftaran:</strong> {helpers.formatDate(selectedRegistration.registration_date)}
                        </div>
                        <div className="mb-3">
                          <strong>Kode Pendaftaran:</strong> <code>{selectedRegistration.registration_code}</code>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h6 className="fw-bold text-primary mb-3">Informasi Program</h6>
                        <div className="mb-3">
                          <strong>Program:</strong> {selectedRegistration.program_name}
                        </div>
                        <div className="mb-3">
                          <strong>Biaya Pelatihan:</strong> {helpers.formatCurrency(selectedRegistration.program_training_cost)}
                        </div>
                        <div className="mb-3">
                          <strong>Biaya Keberangkatan:</strong> {helpers.formatCurrency(selectedRegistration.program_departure_cost)}
                        </div>
                        <div className="mb-3">
                          <strong>Durasi:</strong> {selectedRegistration.program_duration}
                        </div>
                        <div className="mb-3">
                          <strong>Lokasi:</strong> {selectedRegistration.program_location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab 2: Data Pribadi */}
                  <div className="tab-pane fade" id="personal" role="tabpanel" aria-labelledby="personal-tab">
                    {renderPersonalInfo(selectedRegistration)}
                    {renderParentInfo(selectedRegistration)}
                  </div>

                  {/* Tab 3: Alamat */}
                  <div className="tab-pane fade" id="address" role="tabpanel" aria-labelledby="address-tab">
                    {renderAddressInfo(selectedRegistration)}
                  </div>

                  {/* Tab 4: Status & Dokumen */}
                  <div className="tab-pane fade" id="status" role="tabpanel" aria-labelledby="status-tab">
                    <div className="row mb-4">
                      <div className="col-md-3 text-center">
                        <h6>Pendaftaran (Interview)</h6>
                        {getRegistrationStatusBadge(selectedRegistration.registration_status)}
                      </div>
                      <div className="col-md-3 text-center">
                        <h6>Pembayaran</h6>
                        {getPaymentStatusBadge(selectedRegistration.payment_status, selectedRegistration.program_installment_plan)}
                        {selectedRegistration.amount_paid > 0 && (
                          <div className="mt-2">
                            <small className="text-muted">
                              Dibayar: {helpers.formatCurrency(selectedRegistration.amount_paid)}
                            </small>
                            {selectedRegistration.payment_date && (
                              <div>
                                <small className="text-muted">
                                  Tanggal: {helpers.formatDate(selectedRegistration.payment_date)}
                                </small>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-md-3 text-center">
                        <h6>Seleksi Diklat</h6>
                        {getSelectionStatusBadge(selectedRegistration.selection_status)}
                        {selectedRegistration.selection_notes && (
                          <div className="mt-2">
                            <small className="text-muted">
                              Catatan: {selectedRegistration.selection_notes}
                            </small>
                          </div>
                        )}
                      </div>
                      <div className="col-md-3 text-center">
                        <h6>Penyaluran Kerja</h6>
                        {getPlacementStatusBadge(selectedRegistration.placement_status)}
                        {selectedRegistration.company_name && (
                          <div className="mt-2">
                            <small className="text-muted">
                              Perusahaan: {selectedRegistration.company_name}
                            </small>
                          </div>
                        )}
                        {selectedRegistration.placement_notes && (
                          <div className="mt-1">
                            <small className="text-muted">
                              Catatan: {selectedRegistration.placement_notes}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dokumen */}
                    <div className="row">
                      <div className="col-12">
                        <h6 className="fw-bold text-primary mb-3">Dokumen & Sertifikat</h6>
                        <div className="row">
                          <div className="col-md-4">
                            <div className="card">
                              <div className="card-body text-center">
                                <i className="bi bi-person-badge fs-1 text-primary mb-2"></i>
                                <h6>Foto Profil</h6>
                                {selectedRegistration.photo_path ? (
                                  <a
                                    href={`http://localhost:5000${selectedRegistration.photo_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary btn-sm mt-2"
                                  >
                                    Lihat Foto
                                  </a>
                                ) : (
                                  <span className="text-muted">Tidak tersedia</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card">
                              <div className="card-body text-center">
                                <i className="bi bi-file-earmark-pdf fs-1 text-danger mb-2"></i>
                                <h6>Sertifikat N4</h6>
                                {selectedRegistration.n4_certificate_path ? (
                                  <a
                                    href={`http://localhost:5000${selectedRegistration.n4_certificate_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-danger btn-sm mt-2"
                                  >
                                    Lihat Sertifikat
                                  </a>
                                ) : (
                                  <span className="text-muted">Tidak tersedia</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="card">
                              <div className="card-body text-center">
                                <i className="bi bi-file-earmark-pdf fs-1 text-danger mb-2"></i>
                                <h6>Sertifikat SSW</h6>
                                {selectedRegistration.ssw_certificate_path ? (
                                  <a
                                    href={`http://localhost:5000${selectedRegistration.ssw_certificate_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-danger btn-sm mt-2"
                                  >
                                    Lihat Sertifikat
                                  </a>
                                ) : (
                                  <span className="text-muted">Tidak tersedia</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleUpdateRegistrationStatus(selectedRegistration)}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Update Status Pendaftaran */}
      {showStatusModal && selectedRegistration && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-dialog modal-md modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Status Pendaftaran</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <form onSubmit={handleStatusSubmit}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    Mengupdate status untuk: <strong>{selectedRegistration.full_name}</strong>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Status Pendaftaran *</label>
                    <select
                      className="form-select"
                      value={statusForm.registration_status}
                      onChange={(e) =>
                        setStatusForm({
                          ...statusForm,
                          registration_status: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="menunggu">Menunggu Interview</option>
                      <option value="lolos">Lolos Interview</option>
                      <option value="tidak_lolos">Tidak Lolos Interview</option>
                    </select>
                    <div className="form-text">
                      Status ini menentukan hasil proses interview peserta
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Catatan (Opsional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={statusForm.notes}
                      onChange={(e) =>
                        setStatusForm({
                          ...statusForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Berikan catatan mengenai hasil interview..."
                    />
                    <div className="form-text">
                      Catatan akan tersimpan dalam history status
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={loading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Status"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;