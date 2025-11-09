import React, { useState, useEffect } from "react";
import axios from "axios";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        user_type: "participant",
        password: ""
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                setSuccess("");
                setError("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/admin/users");
            setUsers(response.data.data);
        } catch (error) {
            showError("Gagal memuat data user");
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError("");
    };

    const showError = (message) => {
        setError(message);
        setSuccess("");
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone || "",
            address: user.address || "",
            user_type: user.user_type,
            password: ""
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const submitData = { ...formData };
                if (!submitData.password) {
                    delete submitData.password;
                }

                await axios.put(`/api/admin/users/${editingUser.id}`, submitData);
                showSuccess("User berhasil diperbarui!");
            } else {
                if (!formData.password) {
                    showError("Password wajib diisi untuk user baru");
                    return;
                }
                await axios.post("/api/admin/users", formData);
                showSuccess("User berhasil ditambahkan!");
            }

            setShowModal(false);
            setEditingUser(null);
            setFormData({
                full_name: "",
                email: "",
                phone: "",
                address: "",
                user_type: "participant",
                password: ""
            });
            fetchUsers();
        } catch (error) {
            const message = error.response?.data?.message || "Gagal menyimpan data user";
            showError(message);
        }
    };

    const handleDelete = async (userId) => {
        const userToDelete = users.find(user => user.id === userId);

        if (window.confirm(
            `Apakah Anda yakin ingin menghapus user "${userToDelete?.full_name}"?\n\n` +
            "PERHATIAN: Semua data user termasuk:\n" +
            "• Data pendaftaran\n" +
            "• Data pembayaran\n" +
            "• File foto, dokumen, dan bukti pembayaran\n" +
            "• Jumlah peserta program akan disesuaikan\n" +
            "akan dihapus secara permanen!"
        )) {
            try {
                const response = await axios.delete(`/api/admin/users/${userId}`);
                showSuccess(response.data.message);
                fetchUsers();
            } catch (error) {
                const message = error.response?.data?.message || "Gagal menghapus user";
                showError(message);
            }
        }
    };

    const handleSyncParticipants = async () => {
        try {
            setLoading(true);
            const response = await axios.post("/api/programs/sync-participants");
            showSuccess(response.data.message);
        } catch (error) {
            const message = error.response?.data?.message || "Gagal sinkronisasi participants";
            showError(message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            full_name: "",
            email: "",
            phone: "",
            address: "",
            user_type: "participant",
            password: ""
        });
        setEditingUser(null);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        resetForm();
    };

    if (loading && users.length === 0) {
        return (
            <div className="container-fluid">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <span className="ms-3">Memuat data user...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* Notifications */}
            <div className="notification-container" style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1060 }}>
                {success && (
                    <div className="alert alert-success alert-dismissible fade show shadow" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {success}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setSuccess("")}
                        ></button>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show shadow" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                        <button
                            type="button"
                            className="btn-close"
                            onClick={() => setError("")}
                        ></button>
                    </div>
                )}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="text-primary">Manajemen User</h2>
                    <p className="text-muted">Kelola data pengguna sistem</p>
                </div>
                <div>
                    <button
                        className="btn btn-success me-2"
                        onClick={handleSyncParticipants}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Sync...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Sinkron User
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Tambah User
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h5 className="card-title mb-0">
                        Daftar User ({users.length})
                    </h5>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover table-striped mb-0">
                            <thead className="table-light align-middle">
                                <tr>
                                    <th className="ps-4">Nama</th>
                                    <th>Email</th>
                                    <th>Telepon</th>
                                    <th>Tipe User</th>
                                    <th>Tanggal Daftar</th>
                                    <th className="text-center pe-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="align-middle">
                                {users.map((user) => (
                                    <tr key={user.id} className="align-middle">
                                        <td className="ps-4">
                                            <div className="d-flex align-items-center">
                                                <div className="user-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                                                    style={{ width: '36px', height: '36px' }}>
                                                    <i className="bi bi-person-fill text-white"></i>
                                                </div>
                                                <div>
                                                    <div className="fw-semibold">{user.full_name}</div>
                                                    {user.user_type === 'admin' && (
                                                        <small className="text-muted">Administrator</small>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-truncate" style={{ maxWidth: '200px' }} title={user.email}>
                                                {user.email}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={user.phone ? '' : 'text-muted'}>
                                                {user.phone || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${user.user_type === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                                                <i className={`bi ${user.user_type === 'admin' ? 'bi-shield-check' : 'bi-person'} me-1`}></i>
                                                {user.user_type === 'admin' ? 'Admin' : 'Peserta'}
                                            </span>
                                        </td>
                                        <td>
                                            <div>
                                                {new Date(user.created_at).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <small className="text-muted">
                                                {new Date(user.created_at).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </small>
                                        </td>
                                        <td className="text-center">
                                            <div className="btn-group" role="group">
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-1"
                                                    onClick={() => handleEdit(user)}
                                                    title="Edit User"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={user.user_type === 'admin'}
                                                    title={user.user_type === 'admin' ? 'Tidak dapat menghapus admin' : 'Hapus user'}
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

                    {users.length === 0 && !loading && (
                        <div className="text-center py-5">
                            <i className="bi bi-people display-1 text-muted"></i>
                            <h5 className="text-muted mt-3">Belum ada user terdaftar</h5>
                            <p className="text-muted">Klik tombol "Tambah User" untuk menambahkan user pertama</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal untuk Add/Edit User */}
            {showModal && (
                <div
                    className="modal fade show"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    tabIndex="-1"
                >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <i className={`bi ${editingUser ? 'bi-pencil' : 'bi-plus-circle'} me-2`}></i>
                                    {editingUser ? 'Edit User' : 'Tambah User Baru'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeModal}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="full_name" className="form-label">
                                                    <i className="bi bi-person me-1 text-primary"></i>
                                                    Nama Lengkap *
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="full_name"
                                                    value={formData.full_name}
                                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                    required
                                                    placeholder="Masukkan nama lengkap"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="email" className="form-label">
                                                    <i className="bi bi-envelope me-1 text-primary"></i>
                                                    Email *
                                                </label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    id="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                    placeholder="contoh@email.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="phone" className="form-label">
                                                    <i className="bi bi-telephone me-1 text-primary"></i>
                                                    Telepon
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="08xxxxxxxxxx"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="user_type" className="form-label">
                                                    <i className="bi bi-person-badge me-1 text-primary"></i>
                                                    Tipe User *
                                                </label>
                                                <select
                                                    className="form-select"
                                                    id="user_type"
                                                    value={formData.user_type}
                                                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                                                    required
                                                >
                                                    <option value="participant">Peserta</option>
                                                    <option value="admin">Administrator</option>
                                                </select>
                                                <div className="form-text">
                                                    {formData.user_type === 'admin'
                                                        ? 'User dengan akses penuh ke sistem admin'
                                                        : 'User biasa yang dapat mendaftar program'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="address" className="form-label">
                                            <i className="bi bi-geo-alt me-1 text-primary"></i>
                                            Alamat
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id="address"
                                            rows="3"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Masukkan alamat lengkap"
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label">
                                            <i className="bi bi-key me-1 text-primary"></i>
                                            {editingUser ? 'Password (kosongkan jika tidak ingin mengubah)' : 'Password *'}
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required={!editingUser}
                                            placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password minimal 6 karakter"}
                                            minLength={6}
                                        />
                                        <div className="form-text">
                                            {editingUser
                                                ? 'Biarkan kosong untuk mempertahankan password saat ini'
                                                : 'Password minimal 6 karakter'
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeModal}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className={`bi ${editingUser ? 'bi-check-circle' : 'bi-save'} me-2`}></i>
                                        {editingUser ? 'Update User' : 'Simpan User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading overlay for table operations */}
            {loading && users.length > 0 && (
                <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;