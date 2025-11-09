import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import helpers from "../utils/helpers";

const ProgramDetail = () => {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProgram();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const response = await axios.get(`/api/programs/${id}`);
      if (response.data.success) {
        setProgram(response.data.data);
      } else {
        setError("Program tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching program:", error);
      setError("Error loading program details");
    } finally {
      setLoading(false);
    }
  };

  const formatTextToList = (text) => {
    if (!text) return [];
    return text.split("\n").filter((item) => item.trim() !== "");
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h5>Error</h5>
          <p className="mb-0">{error || "Program tidak ditemukan"}</p>
          <Link to="/programs" className="btn btn-outline-danger mt-2">
            Kembali ke Daftar Program
          </Link>
        </div>
      </div>
    );
  }

  const timelineItems = formatTextToList(program.timeline_text);
  const trainingFeeItems = formatTextToList(program.training_fee_details);
  const departureFeeItems = formatTextToList(program.departure_fee_details);
  const requirementsItems = formatTextToList(program.requirements_text);

  return (
    <>
      {/* Hero Section */}
      <section
        className="position-relative d-flex align-items-center"
        style={{
          minHeight: "60vh",
          background: "linear-gradient(to right, #00294B 0%, #005792 100%)"
        }}
        aria-label={`Program ${program.name}`}
      >
        <div className="container position-relative text-center text-light">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <h1 className="fw-bold mb-3 display-4">{program.name}</h1>
              <p className="lead mb-4 fs-5">{program.description}</p>
              <div className="d-flex gap-3 flex-column flex-sm-row justify-content-center">
                <Link
                  to="/register"
                  className="btn btn-lg btn-light text-primary px-4 fw-semibold"
                >
                  Register Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mt-5">
        {/* Overview Program */}
        <section className="mb-5">
          <h2 className="text-center mb-4 text-uppercase fw-bold text-primary">
            Overview Program
          </h2>
          <div className="row g-4">
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <i className="bi bi-calendar3 text-primary fs-1"></i>
                  </div>
                  <h5 className="card-title text-uppercase fw-bold">Jadwal</h5>
                  <p className="card-text text-muted">{program.schedule}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <i className="bi bi-clock text-primary fs-1"></i>
                  </div>
                  <h5 className="card-title text-uppercase fw-bold">Durasi</h5>
                  <p className="card-text text-muted">{program.duration}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <i className="bi bi-geo-alt text-primary fs-1"></i>
                  </div>
                  <h5 className="card-title text-uppercase fw-bold">Lokasi</h5>
                  <p className="card-text text-muted">{program.location}</p>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm hover-shadow">
                <div className="card-body text-center p-4">
                  <div className="mb-3">
                    <i className="bi bi-people text-primary fs-1"></i>
                  </div>
                  <h5 className="card-title text-uppercase fw-bold">Kuota</h5>
                  <p className="card-text text-muted">
                    {program.current_participants || 0} / {program.capacity}{" "}
                    Peserta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        {timelineItems.length > 0 && (
          <section className="mb-5">
            <h2 className="text-center mb-4 text-uppercase fw-bold text-primary">
              Timeline Program
            </h2>
            <div className="row g-4">
              {timelineItems.map((item, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div className="card h-100 border-0 shadow-sm text-center hover-shadow">
                    <div className="card-body p-4">
                      <div className="mb-3">
                        <div
                          className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold fs-4"
                          style={{ width: "60px", height: "60px" }}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <p className="card-text text-muted">{item}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Program Fees & Details */}
        <section className="mb-5">
          <h2 className="text-center mb-4 text-uppercase fw-bold text-primary">
            Biaya & Detail Program
          </h2>
          <div className="row g-4">
            {/* Biaya Pelatihan */}
            <div className="col-lg-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-header bg-primary text-white text-center">
                  <h5 className="card-title mb-0 text-uppercase fw-bold">
                    Biaya Pelatihan
                  </h5>
                  <h4 className="mb-0 fw-bold mt-2">
                    {helpers.formatCurrency(program.training_cost)}
                  </h4>
                </div>
                <div className="card-body">
                  {trainingFeeItems.length > 0 ? (
                    <ul className="list-unstyled">
                      {trainingFeeItems.map((item, index) => (
                        <li
                          key={index}
                          className="mb-2 d-flex align-items-start"
                        >
                          <i className="bi bi-check-circle text-success me-2"></i>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">
                      Tidak ada detail biaya tambahan
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Biaya Keberangkatan */}
            <div className="col-lg-6">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-header bg-primary text-white text-center">
                  <h5 className="card-title mb-0 text-uppercase fw-bold">
                    Biaya Keberangkatan
                  </h5>
                  <h4 className="mb-0 fw-bold mt-2">
                    {helpers.formatCurrency(program.departure_cost)}
                  </h4>
                </div>
                <div className="card-body">
                  {departureFeeItems.length > 0 ? (
                    <ul className="list-unstyled">
                      {departureFeeItems.map((item, index) => (
                        <li
                          key={index}
                          className="mb-2 d-flex align-items-start"
                        >
                          <i className="bi bi-check-circle text-success me-2"></i>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted">
                      Tidak ada detail biaya tambahan
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Persyaratan Peserta */}
            {requirementsItems.length > 0 && (
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-primary text-white text-center">
                    <h5 className="card-title mb-0 text-uppercase fw-bold">
                      Persyaratan Peserta
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {requirementsItems.map((requirement, index) => (
                        <div key={index} className="col-md-6 mb-2">
                          <div className="d-flex align-items-start">
                            <i className="bi bi-check-circle text-success me-2"></i>
                            <span>{requirement}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Informasi Tambahan */}
        <section className="mb-5">
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="card-title mb-0 text-uppercase fw-bold text-center">
                    Informasi Tambahan
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6>Rencana Cicilan</h6>
                      <p className="text-muted">
                        {program.installment_plan === "none"
                          ? "Tidak tersedia cicilan"
                          : program.installment_plan === "4_installments"
                            ? "4 Kali Cicilan"
                            : "6 Kali Cicilan"}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6>Dana Talang</h6>
                      <p className="text-muted">{program.bridge_fund}</p>
                    </div>
                  </div>

                  {program.contact_info && (
                    <div className="mt-3">
                      <h6>Kontak Informasi</h6>
                      <div
                        style={{ whiteSpace: "pre-line" }}
                        className="text-muted"
                      >
                        {program.contact_info}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ProgramDetail;
