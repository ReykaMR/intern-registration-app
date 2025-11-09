import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const SelectionManagement = () => {
  const [selections, setSelections] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    program: "all",
    status: "all",
    search: "",
  });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [evaluationData, setEvaluationData] = useState({
    status: "menunggu",
    test_score: "",
    interview_score: "",
    final_score: "",
    notes: "",
  });
  const [bulkData, setBulkData] = useState({
    status: "lolos",
    notes: "",
  });
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchSelections();
    fetchPrograms();
    fetchStatistics();
  }, [filters]);

  const fetchSelections = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "all" && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(`/api/selection?${params}`);
      if (response.data.success) {
        setSelections(response.data.data);
      } else {
        setError("Failed to fetch selection data");
      }
    } catch (error) {
      console.error("Error fetching selections:", error);
      setError("Error loading selection data");
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
      const response = await axios.get("/api/selection/statistics");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching selection statistics:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEvaluateCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setEvaluationData({
      status: candidate.status || "menunggu",
      test_score: candidate.test_score || "",
      interview_score: candidate.interview_score || "",
      final_score: candidate.final_score || "",
      notes: candidate.notes || "",
    });
    setShowEvaluationModal(true);
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      const data = {
        ...evaluationData,
        evaluated_by: user.id,
      };

      const response = await axios.put(
        `/api/selection/${selectedCandidate.registration_id}`,
        data
      );

      if (response.data.success) {
        alert("Evaluation submitted successfully");
        setShowEvaluationModal(false);
        fetchSelections();
        fetchStatistics();
      }
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      alert("Error submitting evaluation");
    }
  };

  const handleBulkUpdate = async (e) => {
    e.preventDefault();
    if (selectedCandidates.length === 0) {
      alert("Please select at least one candidate");
      return;
    }

    try {
      const data = {
        registration_ids: selectedCandidates,
        ...bulkData,
        evaluated_by: user.id,
      };

      const response = await axios.post("/api/selection/bulk-update", data);
      if (response.data.success) {
        alert(response.data.message);
        setShowBulkModal(false);
        setSelectedCandidates([]);
        fetchSelections();
        fetchStatistics();
      }
    } catch (error) {
      console.error("Error in bulk update:", error);
      alert("Error performing bulk update");
    }
  };

  const toggleCandidateSelection = (registrationId) => {
    setSelectedCandidates((prev) =>
      prev.includes(registrationId)
        ? prev.filter((id) => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  const selectAllCandidates = () => {
    if (selectedCandidates.length === selections.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(selections.map((s) => s.registration_id));
    }
  };

  const getStatusBadge = (status) => {
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

  const calculateGrade = (score) => {
    if (!score) return "-";
    if (score >= 85) return "A";
    if (score >= 75) return "B";
    if (score >= 65) return "C";
    if (score >= 55) return "D";
    return "E";
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
              <h2 className="mb-1">Manajemen Seleksi</h2>
              <p className="text-muted mb-0">
                Kelola proses seleksi dan evaluasi peserta
              </p>
            </div>
            <div>
              <button
                className="btn btn-primary me-2"
                onClick={() => setShowBulkModal(true)}
                disabled={selections.length === 0}
              >
                📊 Update Bulk
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={fetchSelections}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.total_candidates}</h4>
                <p className="mb-0">Total</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.pending_selection}</h4>
                <p className="mb-0">Menunggu</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.passed_stage_1}</h4>
                <p className="mb-0">Lolos 1</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.passed_stage_2}</h4>
                <p className="mb-0">Lolos 2</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.passed_final}</h4>
                <p className="mb-0">Lolos</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h4 className="mb-0">{stats.statistics.failed}</h4>
                <p className="mb-0">Tidak Lolos</p>
              </div>
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
              <label className="form-label">Status Seleksi</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="menunggu">Menunggu</option>
                <option value="lolos_tahap_1">Lolos Tahap 1</option>
                <option value="lolos_tahap_2">Lolos Tahap 2</option>
                <option value="lolos">Lolos</option>
                <option value="tidak_lolos">Tidak Lolos</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, or registration code..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selection Table */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            Data Seleksi ({selections.length})
            {selectedCandidates.length > 0 && (
              <span className="badge bg-primary ms-2">
                {selectedCandidates.length} selected
              </span>
            )}
          </h5>
        </div>
        <div className="card-body">
          {selections.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 text-muted mb-3">📋</div>
              <h5>No selection data found</h5>
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
                          selectedCandidates.length === selections.length
                        }
                        onChange={selectAllCandidates}
                      />
                    </th>
                    <th>Peserta</th>
                    <th>Program</th>
                    <th>Test Score</th>
                    <th>Interview</th>
                    <th>Final Score</th>
                    <th>Status</th>
                    <th>Evaluator</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selections.map((selection) => (
                    <tr key={selection.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(
                            selection.registration_id
                          )}
                          onChange={() =>
                            toggleCandidateSelection(selection.registration_id)
                          }
                        />
                      </td>
                      <td>
                        <strong>{selection.full_name}</strong>
                        <div>
                          <small className="text-muted">
                            {selection.email}
                          </small>
                        </div>
                        <div>
                          <small>Kode: {selection.registration_code}</small>
                        </div>
                      </td>
                      <td>{selection.program_name}</td>
                      <td>
                        {selection.test_score ? (
                          <>
                            <strong>{selection.test_score}</strong>
                            <br />
                            <small className="text-muted">
                              {calculateGrade(selection.test_score)}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {selection.interview_score ? (
                          <>
                            <strong>{selection.interview_score}</strong>
                            <br />
                            <small className="text-muted">
                              {calculateGrade(selection.interview_score)}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {selection.final_score ? (
                          <>
                            <strong>{selection.final_score}</strong>
                            <br />
                            <small className="text-muted">
                              {calculateGrade(selection.final_score)}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{getStatusBadge(selection.status)}</td>
                      <td>
                        {selection.evaluated_by_name ? (
                          <>
                            {selection.evaluated_by_name}
                            <br />
                            <small className="text-muted">
                              {selection.evaluated_at &&
                                new Date(
                                  selection.evaluated_at
                                ).toLocaleDateString("id-ID")}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">Belum dievaluasi</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleEvaluateCandidate(selection)}
                            title="Evaluate Candidate"
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

      {/* Evaluation Modal */}
      {showEvaluationModal && selectedCandidate && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Evaluasi Peserta</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowEvaluationModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEvaluationSubmit}>
                <div className="modal-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6>Informasi Peserta</h6>
                      <p>
                        <strong>Nama:</strong> {selectedCandidate.full_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedCandidate.email}
                      </p>
                      <p>
                        <strong>Program:</strong>{" "}
                        {selectedCandidate.program_name}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6>Status Saat Ini</h6>
                      <p>
                        <strong>Status Seleksi:</strong>{" "}
                        {getStatusBadge(selectedCandidate.status)}
                      </p>
                      <p>
                        <strong>Test Score:</strong>{" "}
                        {selectedCandidate.test_score || "-"}
                      </p>
                      <p>
                        <strong>Interview Score:</strong>{" "}
                        {selectedCandidate.interview_score || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Test Score (0-100)</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="100"
                          step="0.1"
                          value={evaluationData.test_score}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              test_score: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">
                          Interview Score (0-100)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="100"
                          step="0.1"
                          value={evaluationData.interview_score}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              interview_score: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">
                          Final Score (auto-calculated)
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max="100"
                          step="0.1"
                          value={evaluationData.final_score}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              final_score: e.target.value,
                            }))
                          }
                          readOnly={
                            evaluationData.test_score &&
                            evaluationData.interview_score
                          }
                        />
                        <div className="form-text">
                          {evaluationData.test_score &&
                          evaluationData.interview_score
                            ? "Auto-calculated as average"
                            : "Enter manually or provide both scores"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status Seleksi</label>
                        <select
                          className="form-select"
                          value={evaluationData.status}
                          onChange={(e) =>
                            setEvaluationData((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                        >
                          <option value="menunggu">Menunggu</option>
                          <option value="lolos_tahap_1">Lolos Tahap 1</option>
                          <option value="lolos_tahap_2">Lolos Tahap 2</option>
                          <option value="lolos">Lolos</option>
                          <option value="tidak_lolos">Tidak Lolos</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Catatan Evaluasi</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={evaluationData.notes}
                      onChange={(e) =>
                        setEvaluationData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Masukkan catatan evaluasi, feedback, atau alasan keputusan..."
                    />
                  </div>

                  {/* {selectedCandidate.application_letter && (
                    <div className="mt-3">
                      <h6>Surat Lamaran</h6>
                      <div className="bg-light p-3 rounded small">
                        {selectedCandidate.application_letter}
                      </div>
                    </div>
                  )} */}
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">
                    Simpan Evaluasi
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEvaluationModal(false)}
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
                  Update Bulk ({selectedCandidates.length} peserta terpilih)
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
                    <label className="form-label">Status Seleksi</label>
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
                      <option value="lolos_tahap_1">Lolos Tahap 1</option>
                      <option value="lolos_tahap_2">Lolos Tahap 2</option>
                      <option value="lolos">Lolos</option>
                      <option value="tidak_lolos">Tidak Lolos</option>
                    </select>
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
                      <strong>Perhatian:</strong> Aksi ini akan mengubah status
                      seleksi untuk {selectedCandidates.length} peserta yang
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

export default SelectionManagement;
