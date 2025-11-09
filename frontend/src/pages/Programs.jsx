import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import helpers from "../utils/helpers";

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await axios.get("/api/programs");
      if (response.data.success) {
        setPrograms(response.data.data);
      } else {
        setError("Failed to fetch programs");
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      setError("Error loading programs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(programs.map((p) => p.category_name))];
  const filteredPrograms =
    selectedCategory === "all"
      ? programs
      : programs.filter((p) => p.category_name === selectedCategory);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <div className="text-center mt-3">
          <p>Loading programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h5>Error Loading Programs</h5>
          <p className="mb-0">{error}</p>
          <button
            className="btn btn-sm btn-outline-danger mt-2"
            onClick={fetchPrograms}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Program Magang Tersedia</h2>
              <p className="text-muted">
                Pilih program yang sesuai dengan minat dan kemampuan Anda
              </p>
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="mb-4">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${
                    selectedCategory === "all"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => setSelectedCategory("all")}
                >
                  Semua Program
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`btn ${
                      selectedCategory === category
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Programs Grid */}
          <div className="row">
            {filteredPrograms.length === 0 ? (
              <div className="col-12">
                <div className="alert alert-info text-center">
                  <h5>Tidak ada program yang tersedia</h5>
                  <p className="mb-0">
                    Silakan coba kategori lain atau hubungi administrator.
                  </p>
                </div>
              </div>
            ) : (
              filteredPrograms.map((program) => (
                <div key={program.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className="card h-100 shadow-sm">
                    <div className="card-header bg-transparent">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-1">{program.name}</h5>
                        <span className="badge bg-primary">
                          {" "}
                          {program.category_name}{" "}
                        </span>
                      </div>
                    </div>

                    <div className="card-body">
                      <p className="card-text text-muted">
                        {program.description}
                      </p>

                      <div className="program-details">
                        <div className="mb-2">
                          <strong>Jadwal:</strong>
                          <p className="mb-1 small">{program.schedule}</p>
                        </div>

                        <div className="mb-2">
                          <strong>Durasi:</strong>
                          <p className="mb-1 small">{program.duration}</p>
                        </div>

                        <div className="mb-2">
                          <strong>Lokasi:</strong>
                          <p className="mb-1 small">{program.location}</p>
                        </div>

                        {/* FORMAT: Biaya Pelatihan */}
                        <div className="mb-2">
                          <strong>Biaya Pelatihan:</strong>
                          <h6 className="mb-1">
                            {helpers.formatCurrency(program.training_cost)}
                          </h6>
                        </div>

                        {/* FORMAT: Biaya Keberangkatan */}
                        <div className="mb-2">
                          <strong>Biaya Keberangkatan:</strong>
                          <h6 className="mb-1">
                            {helpers.formatCurrency(program.departure_cost)}
                          </h6>
                        </div>

                        <div className="mb-2">
                          <strong>Kuota Tersedia:</strong>
                          <p className="mb-1">
                            <span className="badge bg-primary">
                              {program.current_participants || 0} /{" "}
                              {program.capacity} peserta
                            </span>
                          </p>
                        </div>

                        {program.requirements && (
                          <div className="mb-3">
                            <strong>Persyaratan:</strong>
                            <div className="small text-muted mt-1">
                              {program.requirements
                                .split("\n")
                                .map((req, index) => (
                                  <div key={index}> {req}</div>
                                ))}
                            </div>
                          </div>
                        )}

                        {program.contact_info && (
                          <div className="mb-3">
                            <strong>Kontak:</strong>
                            <p className="small text-muted mb-1">
                              {program.contact_info}
                            </p>
                          </div>
                        )}

                        <div className="mb-2">
                          <strong>Dana Talang:</strong>
                          <p className="mb-1 small text-primary">
                            {program.bridge_fund}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer bg-transparent">
                      <div className="d-grid gap-2">
                        <Link
                          to={`/program/${program.id}`}
                          className="btn btn-outline-primary btn-sm"
                        >
                          Lihat Detail
                        </Link>
                        <Link to="/register" className="btn btn-primary">
                          Daftar Program Ini
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Programs;
