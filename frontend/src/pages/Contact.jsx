import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleWhatsAppClick = (customMessage = null) => {
    const waNumber = "6281110119273";
    const defaultMessage = "Halo Fitalenta, saya ingin bertanya tentang program magang. Bisakah Anda memberikan informasi lebih lanjut?";
    const message = customMessage || defaultMessage;

    const waUrl = `https://api.whatsapp.com/send?phone=${waNumber}&text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const contactInfo = [
    {
      icon: "bi-geo-alt",
      title: "Alamat Kantor",
      content:
        "Jl. Ganesa No.15E, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132",
      link: "https://maps.app.goo.gl/HizqPRwZXnyn9S5p8",
    },
    {
      icon: "bi-clock",
      title: "Jam Operasional",
      content: "Senin - Jumat: 08:00 - 17:00 WIB\nSabtu: 08:00 - 12:00 WIB",
    },
    {
      icon: "bi-telephone",
      title: "Telepon",
      content: "+62 811 1011 9273",
      link: "tel:+6281110119273",
    },
    {
      icon: "bi-whatsapp",
      title: "WhatsApp",
      content: "+62 811 1011 9273",
      onClick: () => handleWhatsAppClick(),
    },
    {
      icon: "bi-envelope",
      title: "Email",
      content: "info@fitalenta.co.id",
      link: "mailto:info@fitalenta.co.id",
    },
  ];

  const socialMedia = [
    {
      name: "Facebook",
      icon: "bi-facebook",
      url: "https://www.facebook.com/people/PT-FAST-Indo-Talenta/61550075167981/",
      color: "text-primary",
    },
    {
      name: "Instagram",
      icon: "bi-instagram",
      url: "https://www.instagram.com/fitalenta.id/",
      color: "text-danger",
    },
    {
      name: "LinkedIn",
      icon: "bi-linkedin",
      url: "https://www.facebook.com/people/PT-FAST-Indo-Talenta/61550075167981/",
      color: "text-primary",
    },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmitStatus({
        type: "success",
        message:
          "Pesan Anda telah berhasil dikirim! Kami akan menghubungi Anda dalam 1x24 jam.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message:
          "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi atau hubungi kami langsung.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="hero-section position-relative d-flex align-items-center justify-content-center"
        style={{
          minHeight: "60vh",
          backgroundImage: "url('images/contact_us.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-label="Contact Us Hero Section"
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.59)" }}
          aria-hidden="true"
        ></div>

        <div className="container position-relative text-center text-white">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <h1 className="display-3 fw-bold mb-4">Contact Us</h1>
              <p className="lead mb-0">
                Hubungi Kami untuk Informasi Lebih Lanjut
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information & Form Section */}
      <section className="py-5">
        <div className="container">
          <div className="row g-5">
            {/* Contact Information */}
            <div className="col-lg-12">
              <div className="mb-5 text-center">
                <h2 className="display-5 fw-bold text-primary mb-4">
                  Informasi Kontak
                </h2>
                <p className="lead text-muted mb-4">
                  Jangan ragu untuk menghubungi kami melalui berbagai channel
                  yang tersedia. Tim kami siap membantu menjawab pertanyaan
                  Anda.
                </p>
              </div>

              {/* Contact Info Cards */}
              <div className="row g-4 justify-content-center">
                {contactInfo.map((info, index) => (
                  <div key={index} className="col-12 col-sm-6 col-md-4">
                    <div className="card border-0 shadow-sm h-100 hover-shadow">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-start">
                          <div className="flex-shrink-0">
                            <i
                              className={`bi ${info.icon} fs-3 text-primary me-3`}
                            ></i>
                          </div>
                          <div className="flex-grow-1">
                            <h5 className="card-title fw-bold text-dark mb-2">
                              {info.title}
                            </h5>
                            {info.link ? (
                              <a
                                href={info.link}
                                className="card-text text-muted text-decoration-none"
                                target={
                                  info.link.startsWith("http")
                                    ? "_blank"
                                    : "_self"
                                }
                                rel={
                                  info.link.startsWith("http")
                                    ? "noopener noreferrer"
                                    : ""
                                }
                              >
                                {info.content.split("\n").map((line, i) => (
                                  <span key={i}>
                                    {line}
                                    <br />
                                  </span>
                                ))}
                              </a>
                            ) : info.onClick ? (
                              <button
                                onClick={info.onClick}
                                className="card-text text-muted text-decoration-none border-0 bg-transparent p-0 text-start"
                                style={{ cursor: "pointer" }}
                              >
                                {info.content.split("\n").map((line, i) => (
                                  <span key={i}>
                                    {line}
                                    <br />
                                  </span>
                                ))}
                              </button>
                            ) : (
                              <p className="card-text text-muted mb-0">
                                {info.content.split("\n").map((line, i) => (
                                  <span key={i}>
                                    {line}
                                    <br />
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media */}
              <div className="mt-5 text-center">
                <h4 className="h4 fw-bold text-primary mb-4">Follow Kami</h4>
                <div className="d-flex gap-3 flex-wrap justify-content-center">
                  {socialMedia.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn btn-outline-primary btn-sm ${social.color}`}
                      title={social.name}
                    >
                      <i className={`bi ${social.icon} me-2`}></i>
                      {social.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-light py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold text-primary">Lokasi Kami</h2>
              <p className="lead text-muted">
                Kunjungi kantor kami untuk konsultasi langsung
              </p>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="card border-0 shadow-custom">
                <div className="card-body p-0">
                  <div
                    className="embed-responsive embed-responsive-21by9"
                    style={{ height: "400px" }}
                  >
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.973225068429!2d107.60635507464781!3d-6.893805993105319!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e79861a09a0f%3A0x7edcd4dc41c3c5e1!2sGedung%20Science%20and%20Techno%20Park%20(STP)%20ITB!5e0!3m2!1sid!2sid!4v1759550448335!5m2!1sid!2sid"
                      width="100%"
                      height="100%"
                      style={{ border: 0, borderRadius: "0.5rem" }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="FITALENTA Office Location"
                    ></iframe>
                  </div>
                  <div className="p-4">
                    <div className="row align-items-center">
                      <div className="col-md-8">
                        <h5 className="fw-bold text-primary mb-2">
                          Kantor Pusat FITALENTA
                        </h5>
                        <p className="text-muted mb-0">
                          Jl. Ganesa No.15E, Lb. Siliwangi, Kecamatan Coblong,
                          Kota Bandung, Jawa Barat 40132
                        </p>
                      </div>
                      <div className="col-md-4 text-md-end">
                        <a
                          href="https://maps.app.goo.gl/HizqPRwZXnyn9S5p8"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          <i className="bi bi-geo-alt me-2"></i>
                          Buka di Maps
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-5">
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-5">
              <h2 className="display-5 fw-bold text-primary">
                Pertanyaan Umum
              </h2>
              <p className="lead text-muted">
                Beberapa pertanyaan yang sering diajukan
              </p>
            </div>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="accordion" id="faqAccordion">
                {[
                  {
                    question: "Bagaimana cara mendaftar program pelatihan?",
                    answer:
                      "Anda dapat mendaftar melalui website kami dengan mengisi form pendaftaran online, atau datang langsung ke kantor kami untuk konsultasi dan pendaftaran.",
                  },
                  {
                    question: "Berapa lama durasi pelatihan?",
                    answer:
                      "Durasi pelatihan bervariasi tergantung program, mulai dari 3 bulan hingga 6 bulan. Detail lengkap dapat dilihat di halaman program.",
                  },
                  {
                    question: "Apakah ada jaminan penempatan kerja?",
                    answer:
                      "Ya, kami memberikan jaminan penempatan kerja bagi peserta yang menyelesaikan pelatihan dengan baik dan memenuhi persyaratan.",
                  },
                  {
                    question: "Bagaimana sistem pembayaran biaya pelatihan?",
                    answer:
                      "Pembayaran dapat dilakukan secara bertahap. DP saat pendaftaran, dan pelunasan sebelum keberangkatan. Kami juga menyediakan opsi cicilan.",
                  },
                ].map((faq, index) => (
                  <div
                    key={index}
                    className="accordion-item border-0 mb-3 shadow-sm"
                  >
                    <h3 className="accordion-header">
                      <button
                        className="accordion-button collapsed fw-semibold"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target={`#faq${index}`}
                        aria-expanded="false"
                        aria-controls={`faq${index}`}
                      >
                        {faq.question}
                      </button>
                    </h3>
                    <div
                      id={`faq${index}`}
                      className="accordion-collapse collapse"
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body text-muted">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-gradient-primary text-white">
        <div className="container">
          <div className="row justify-content-center text-center">
            <div className="col-lg-8">
              <h2 className="display-6 fw-bold mb-4">Masih Ada Pertanyaan?</h2>
              <p className="lead mb-4">
                Jangan ragu untuk menghubungi kami. Tim customer service kami
                siap membantu 24/7.
              </p>
              <div className="d-flex gap-3 justify-content-center flex-wrap">
                <button
                  onClick={() => handleWhatsAppClick("Halo Fitalenta, saya masih ada pertanyaan tentang program magang. Bisakah Anda membantu?")}
                  className="btn btn-success btn-lg d-inline-flex align-items-center"
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  Chat WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;