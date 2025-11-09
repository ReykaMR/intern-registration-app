import React from "react";
import { Link } from "react-router-dom";

const AboutUs = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Ahmad Wijaya",
      position: "Founder & CEO",
      image: "/images/team/ahmad.jpg",
      description:
        "Pengalaman 15+ tahun di bidang pendidikan dan pelatihan kerja internasional",
    },
    {
      id: 2,
      name: "Sari Dewi",
      position: "Head of Training",
      image: "/images/team/sari.jpg",
      description:
        "Spesialis bahasa Jepang dengan sertifikasi JLPT N1 dan pengalaman mengajar 10 tahun",
    },
    {
      id: 3,
      name: "Budi Santoso",
      position: "Placement Manager",
      image: "/images/team/budi.jpg",
      description:
        "Ahli penempatan kerja dengan jaringan luas di perusahaan-perusahaan Jepang",
    },
    {
      id: 4,
      name: "Maya Purnama",
      position: "Student Counselor",
      image: "/images/team/maya.jpg",
      description:
        "Berpengalaman dalam pendampingan dan konseling peserta pelatihan",
    },
  ];

  const legalStatus = [
    {
      id: 1,
      image: "images/legalitas/legalitas1.jpg",
      title: "Legalitas 1",
    },
    {
      id: 2,
      image: "images/legalitas/legalitas2.jpg",
      title: "Legalitas 2",
    },
    {
      id: 3,
      image: "images/legalitas/legalitas3.jpg",
      title: "Legalitas 3",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section
        className="hero-section position-relative d-flex align-items-center justify-content-center"
        style={{
          minHeight: "60vh",
          backgroundImage: "url('/images/about_us.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-label="About Us Hero Section"
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.59)" }}
          aria-hidden="true"
        ></div>

        <div className="container position-relative text-center text-white">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <h1 className="display-3 fw-bold mb-4">About Us</h1>
              <p className="lead mb-0">
                Mengenal Lebih Dekat FITALENTA dan Perjalanan Kami
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Description Section */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="display-5 fw-bold text-primary mb-4">
                Tentang FITALENTA
              </h2>
              <div className="lead text-muted">
                <p className="mb-4">
                  <strong>FITALENTA</strong> adalah lembaga pelatihan dan
                  penyaluran kerja yang berfokus pada persiapan serta
                  pendampingan individu untuk berkarier di Jepang. Kami
                  menyediakan program pelatihan yang komprehensif mencakup
                  bahasa, budaya, serta pengembangan keterampilan, sehingga
                  setiap peserta siap menghadapi tantangan dunia kerja
                  internasional.
                </p>
                <p>
                  Dengan komitmen tinggi terhadap kualitas pendidikan dan
                  integritas profesional, FITALENTA tidak hanya menjembatani
                  tenaga kerja dengan peluang, tetapi juga mendorong pertumbuhan
                  pribadi serta pemahaman lintas budaya. Misi kami adalah
                  menjadi penghubung antara Indonesia dan Jepang melalui tenaga
                  kerja yang terampil, disiplin, dan bersemangat untuk meraih
                  kesuksesan.
                </p>
              </div>
            </div>

            <div className="col-lg-6 mb-4 mb-lg-0">
              <img
                src="images/fitalenta_training.jpg"
                alt="FITALENTA Training"
                className="img-fluid rounded-3 shadow-custom"
                style={{ width: "100%", height: "400px", objectFit: "cover" }}
                onError={(e) => {
                  e.target.src =
                    "https://placehold.co/600x400/00294B/FFFFFF?text=FITALENTA+Training";
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold text-primary">
                Visi & Misi Kami
              </h2>
              <p className="lead text-muted">
                Pedoman yang Membimbing Setiap Langkah Kami
              </p>
            </div>
          </div>

          <div className="row g-5">
            {/* Vision */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 hover-shadow">
                <div className="card-header bg-primary text-white text-center py-4">
                  <i className="bi bi-eye display-4 mb-3"></i>
                  <h3 className="card-title mb-0">Visi</h3>
                </div>
                <div className="card-body p-4">
                  <p className="card-text fs-5 text-center">
                    Menjadi lembaga pelatihan dan penyaluran kerja terpercaya
                    yang mampu mencetak sumber daya manusia Indonesia yang
                    terampil, berdaya saing global, dan berintegritas tinggi,
                    khususnya untuk kesempatan kerja di Jepang.
                  </p>
                </div>
              </div>
            </div>

            {/* Mission */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 hover-shadow">
                <div className="card-header bg-primary text-white text-center py-4">
                  <i className="bi bi-bullseye display-4 mb-3"></i>
                  <h3 className="card-title mb-0">Misi</h3>
                </div>
                <div className="card-body p-4">
                  <ul className="list-unstyled">
                    <li className="mb-3 d-flex align-items-start">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <span>
                        Menyelenggarakan program pelatihan bahasa, budaya, dan
                        keterampilan kerja sesuai standar kebutuhan industri di
                        Jepang.
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <span>
                        Memberikan pendampingan menyeluruh kepada peserta, mulai
                        dari tahap pendaftaran, pelatihan, hingga proses
                        penyaluran kerja.
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <span>
                        Menjalin kerja sama dengan perusahaan dan institusi di
                        Jepang untuk menciptakan peluang kerja yang luas dan
                        berkelanjutan.
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <span>
                        Membangun generasi muda Indonesia yang disiplin,
                        profesional, serta memiliki etos kerja dan integritas
                        tinggi.
                      </span>
                    </li>
                    <li className="d-flex align-items-start">
                      <i className="bi bi-check-circle text-success me-2"></i>
                      <span>
                        Memberikan layanan pendidikan dan penyaluran kerja yang
                        transparan, aman, dan terpercaya.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold text-primary">Tim Kami</h2>
              <p className="lead text-muted">
                Profesional yang Berdedikasi untuk Kesuksesan Anda
              </p>
            </div>
          </div>

          <div className="row g-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100 hover-shadow text-center">
                  <div className="card-img-top position-relative overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="img-fluid"
                      style={{
                        height: "250px",
                        width: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.target.src = `https://placehold.co/300x250/00294B/FFFFFF?text=${encodeURIComponent(
                          member.name
                        )}`;
                      }}
                    />
                  </div>
                  <div className="card-body p-4">
                    <h5 className="card-title fw-bold text-primary mb-2">
                      {member.name}
                    </h5>
                    <h6 className="card-subtitle mb-3 text-success">
                      {member.position}
                    </h6>
                    <p className="card-text text-muted small">
                      {member.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Status Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold text-primary">Status Legal</h2>
              <p className="lead text-muted">
                Dokumen Resmi yang Menjamin Legalitas Kami
              </p>
            </div>
          </div>

          <div className="row g-4 justify-content-center">
            {legalStatus.map((legal) => (
              <div key={legal.id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 hover-shadow text-center">
                  <div className="card-img-top position-relative overflow-hidden">
                    <img
                      src={legal.image}
                      alt={legal.title}
                      className="img-fluid"
                      style={{
                        height: "380px",
                        width: "100%",
                        // objectFit: "cover",
                        objectFit: "",
                      }}
                      onError={(e) => {
                        e.target.src = `https://placehold.co/300x200/00294B/FFFFFF?text=${encodeURIComponent(
                          legal.title
                        )}`;
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
