import React, { useState, useEffect } from "react";
import axios from "axios";

const FinancialReports = () => {
  const [summary, setSummary] = useState(null);
  const [detailedReports, setDetailedReports] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    program: "all",
    start_date: "",
    end_date: "",
    status: "all",
    search: "",
  });

  useEffect(() => {
    fetchFinancialData();
  }, [filters]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchFinancialSummary(),
        fetchDetailedReports(),
        fetchPrograms(),
      ]);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      setError("Gagal memuat data keuangan");
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "all" && filters[key] !== "" && key !== "search") {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `/api/reports/financial/summary?${params}`
      );
      if (response.data.success) {
        setSummary(response.data.data);
      } else {
        setError("Gagal memuat ringkasan keuangan");
      }
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      throw error;
    }
  };

  const fetchDetailedReports = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "all" && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `/api/reports/financial/detailed?${params}`
      );
      if (response.data.success) {
        setDetailedReports(response.data.data);
      } else {
        setError("Gagal memuat detail transaksi");
      }
    } catch (error) {
      console.error("Error fetching detailed reports:", error);
      throw error;
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
      throw error;
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      program: "all",
      start_date: "",
      end_date: "",
      status: "all",
      search: "",
    });
  };

  const handleExportExcel = async () => {
    try {
      setExportLoading(true);
      setError("");

      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "all" && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `/api/reports/financial/export/excel?${params}`,
        {
          responseType: "blob",
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `laporan-keuangan-${new Date().toISOString().split("T")[0]}.xlsx`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      const errorMessage =
        error.response?.status === 404
          ? "Fitur export Excel belum tersedia"
          : "Gagal mengekspor ke Excel. Silakan coba lagi.";
      setError(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      setError("");

      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== "all" && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const response = await axios.get(
        `/api/reports/financial/export/pdf?${params}`,
        {
          responseType: "blob",
          timeout: 30000,
        }
      );

      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `laporan-keuangan-${new Date().toISOString().split("T")[0]}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      const errorMessage =
        error.response?.status === 404
          ? "Fitur export PDF belum tersedia"
          : "Gagal mengekspor ke PDF. Silakan coba lagi.";
      setError(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return "Rp 0";
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "Rp 0" : `Rp ${numValue.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID");
    } catch (error) {
      return "-";
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "bg-warning text-dark", text: "Menunggu" },
      installment_1: { class: "bg-info", text: "Cicilan 1" },
      installment_2: { class: "bg-info", text: "Cicilan 2" },
      installment_3: { class: "bg-info", text: "Cicilan 3" },
      installment_4: { class: "bg-info", text: "Cicilan 4" },
      installment_5: { class: "bg-info", text: "Cicilan 5" },
      installment_6: { class: "bg-info", text: "Cicilan 6" },
      paid: { class: "bg-success", text: "Lunas" },
      overdue: { class: "bg-danger", text: "Jatuh Tempo" },
      cancelled: { class: "bg-secondary", text: "Dibatalkan" },
    };
    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      transfer: "Transfer Bank",
      cash: "Tunai",
      credit_card: "Kartu Kredit",
    };
    return methods[method] || method;
  };

  const getInstallmentText = (payment) => {
    if (payment.status === "paid") return "Lunas";
    if (payment.status === "pending") return "Menunggu Pembayaran";
    if (payment.status.startsWith("installment_")) {
      const installmentNum = payment.status.split("_")[1];
      const totalAmount = parseFloat(payment.amount) || 0;
      const paidAmount = parseFloat(payment.amount_paid) || 0;
      const progress =
        totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
      return `Cicilan ${installmentNum} (${progress}%)`;
    }
    return payment.status;
  };

  const calculateRemainingBalance = () => {
    if (!summary?.summary) return 0;
    const totalAmount = parseFloat(summary.summary.total_amount || 0);
    const totalPaid = parseFloat(summary.summary.total_amount_paid || 0);
    return totalAmount - totalPaid;
  };

  if (loading && !summary) {
    return (
      <div className="container mt-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary mb-3"
              style={{ width: "3rem", height: "3rem" }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Memuat laporan keuangan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col">
          <h2>Laporan Keuangan</h2>
          <p className="text-muted">
            Monitoring dan analisis data keuangan program magang
          </p>
        </div>
      </div>

      {/* Alert Message */}
      {error && (
        <div
          className="alert alert-warning alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-white mb-1">
                      Total Pemasukan
                    </h6>
                    <h4 className="text-white mb-0">
                      {formatCurrency(summary.summary?.total_revenue)}
                    </h4>
                    <small className="text-white">
                      {summary.summary?.total_transactions} transaksi
                    </small>
                  </div>
                  <div className="text-white">
                    <i className="bi bi-cash-coin fs-2"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-white mb-1">
                      Menunggu Verifikasi
                    </h6>
                    <h4 className="text-white mb-0">
                      {formatCurrency(summary.summary?.total_pending)}
                    </h4>
                    <small className="text-white">Belum dikonfirmasi</small>
                  </div>
                  <div className="text-white">
                    <i className="bi bi-clock fs-2"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-white mb-1">
                      Estimasi Tunggakan
                    </h6>
                    <h4 className="text-white mb-0">
                      {formatCurrency(summary.summary?.total_outstanding)}
                    </h4>
                    <small className="text-white">
                      {formatCurrency(summary.summary?.total_overdue)} overdue
                    </small>
                  </div>
                  <div className="text-white">
                    <i className="bi bi-exclamation-triangle fs-2"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-primary">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="card-title text-white mb-1">Sisa Tagihan</h6>
                    <h4 className="text-white mb-0">
                      {formatCurrency(calculateRemainingBalance())}
                    </h4>
                    <small className="text-white">Belum dibayar</small>
                  </div>
                  <div className="text-white">
                    <i className="bi bi-receipt fs-2"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="card mb-4">
        <div className="card-header bg-light">
          <h5 className="mb-0">
            Filter & Pencarian
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
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
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
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
              <label className="form-label">Tanggal Mulai</label>
              <input
                type="date"
                className="form-control"
                value={filters.start_date}
                onChange={(e) =>
                  handleFilterChange("start_date", e.target.value)
                }
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Tanggal Akhir</label>
              <input
                type="date"
                className="form-control"
                value={filters.end_date}
                onChange={(e) => handleFilterChange("end_date", e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Pencarian</label>
              <input
                type="text"
                className="form-control"
                placeholder="Cari nama, email, atau invoice..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
            <div className="col-md-12">
              <div className="d-flex justify-content-between">
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleResetFilters}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset Filter
                </button>
                <button
                  className="btn btn-primary"
                  onClick={fetchFinancialData}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Memuat...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-2"></i>
                      Terapkan Filter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">
                    <i className="bi bi-download me-2"></i>
                    Ekspor Laporan
                  </h5>
                  <p className="text-muted mb-0">
                    Download laporan dalam format Excel atau PDF
                  </p>
                </div>
                <div>
                  <button
                    className="btn btn-success me-2"
                    onClick={handleExportExcel}
                    disabled={exportLoading || detailedReports.length === 0}
                  >
                    {exportLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-file-earmark-excel me-2"></i>
                        Excel
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleExportPDF}
                    disabled={exportLoading || detailedReports.length === 0}
                  >
                    {exportLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                Detail Transaksi ({detailedReports.length})
              </h5>
              <div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchFinancialData}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  {loading ? "Memuat..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div
                    className="spinner-border text-primary mb-3"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="text-muted">Memuat data transaksi...</p>
                </div>
              ) : detailedReports.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-muted mb-3">
                    <i className="bi bi-receipt fs-1"></i>
                  </div>
                  <h5>Tidak ada data transaksi</h5>
                  <p className="text-muted">
                    Coba ubah filter atau tanggal untuk melihat data
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-light align-middle">
                      <tr>
                        <th width="50">#</th>
                        <th width="150">Invoice</th>
                        <th>Nama Peserta</th>
                        <th width="120">Program</th>
                        <th width="120">Status</th>
                        <th width="150">Jenis Pembayaran</th>
                        <th width="120">Total Tagihan</th>
                        <th width="120">Sudah Dibayar</th>
                        <th width="100">Metode</th>
                        <th width="120">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="align-middle">
                      {detailedReports.map((report, index) => (
                        <tr key={report.id}>
                          <td className="text-muted">{index + 1}</td>
                          <td>
                            <div>
                              <strong className="text-primary">
                                {report.invoice_number}
                              </strong>
                              {report.receipt_number && (
                                <div>
                                  <small className="text-success">
                                    <i className="bi bi-receipt me-1"></i>
                                    {report.receipt_number}
                                  </small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <strong>{report.full_name}</strong>
                              <div>
                                <small className="text-muted">
                                  <i className="bi bi-envelope me-1"></i>
                                  {report.email}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary text-white">
                              {report.program_name}
                            </span>
                          </td>
                          <td>{getStatusBadge(report.status)}</td>
                          <td>
                            <small>{getInstallmentText(report)}</small>
                          </td>
                          <td className="fw-bold text-end">
                            {formatCurrency(report.amount)}
                          </td>
                          <td
                            className={`text-end ${
                              parseFloat(report.amount_paid || 0) >=
                              parseFloat(report.amount || 0)
                                ? "text-success fw-bold"
                                : "text-warning"
                            }`}
                          >
                            {formatCurrency(report.amount_paid)}
                          </td>
                          <td>
                            {report.payment_method && (
                              <span className="badge bg-light text-dark">
                                {getPaymentMethodText(report.payment_method)}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="small">
                              {formatDate(
                                report.payment_date || report.created_at
                              )}
                            </div>
                            {report.due_date && (
                              <div className="small text-muted">
                                Jatuh tempo: {formatDate(report.due_date)}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {summary && (
                      <tfoot className="table-light align-middle">
                        <tr>
                          <td colSpan="6" className="text-end fw-bold">
                            TOTAL:
                          </td>
                          <td className="fw-bold text-end">
                            {formatCurrency(summary.summary?.total_amount)}
                          </td>
                          <td className="fw-bold text-end">
                            {formatCurrency(summary.summary?.total_amount_paid)}
                          </td>
                          <td colSpan="2">
                            <small className="text-muted">
                              Sisa:{" "}
                              {formatCurrency(calculateRemainingBalance())}
                            </small>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
