import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const SelectionAndPlacementManagement = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    selection_status: "all",
    placement_status: "all",
    search: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [formData, setFormData] = useState({
    selection_status: "",
    selection_notes: "",
    placement_status: "",
    company_name: "",
    placement_date: "",
    placement_notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchRegistrations();
  }, [filters]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.selection_status !== "all") {
        params.append("selection_status", filters.selection_status);
      }
      if (filters.placement_status !== "all") {
        params.append("placement_status", filters.placement_status);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }

      const response = await axios.get(`/api/registrations?${params}`);
      if (response.data.success) {
        setRegistrations(response.data.data);
      } else {
        setError("Gagal memuat data registrasi");
      }
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setError("Error loading registration data");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEdit = (registration) => {
    setSelectedRegistration(registration);
    setFormData({
      selection_status: registration.selection_status || "menunggu",
      selection_notes: registration.selection_notes || "",
      placement_status: registration.placement_status || "proses",
      company_name: registration.company_name || "",
      placement_date: registration.placement_date
        ? new Date(registration.placement_date).toISOString().split("T")[0]
        : "",
      placement_notes: registration.placement_notes || "",
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedRegistration(null);
    setFormData({
      selection_status: "",
      selection_notes: "",
      placement_status: "",
      company_name: "",
      placement_date: "",
      placement_notes: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRegistration) return;

    setSaving(true);
    try {
      if (
        formData.selection_status &&
        formData.selection_status !== selectedRegistration.selection_status
      ) {
        await axios.put(`/api/selection/${selectedRegistration.id}`, {
          status: formData.selection_status,
          notes: formData.selection_notes,
          evaluated_by: user.id,
        });
      }

      if (
        formData.placement_status &&
        formData.placement_status !== selectedRegistration.placement_status
      ) {
        await axios.put(`/api/placement/${selectedRegistration.id}`, {
          status: formData.placement_status,
          company_name: formData.company_name,
          placement_date: formData.placement_date || null,
          notes: formData.placement_notes,
        });
      }

      setMessage({
        type: "success",
        text: "Status seleksi dan penyaluran berhasil diperbarui",
      });

      handleCloseModal();
      fetchRegistrations();
    } catch (error) {
      console.error("Error updating status:", error);
      setMessage({
        type: "error",
        text:
          "Gagal memperbarui status: " +
          (error.response?.data?.message || error.message),
      });
    } finally {
      setSaving(false);
    }
  };

  const getSelectionStatusBadge = (status) => {
    const statusConfig = {
      menunggu: { class: "bg-warning", text: "Menunggu" },
      lolos: { class: "bg-success", text: "Lolos" },
      tidak_lolos: { class: "bg-danger", text: "Tidak Lolos" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getPlacementStatusBadge = (status) => {
    const statusConfig = {
      proses: { class: "bg-info", text: "Proses" },
      lolos: { class: "bg-success", text: "Lolos" },
      ditempatkan: { class: "bg-primary", text: "Ditempatkan" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID");
    } catch (error) {
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>Manajemen Seleksi & Penyaluran</h2>
          <p className="text-muted">
            Kelola proses seleksi dan penyaluran peserta
          </p>
        </div>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div
          className={`alert alert-${message.type === "error" ? "danger" : "success"
            } alert-dismissible fade show`}
          role="alert"
        >
          {message.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage({ type: "", text: "" })}
          ></button>
        </div>
      )}

      {/* Filters */}
      <div className="row">
        <div className="col">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Filter & Pencarian</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Status Seleksi Diklat</label>
                  <select
                    className="form-select"
                    value={filters.selection_status}
                    onChange={(e) =>
                      handleFilterChange("selection_status", e.target.value)
                    }
                  >
                    <option value="all">Semua Status Seleksi</option>
                    <option value="menunggu">Menunggu</option>
                    <option value="lolos">Lolos</option>
                    <option value="tidak_lolos">Tidak Lolos</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Status Penyaluran</label>
                  <select
                    className="form-select"
                    value={filters.placement_status}
                    onChange={(e) =>
                      handleFilterChange("placement_status", e.target.value)
                    }
                  >
                    <option value="all">Semua Status Penyaluran</option>
                    <option value="proses">Proses</option>
                    <option value="lolos">Lolos</option>
                    <option value="ditempatkan">Ditempatkan</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Pencarian</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari nama peserta..."
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="row">
        <div className="col">
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Daftar Peserta ({registrations.length})</h5>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchRegistrations}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div
                  className="alert alert-warning alert-dismissible fade show"
                  role="alert"
                >
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError("")}
                  ></button>
                </div>
              )}

              {registrations.length === 0 ? (
                <div className="text-center py-5">
                  <div className="display-1 text-muted mb-3"><i className="bi bi-people"></i></div>
                  <h5>Tidak ada data peserta</h5>
                  <p className="text-muted">
                    {filters.selection_status !== "all" ||
                      filters.placement_status !== "all" ||
                      filters.search
                      ? "Coba ubah filter atau kata kunci pencarian"
                      : "Belum ada peserta yang terdaftar"}
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-light align-middle">
                      <tr>
                        <th>Nama Peserta</th>
                        <th>Program</th>
                        <th>Status Seleksi Diklat</th>
                        <th>Status Penyaluran Kerja</th>
                        <th>Perusahaan</th>
                        <th>Tanggal Penempatan</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="align-middle">
                      {registrations.map((registration) => (
                        <tr key={registration.id}>
                          <td>
                            <div>
                              <strong>{registration.full_name}</strong>
                              <div>
                                <small className="text-muted">
                                  {registration.email}
                                </small>
                              </div>
                              <div>
                                <small className="text-muted">
                                  Kode: {registration.registration_code}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>{registration.program_name}</div>
                            <small className="text-muted">
                              {registration.program_duration}
                            </small>
                          </td>
                          <td>
                            {getSelectionStatusBadge(
                              registration.selection_status
                            )}
                            {registration.selection_notes && (
                              <div>
                                <small className="text-muted">
                                  {registration.selection_notes}
                                </small>
                              </div>
                            )}
                          </td>
                          <td>
                            {getPlacementStatusBadge(
                              registration.placement_status
                            )}
                            {registration.placement_notes && (
                              <div>
                                <small className="text-muted">
                                  {registration.placement_notes}
                                </small>
                              </div>
                            )}
                          </td>
                          <td>
                            {registration.company_name ? (
                              <span className="fw-bold">
                                {registration.company_name}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {registration.placement_date ? (
                              formatDate(registration.placement_date)
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleEdit(registration)}
                              title="Edit Status"
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedRegistration && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Status Peserta</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={saving}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6>Informasi Peserta</h6>
                      <p>
                        <strong>Nama:</strong> {selectedRegistration.full_name}
                      </p>
                      <p>
                        <strong>Program:</strong>{" "}
                        {selectedRegistration.program_name}
                      </p>
                      <p>
                        <strong>Kode:</strong>{" "}
                        {selectedRegistration.registration_code}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6>Status Saat Ini</h6>
                      <p>
                        <strong>Seleksi Diklat:</strong>{" "}
                        {getSelectionStatusBadge(
                          selectedRegistration.selection_status
                        )}
                      </p>
                      <p>
                        <strong>Penyaluran Kerja:</strong>{" "}
                        {getPlacementStatusBadge(
                          selectedRegistration.placement_status
                        )}
                      </p>
                      {selectedRegistration.company_name && (
                        <p>
                          <strong>Perusahaan:</strong>{" "}
                          {selectedRegistration.company_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Status Seleksi Diklat *
                        </label>
                        <select
                          className="form-select"
                          value={formData.selection_status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              selection_status: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="menunggu">Menunggu</option>
                          <option value="lolos">Lolos</option>
                          <option value="tidak_lolos">Tidak Lolos</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Catatan Seleksi</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.selection_notes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              selection_notes: e.target.value,
                            })
                          }
                          placeholder="Catatan untuk status seleksi..."
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Status Penyaluran Kerja *
                        </label>
                        <select
                          className="form-select"
                          value={formData.placement_status}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              placement_status: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="proses">Proses</option>
                          <option value="lolos">Lolos</option>
                          <option value="ditempatkan">Ditempatkan</option>
                        </select>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="companyName" className="form-label">
                          Nama Perusahaan/Instansi
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="companyName"
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              company_name: e.target.value,
                            })
                          }
                          placeholder="Masukkan nama perusahaan..."
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="placementDate" className="form-label">
                          Tanggal Penempatan
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="placementDate"
                          value={formData.placement_date}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              placement_date: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Catatan Penyaluran</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData.placement_notes}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              placement_notes: e.target.value,
                            })
                          }
                          placeholder="Catatan untuk status penyaluran..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Conditional fields based on status */}
                  {formData.placement_status === "ditempatkan" && (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Status Ditempatkan:</strong> Pastikan untuk
                      mengisi nama perusahaan dan tanggal penempatan.
                    </div>
                  )}

                  {formData.selection_status === "tidak_lolos" && (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Status Tidak Lolos:</strong> Disarankan untuk
                      memberikan catatan alasan ketidaklolosan.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    disabled={saving}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Perubahan"
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

export default SelectionAndPlacementManagement;
