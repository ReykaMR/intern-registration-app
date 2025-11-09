import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-primary text-light pb-3 mt-5">
      <div className="container">
        <div className="row py-4">
          {/* Alamat */}
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="text-uppercase fw-bold">FITALENTA</h5>
            <p className="small mb-0">
              Gedung Science Techno Park ITB <br />
              Jl. Ganesa No.15E, <br />
              Lb. Siliwangi, Kec. Coblong <br />
              Bandung 40132
            </p>
          </div>

          {/* Sosial Media */}
          <div className="col-md-4 mb-4 mb-md-0 text-start">
            <h5 className="text-uppercase fw-bold mb-3">Sosial Media</h5>
            <ul className="list-unstyled small">
              <li className="mb-2 d-flex align-items-center gap-2 justify-content-start">
                <i className="bi bi-instagram fs-5"></i>
                <span>fitalenta.id</span>
              </li>
              <li className="mb-2 d-flex align-items-center gap-2 justify-content-start">
                <i className="bi bi-whatsapp fs-5"></i>
                <span>+62 811 1011 9273</span>
              </li>
            </ul>
          </div>

          {/* Lokasi */}
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="text-uppercase fw-bold">Our Location</h5>
            <div className="ratio ratio-16x9 mt-2">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.973225068429!2d107.60635507464781!3d-6.893805993105319!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e79861a09a0f%3A0x7edcd4dc41c3c5e1!2sGedung%20Science%20and%20Techno%20Park%20(STP)%20ITB!5e0!3m2!1sid!2sid!4v1759550448335!5m2!1sid!2sid"
                style={{ border: 0 }}
                loading="lazy"
                title="Fitalenta Location"
              ></iframe>
            </div>
          </div>
        </div>

        <hr className="border-light" />

        {/* Copyright */}
        <div className="row">
          <div className="col text-center">
            <p className="mb-0 small">
              &copy; {new Date().getFullYear()}{" "}
              <strong className="text-uppercase">Fitalenta</strong>. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
