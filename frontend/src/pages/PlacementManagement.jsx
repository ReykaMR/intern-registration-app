import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const PlacementManagement = () => {
  const [placements, setPlacements] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    program: "all",
    status: "all",
    search: "",
  });
  const [selectedPlacement, setSelectedPlacement] = useState(null);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [placementData, setPlacementData] = useState({
    status: "proses",
    company_name: "",
    position: "",
    department: "",
    placement_date: new Date().toISOString().split("T")[0],
    supervisor_name: "",
    supervisor_contact: "",
    notes: "",
  });
  const [bulkData, setBulkData] = useState({
    status: "ditempatkan",
    company_name: "",
    position: "",
    department: "",
    notes: "",
  });
  const [selectedPlacements, setSelectedPlacements] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchPlacements();
    fetchPrograms();
    fetchStatistics();
  }, [filters]);

  const fetchPlacements = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "all" && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/placement?${params}`);
      if (response.data.success) {
        setPlacements(response.data.data);
      } else {
        setError("Failed to fetch placement data");
      }
    } catch (error) {
      console.error("Error fetching placements:", error);
      setError("Error loading placement data");
    } finally {
      setLoading(false);
    }
  };

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
      const response = await axios.get("/api/placement/statistics");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching placement statistics:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleUpdatePlacement = (placement) => {
    setSelectedPlacement(placement);
    setPlacementData({
      status: placement.status || "proses",
      company_name: placement.company_name || "",
      position: placement.position || "",
      department: placement.department || "",
      placement_date:
        placement.placement_date || new Date().toISOString().split("T")[0],
      supervisor_name: placement.supervisor_name || "",
      supervisor_contact: placement.supervisor_contact || "",
      notes: placement.notes || "",
    });
    setShowPlacementModal(true);
  };

  const handlePlacementSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlacement) return;

    try {
      const response = await axios.put(
        `/api/placement/${selectedPlacement.registration_id}`,
        placementData
      );

      if (response.data.success) {
        alert("Placement data updated successfully");
        setShowPlacementModal(false);
        fetchPlacements();
        fetchStatistics();
      }
    } catch (error) {
      console.error("Error updating placement:", error);
      alert("Error updating placement data");
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    if (selectedPlacements.length === 0) {
      alert("Please select at least one candidate");
      return;
    }

    try {
      const data = {
        registration_ids: selectedPlacements,
        ...bulkData,
      };

      const response = await axios.post("/api/placement/bulk-update", data);
      if (response.data.success) {
        alert(response.data.message);
        setShowBulkModal(false);
        setSelectedPlacements([]);
        fetchPlacements();
        fetchStatistics();
      }
    } catch (error) {
      console.error("Error in bulk update:", error);
      alert("Error performing bulk update");
    }
  };

  const togglePlacementSelection = (registrationId) => {
    setSelectedPlacements((prev) =>
      prev.includes(registrationId)
        ? prev.filter((id) => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  const selectAllPlacements = () => {
    if (selectedPlacements.length === placements.length) {
      setSelectedPlacements([]);
    } else {
      setSelectedPlacements(placements.map((p) => p.registration_id));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      proses: { class: "bg-warning", text: "Proses" },
      lolos: { class: "bg-success", text: "Lolos" },
      ditempatkan: { class: "bg-success", text: "Ditempatkan" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getSelectionStatusBadge = (status) => {
    const statusConfig = {
      menunggu: { class: "bg-warning", text: "Menunggu" },
      lolos_tahap_1: { class: "bg-info", text: "Lolos Tahap 1" },
      lolos_tahap_2: { class: "bg-primary", text: "Lolos Tahap 2" },
      lolos: { class: "bg-success", text: "Lolos" },
      tidak_lolos: { class: "bg-danger", text: "Tidak Lolos" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
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
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Manajemen Penyaluran</h2>
              <p className="text-muted mb-0">
                Kelola penempatan dan penyaluran peserta
              </p>
            </div>
            <div>
              <button
                className="btn btn-primary me-2"
                onClick={() => setShowBulkModal(true)}
                disabled={placements.length === 0}
              >
                📊 Update Bulk
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={fetchPlacements}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.total_placements}</h4>
                <p className="mb-0">Total</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.in_process}</h4>
                <p className="mb-0">Proses</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.passed}</h4>
                <p className="mb-0">Lolos</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.placed}</h4>
                <p className="mb-0">Ditempatkan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Statistics */}
      {stats && stats.companyStats && stats.companyStats.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Statistik Perusahaan</h5>
          </div>
          <div className="card-body">
            <div className="row">
              {stats.companyStats.map((company, index) => (
                <div key={index} className="col-md-3 mb-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6 className="card-title">{company.company_name}</h6>
                      <h4 className="text-primary">
                        {company.total_placements}
                      </h4>
                      <small className="text-muted">Peserta</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Filters & Search</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
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
            <div className="col-md-4">
              <label className="form-label">Status Penyaluran</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="proses">Proses</option>
                <option value="lolos">Lolos</option>
                <option value="ditempatkan">Ditempatkan</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, company, or registration code..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Placement Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Data Penyaluran ({placements.length})
            {selectedPlacements.length > 0 && (
              <span className="badge bg-primary ms-2">
                {selectedPlacements.length} selected
              </span>
            )}
          </h5>
        </div>
        <div className="card-body">
          {placements.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 text-muted mb-3">🏢</div>
              <h5>No placement data found</h5>
              <p className="text-muted">
                Try changing your filters or search term
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th width="30">
                      <input
                        type="checkbox"
                        checked={
                          selectedPlacements.length === placements.length
                        }
                        onChange={selectAllPlacements}
                      />
                    </th>
                    <th>Peserta</th>
                    <th>Program</th>
                    <th>Status Seleksi</th>
                    <th>Perusahaan</th>
                    <th>Posisi</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {placements.map((placement) => (
                    <tr key={placement.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedPlacements.includes(
                            placement.registration_id
                          )}
                          onChange={() =>
                            togglePlacementSelection(placement.registration_id)
                          }
                        />
                      </td>
                      <td>
                        <strong>{placement.full_name}</strong>
                        <div>
                          <small className="text-muted">
                            {placement.email}
                          </small>
                        </div>
                        <div>
                          <small>Kode: {placement.registration_code}</small>
                        </div>
                      </td>
                      <td>{placement.program_name}</td>
                      <td>
                        {getSelectionStatusBadge(placement.selection_status)}
                      </td>
                      <td>
                        {placement.company_name ? (
                          <strong>{placement.company_name}</strong>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {placement.position ? (
                          placement.position
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{getStatusBadge(placement.status)}</td>
                      <td>
                        {placement.placement_date ? (
                          new Date(placement.placement_date).toLocaleDateString(
                            "id-ID"
                          )
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleUpdatePlacement(placement)}
                            title="Update Placement"
                          >
                            ✏️
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

      {/* Placement Modal */}
      {showPlacementModal && selectedPlacement && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Penempatan</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPlacementModal(false)}
                ></button>
              </div>
              <form onSubmit={handlePlacementSubmit}>
                <div className="modal-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6>Informasi Peserta</h6>
                      <p>
                        <strong>Nama:</strong> {selectedPlacement.full_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedPlacement.email}
                      </p>
                      <p>
                        <strong>Program:</strong>{" "}
                        {selectedPlacement.program_name}
                      </p>
                      <p>
                        <strong>Status Seleksi:</strong>{" "}
                        {getSelectionStatusBadge(
                          selectedPlacement.selection_status
                        )}
                      </p>
                      {selectedPlacement.final_score && (
                        <p>
                          <strong>Nilai Akhir:</strong>{" "}
                          {selectedPlacement.final_score}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status Penyaluran</label>
                        <select
                          className="form-select"
                          value={placementData.status}
                          onChange={(e) =>
                            setPlacementData((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                        >
                          <option value="proses">Proses</option>
                          <option value="lolos">Lolos</option>
                          <option value="ditempatkan">Ditempatkan</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Tanggal Penempatan</label>
                        <input
                          type="date"
                          className="form-control"
                          value={placementData.placement_date}
                          onChange={(e) =>
                            setPlacementData((prev) => ({
                              ...prev,
                              placement_date: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nama Perusahaan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={placementData.company_name}
                          onChange={(e) =>
                            setPlacementData((prev) => ({
                              ...prev,
                              company_name: e.target.value,
                            }))
                          }
                          placeholder="Masukkan nama perusahaan"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Posisi/Jabatan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={placementData.position}
                          onChange={(e) =>
                            setPlacementData((prev) => ({
                              ...prev,
                              position: e.target.value,
                            }))
                          }
                          placeholder="Masukkan posisi/jabatan"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Departemen/Divisi</label>
                        <input
                          type="text"
                          className="form-control"
                          value={placementData.department}
                          onChange={(e) =>
                            setPlacementData((prev) => ({
                              ...prev,
                              department: e.target.value,
                            }))
                          }
                          placeholder="Masukkan departemen/divisi"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nama Supervisor</label>
                        <input
                          type="text"
                          className="form-control"
                          value={placementData.supervisor_name}
                          onChange={(e) =>
                            setPlacementData((prev) => ({
                              ...prev,
                              supervisor_name: e.target.value,
                            }))
                          }
                          placeholder="Masukkan nama supervisor"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Kontak Supervisor</label>
                        <input
                          type="text"
                          className="form-control"
                          value={placementData.supervisor_contact}
                          onChange={(e) =>
                            setPlacementData((prev) => ({
                              ...prev,
                              supervisor_contact: e.target.value,
                            }))
                          }
                          placeholder="Email atau telepon supervisor"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Catatan Penempatan</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={placementData.notes}
                      onChange={(e) =>
                        setPlacementData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Masukkan catatan penempatan, informasi tambahan, atau feedback..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Simpan Penempatan
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowPlacementModal(false)}
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Update Bulk Penyaluran ({selectedPlacements.length} peserta
                  terpilih)
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowBulkModal(false)}
                ></button>
              </div>
              <form onSubmit={handleBulkUpdate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Status Penyaluran</label>
                    <select
                      className="form-select"
                      value={bulkData.status}
                      onChange={(e) =>
                        setBulkData((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      <option value="ditempatkan">Ditempatkan</option>
                      <option value="lolos">Lolos</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nama Perusahaan</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bulkData.company_name}
                      onChange={(e) =>
                        setBulkData((prev) => ({
                          ...prev,
                          company_name: e.target.value,
                        }))
                      }
                      placeholder="Masukkan nama perusahaan"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Posisi/Jabatan</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bulkData.position}
                      onChange={(e) =>
                        setBulkData((prev) => ({
                          ...prev,
                          position: e.target.value,
                        }))
                      }
                      placeholder="Masukkan posisi/jabatan"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Departemen/Divisi</label>
                    <input
                      type="text"
                      className="form-control"
                      value={bulkData.department}
                      onChange={(e) =>
                        setBulkData((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      placeholder="Masukkan departemen/divisi"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Catatan</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={bulkData.notes}
                      onChange={(e) =>
                        setBulkData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Catatan untuk semua peserta yang dipilih..."
                    />
                  </div>
                  <div className="alert alert-warning">
                    <small>
                      <strong>Perhatian:</strong> Aksi ini akan mengubah data
                      penyaluran untuk {selectedPlacements.length} peserta yang
                      dipilih.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Update Semua
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBulkModal(false)}
                  >
                    Batal
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

export default PlacementManagement;
