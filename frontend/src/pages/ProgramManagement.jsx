import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ProgramManagement = () => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    description: "",
    requirements: "",
    schedule: "",
    duration: "",
    capacity: "",
    contact_info: "",
    status: "active",
    location: "Bandung, Indonesia & Jepang",
    training_cost: "",
    departure_cost: "",
    installment_plan: "none",
    bridge_fund: "Tersedia (Jaminan dari perusahaan pengirim)",
    timeline_text: "",
    training_fee_details: "",
    departure_fee_details: "",
    requirements_text: "",
  });

  useEffect(() => {
    fetchPrograms();
    fetchCategories();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/programs");
      if (response.data.success) {
        setPrograms(response.data.data);
      } else {
        setError("Gagal memuat data program");
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      setError("Error loading program data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/program-categories");
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleShowModal = (program = null) => {
    if (program) {
      setEditingProgram(program);
      setFormData({
        category_id: program.category_id || "",
        name: program.name || "",
        description: program.description || "",
        requirements: program.requirements || "",
        schedule: program.schedule || "",
        duration: program.duration || "",
        capacity: program.capacity || "",
        contact_info: program.contact_info || "",
        status: program.status || "active",
        location: program.location || "Bandung, Indonesia & Jepang",
        training_cost: program.training_cost || "",
        departure_cost: program.departure_cost || "",
        installment_plan: program.installment_plan || "none",
        bridge_fund:
          program.bridge_fund || "Tersedia (Jaminan dari perusahaan pengirim)",
        timeline_text: program.timeline_text || "",
        training_fee_details: program.training_fee_details || "",
        departure_fee_details: program.departure_fee_details || "",
        requirements_text: program.requirements_text || "",
      });
    } else {
      setEditingProgram(null);
      setFormData({
        category_id: "",
        name: "",
        description: "",
        requirements: "",
        schedule: "",
        duration: "",
        capacity: "",
        contact_info: "",
        status: "active",
        location: "Bandung, Indonesia & Jepang",
        training_cost: "",
        departure_cost: "",
        installment_plan: "none",
        bridge_fund: "Tersedia (Jaminan dari perusahaan pengirim)",
        timeline_text: "",
        training_fee_details: "",
        departure_fee_details: "",
        requirements_text: "",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProgram(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingProgram) {
        await axios.put(`/api/programs/${editingProgram.id}`, formData);
        setMessage({
          type: "success",
          text: "Program berhasil diperbarui",
        });
      } else {
        await axios.post("/api/programs", formData);
        setMessage({
          type: "success",
          text: "Program berhasil ditambahkan",
        });
      }

      setShowModal(false);
      fetchPrograms();
    } catch (error) {
      console.error("Error saving program:", error);
      setMessage({
        type: "error",
        text:
          "Gagal menyimpan program: " +
          (error.response?.data?.message || error.message),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (programId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus program ini?")) {
      return;
    }

    try {
      await axios.delete(`/api/programs/${programId}`);
      setMessage({
        type: "success",
        text: "Program berhasil dihapus",
      });
      fetchPrograms();
    } catch (error) {
      console.error("Error deleting program:", error);
      setMessage({
        type: "error",
        text:
          "Gagal menghapus program: " +
          (error.response?.data?.message || error.message),
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: "bg-success", text: "Aktif" },
      inactive: { class: "bg-secondary", text: "Tidak Aktif" },
      full: { class: "bg-warning", text: "Penuh" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "Rp 0";
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "Rp 0" : `Rp ${numValue.toLocaleString("id-ID")}`;
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
      <div className="d-flex justify-content-between align-items-center mb-4 ">
        <div>
          <h2>Manajemen Program</h2>
          <p className="text-muted">Kelola program magang yang tersedia</p>
        </div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => handleShowModal()}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Tambah Program
          </button>
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

      {/* Programs List */}
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Daftar Program</h5>

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

              {programs.length === 0 ? (
                <div className="text-center py-5">
                  <div className="display-1 text-muted mb-3">📚</div>
                  <h5>Belum ada program</h5>
                  <p className="text-muted">
                    Mulai dengan menambahkan program pertama
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-light align-middle">
                      <tr>
                        <th>Nama Program</th>
                        <th>Kategori</th>
                        <th>Durasi</th>
                        <th>Kuota</th>
                        <th>Biaya Pelatihan</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="align-middle">
                      {programs.map((program) => (
                        <tr key={program.id}>
                          <td>
                            <div>
                              <strong>{program.name}</strong>
                              <div className="small text-muted">
                                {program.description?.substring(0, 50)}...
                              </div>
                            </div>
                          </td>
                          <td>{program.category_name}</td>
                          <td>{program.duration}</td>
                          <td>
                            <span className="badge bg-primary">
                              {program.current_participants || 0} /{" "}
                              {program.capacity}
                            </span>
                          </td>
                          <td>{formatCurrency(program.training_cost)}</td>
                          <td>{getStatusBadge(program.status)}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary me-1"
                                onClick={() => handleShowModal(program)}
                                title="Edit Program"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(program.id)}
                                title="Hapus Program"
                              >
                                <i className="bi bi-trash"></i>
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
        </div>
      </div>

      {/* Modal untuk Tambah/Edit Program */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProgram ? "Edit Program" : "Tambah Program Baru"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  disabled={saving}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div
                  className="modal-body"
                  style={{ maxHeight: "70vh", overflowY: "auto" }}
                >
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Nama Program *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Kategori *</label>
                        <select
                          className="form-select"
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Pilih Kategori</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Deskripsi</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Persyaratan</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleChange}
                      placeholder="Masukkan persyaratan program, pisahkan dengan baris baru"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Jadwal</label>
                        <input
                          type="text"
                          className="form-control"
                          name="schedule"
                          value={formData.schedule}
                          onChange={handleChange}
                          placeholder="Contoh: Senin-Jumat, 09:00-17:00"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Durasi</label>
                        <input
                          type="text"
                          className="form-control"
                          name="duration"
                          value={formData.duration}
                          onChange={handleChange}
                          placeholder="Contoh: 3 bulan"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Kuota</label>
                        <input
                          type="number"
                          className="form-control"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Tidak Aktif</option>
                          <option value="full">Penuh</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Biaya Pelatihan</label>
                        <input
                          type="number"
                          className="form-control"
                          name="training_cost"
                          value={formData.training_cost}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          Biaya Keberangkatan
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="departure_cost"
                          value={formData.departure_cost}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Rencana Cicilan</label>
                        <select
                          className="form-select"
                          name="installment_plan"
                          value={formData.installment_plan}
                          onChange={handleChange}
                        >
                          <option value="none">Tidak Ada</option>
                          <option value="4_installments">4 Cicilan</option>
                          <option value="6_installments">6 Cicilan</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Lokasi</label>
                        <input
                          type="text"
                          className="form-control"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Info Kontak</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      name="contact_info"
                      value={formData.contact_info}
                      onChange={handleChange}
                      placeholder="Email: ...&#10;Telp: ...&#10;Alamat: ..."
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Dana Talang</label>
                    <input
                      type="text"
                      className="form-control"
                      name="bridge_fund"
                      value={formData.bridge_fund}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Timeline Text */}
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Timeline Program</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          name="timeline_text"
                          value={formData.timeline_text}
                          onChange={handleChange}
                          placeholder="Masukkan timeline program, pisahkan dengan baris baru&#10;Contoh:&#10;Bulan 1: Pelatihan Dasar&#10;Bulan 2: Pelatihan Lanjutan&#10;Bulan 3: Persiapan Keberangkatan"
                        />
                        <div className="form-text">
                          Masukkan timeline program dengan format teks biasa,
                          pisahkan setiap fase dengan baris baru
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Training Fee Details */}
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Detail Biaya Pelatihan
                        </label>
                        <textarea
                          className="form-control"
                          rows="4"
                          name="training_fee_details"
                          value={formData.training_fee_details}
                          onChange={handleChange}
                          placeholder="Masukkan detail biaya pelatihan, pisahkan dengan baris baru&#10;Contoh:&#10; Biaya administrasi&#10; Modul pembelajaran&#10; Seragam&#10; Asrama"
                        />
                        <div className="form-text">
                          Masukkan detail item biaya pelatihan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Departure Fee Details */}
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Detail Biaya Keberangkatan
                        </label>
                        <textarea
                          className="form-control"
                          rows="4"
                          name="departure_fee_details"
                          value={formData.departure_fee_details}
                          onChange={handleChange}
                          placeholder="Masukkan detail biaya keberangkatan, pisahkan dengan baris baru&#10;Contoh:&#10; Tiket pesawat&#10; Visa & dokumen&#10; Asuransi&#10; Biaya penempatan"
                        />
                        <div className="form-text">
                          Masukkan detail item biaya keberangkatan
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements Text */}
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Daftar Persyaratan Peserta
                        </label>
                        <textarea
                          className="form-control"
                          rows="4"
                          name="requirements_text"
                          value={formData.requirements_text}
                          onChange={handleChange}
                          placeholder="Masukkan persyaratan peserta, pisahkan dengan baris baru&#10;Contoh:&#10; Usia minimal 18 tahun&#10; Pendidikan minimal SMA&#10; Sehat jasmani dan rohani"
                        />
                        <div className="form-text">
                          Masukkan daftar persyaratan peserta, pisahkan setiap persyaratan dengan baris baru
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
                      "Simpan Program"
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

export default ProgramManagement;
