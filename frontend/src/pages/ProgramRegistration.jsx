import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import helpers from "../utils/helpers";

const ProgramRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [programs, setPrograms] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [agreement, setAgreement] = useState(false);
  const [isSameAsKTP, setIsSameAsKTP] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const mapValueToLabel = {
    current_activity: {
      pelajar: "Pelajar",
      mahasiswa: "Mahasiswa",
      bekerja: "Bekerja",
      tidak_bekerja: "Tidak Bekerja",
      pencari_kerja: "Pencari Kerja",
    },
    marital_status: {
      belum_menikah: "Belum Menikah",
      sudah_menikah: "Sudah Menikah",
      sudah_menikah_dan_memiliki_anak: "Sudah Menikah dan Memiliki Anak",
    },
    parent_relationship: {
      ayah: "Ayah",
      ibu: "Ibu",
      kakak: "Kakak",
      kerabat: "Kerabat",
    },
    last_education: {
      SMA: "SMA/Sederajat",
      D1: "D1",
      D2: "D2",
      D3: "D3",
      D4: "D4",
      S1: "S1",
      S2: "S2",
      S3: "S3",
    },
  };

  const getDisplayLabel = (fieldName, value) => {
    if (!value) return "-";
    return mapValueToLabel[fieldName]?.[value] || value;
  };

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    nik: "",
    gender: "",
    birth_place: "",
    birth_date: "",
    email: user?.email || "",
    phone: user?.phone || "",
    last_education: "",
    parent_phone: "",

    parent_relationship: "",

    major: "",

    education_institution: "",

    current_activity: "",

    marital_status: "",

    ktp_province: "",
    ktp_province_name: "",
    ktp_city: "",
    ktp_city_name: "",
    ktp_address: "",

    domicile_province: "",
    domicile_province_name: "",
    domicile_city: "",
    domicile_city_name: "",
    domicile_address: "",

    photo_file: null,
    photo_preview: null,

    program_id: "",

    n4_file: null,
    n4_preview: null,
    ssw_file: null,
    ssw_preview: null,
  });

  useEffect(() => {
    fetchPrograms();
    fetchProvinces();
  }, []);

  useEffect(() => {
    return () => {
      const previewFields = ["photo", "n4", "ssw"];
      previewFields.forEach((field) => {
        const preview = formData[`${field}_preview`];
        if (preview && typeof preview === "string") {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (isSameAsKTP) {
      setFormData((prev) => ({
        ...prev,
        domicile_province: prev.ktp_province,
        domicile_province_name: prev.ktp_province_name,
        domicile_city: prev.ktp_city,
        domicile_city_name: prev.ktp_city_name,
        domicile_address: prev.ktp_address,
      }));
    }
  }, [
    isSameAsKTP,
    formData.ktp_province,
    formData.ktp_province_name,
    formData.ktp_city,
    formData.ktp_city_name,
    formData.ktp_address,
  ]);

  useEffect(() => {
    const isSame =
      formData.domicile_province === formData.ktp_province &&
      formData.domicile_city === formData.ktp_city &&
      formData.domicile_address === formData.ktp_address;

    setIsSameAsKTP(isSame);
  }, [
    formData.domicile_province,
    formData.domicile_city,
    formData.domicile_address,
    formData.ktp_province,
    formData.ktp_city,
    formData.ktp_address,
  ]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/programs");
      if (response.data.success) {
        setPrograms(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      setError("Gagal memuat data program");
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const response = await axios.get("/api/wilayah/provinces");

      if (response.data.success) {
        setProvinces(response.data.data);
      } else {
        setError("Gagal memuat data provinsi");
      }
    } catch (error) {
      console.error("Error fetching provinces:", error);
      setError("Gagal memuat data provinsi");
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceCode, type) => {
    try {
      setLoadingCities((prev) => ({ ...prev, [provinceCode]: true }));

      const response = await axios.get(
        `/api/wilayah/regencies/${provinceCode}`
      );

      if (response.data.success) {
        setCities((prev) => ({
          ...prev,
          [provinceCode]: response.data.data,
        }));
      }
    } catch (error) {
      console.error(
        `Error fetching cities for province ${provinceCode}:`,
        error
      );
      setError(
        `Gagal memuat data kabupaten/kota untuk provinsi ${provinceCode}`
      );
    } finally {
      setLoadingCities((prev) => ({ ...prev, [provinceCode]: false }));
    }
  };

  const handleFileChange = async (fieldName, file) => {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];

    if (fieldName === "photo") {
      if (!file.type.startsWith("image/")) {
        setError("File foto harus berupa gambar (JPG, PNG)");
        return;
      }
    } else {
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${fieldName} harus berupa JPG, PNG, atau PDF`);
        return;
      }
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(`Ukuran file ${fieldName} maksimal 10MB`);
      return;
    }

    try {
      setError("");

      let previewUrl = null;
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
      }

      setFormData((prev) => ({
        ...prev,
        [`${fieldName}_file`]: file,
        [`${fieldName}_preview`]: previewUrl,
      }));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "ktp_province") {
      const selectedProvince = provinces.find((p) => p.code === value);
      setFormData((prev) => ({
        ...prev,
        ktp_province: value,
        ktp_province_name: selectedProvince ? selectedProvince.name : "",
        ktp_city: "",
        ktp_city_name: "",
      }));

      if (value && !cities[value]) {
        fetchCities(value, "ktp");
      }

      if (isSameAsKTP) {
        setFormData((prev) => ({
          ...prev,
          domicile_province: value,
          domicile_province_name: selectedProvince ? selectedProvince.name : "",
          domicile_city: "",
          domicile_city_name: "",
        }));
      }
    } else if (name === "ktp_city") {
      const selectedCity = cities[formData.ktp_province]?.find(
        (c) => c.code === value
      );
      setFormData((prev) => ({
        ...prev,
        ktp_city: value,
        ktp_city_name: selectedCity ? selectedCity.name : "",
      }));

      if (isSameAsKTP) {
        setFormData((prev) => ({
          ...prev,
          domicile_city: value,
          domicile_city_name: selectedCity ? selectedCity.name : "",
        }));
      }
    } else if (name === "ktp_address") {
      setFormData((prev) => ({
        ...prev,
        ktp_address: value,
      }));

      if (isSameAsKTP) {
        setFormData((prev) => ({
          ...prev,
          domicile_address: value,
        }));
      }
    } else if (name === "domicile_province") {
      const selectedProvince = provinces.find((p) => p.code === value);
      setFormData((prev) => ({
        ...prev,
        domicile_province: value,
        domicile_province_name: selectedProvince ? selectedProvince.name : "",
        domicile_city: "",
        domicile_city_name: "",
      }));

      if (value && !cities[value]) {
        fetchCities(value, "domicile");
      }
    } else if (name === "domicile_city") {
      const selectedCity = cities[formData.domicile_province]?.find(
        (c) => c.code === value
      );
      setFormData((prev) => ({
        ...prev,
        domicile_city: value,
        domicile_city_name: selectedCity ? selectedCity.name : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    setIsSameAsKTP(checked);

    if (checked) {
      setFormData((prev) => ({
        ...prev,
        domicile_province: prev.ktp_province,
        domicile_province_name: prev.ktp_province_name,
        domicile_city: prev.ktp_city,
        domicile_city_name: prev.ktp_city_name,
        domicile_address: prev.ktp_address,
      }));
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setError("");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setError("");
  };

  const validateStep = (step) => {
    const errors = [];

    if (step === 1) {
      if (!formData.full_name) errors.push("Nama lengkap harus diisi");
      if (!formData.nik) errors.push("NIK harus diisi");
      if (!formData.gender) errors.push("Jenis kelamin harus dipilih");
      if (!formData.birth_place) errors.push("Tempat lahir harus diisi");
      if (!formData.birth_date) errors.push("Tanggal lahir harus diisi");
      if (!formData.phone) errors.push("Nomor handphone harus diisi");
      if (!formData.last_education)
        errors.push("Pendidikan terakhir harus diisi");
      if (!formData.parent_phone)
        errors.push("Nomor handphone orang tua harus diisi");

      if (!formData.parent_relationship)
        errors.push("Hubungan dengan orang tua/wali harus dipilih");
      if (!formData.major) errors.push("Jurusan harus diisi");
      if (!formData.education_institution)
        errors.push("Asal institusi pendidikan terakhir harus diisi");
      if (!formData.current_activity)
        errors.push("Pekerjaan/aktivitas saat ini harus dipilih");
      if (!formData.marital_status)
        errors.push("Status pernikahan harus dipilih");

      if (!formData.ktp_province) errors.push("Provinsi KTP harus dipilih");
      if (!formData.ktp_city) errors.push("Kota/Kabupaten KTP harus dipilih");
      if (!formData.ktp_address) errors.push("Alamat KTP harus diisi");
      if (!formData.domicile_province)
        errors.push("Provinsi domisili harus dipilih");
      if (!formData.domicile_city)
        errors.push("Kota/Kabupaten domisili harus dipilih");
      if (!formData.domicile_address)
        errors.push("Alamat domisili harus diisi");

      if (!formData.photo_file) errors.push("Foto harus diupload");
    }

    if (step === 2) {
      if (!formData.program_id) errors.push("Program harus dipilih");

      const selectedProgram = programs.find((p) => p.id == formData.program_id);
      if (selectedProgram?.name?.toLowerCase().includes("fast track")) {
        if (!formData.n4_file)
          errors.push("Sertifikat N4 harus diupload untuk program Fast Track");
        if (!formData.ssw_file)
          errors.push("Sertifikat SSW harus diupload untuk program Fast Track");
      }
    }

    if (step === 3) {
      if (!agreement) errors.push("Anda harus menyetujui syarat dan ketentuan");
    }

    if (errors.length > 0) {
      setError(errors.join(", "));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(3)) return;

    try {
      setSubmitLoading(true);
      setError("");

      let photoPath = null;
      if (formData.photo_file) {
        const photoFormData = new FormData();
        photoFormData.append("file", formData.photo_file);

        // console.log("Uploading photo...");
        const uploadResponse = await axios.post(
          "/api/uploads/photo",
          photoFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (uploadResponse.data.success) {
          photoPath = uploadResponse.data.data.file_path;
          // console.log("Photo uploaded:", photoPath);
        } else {
          throw new Error("Gagal mengupload foto");
        }
      }

      let n4Path = null;
      let sswPath = null;

      if (isFastTrack) {
        if (formData.n4_file) {
          const n4FormData = new FormData();
          n4FormData.append("file", formData.n4_file);
          n4FormData.append("type", "n4_certificate");

          // console.log("Uploading N4 certificate...");
          const n4Response = await axios.post(
            "/api/uploads/document",
            n4FormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (n4Response.data.success) {
            n4Path = n4Response.data.data.file_path;
            // console.log("N4 certificate uploaded:", n4Path);
          } else {
            throw new Error("Gagal mengupload sertifikat N4");
          }
        }

        if (formData.ssw_file) {
          const sswFormData = new FormData();
          sswFormData.append("file", formData.ssw_file);
          sswFormData.append("type", "ssw_certificate");

          // console.log("Uploading SSW certificate...");
          const sswResponse = await axios.post(
            "/api/uploads/document",
            sswFormData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (sswResponse.data.success) {
            sswPath = sswResponse.data.data.file_path;
            // console.log("SSW certificate uploaded:", sswPath);
          } else {
            throw new Error("Gagal mengupload sertifikat SSW");
          }
        }
      }

      const registrationData = {
        user_id: user.id,
        program_id: formData.program_id,
        nik: formData.nik,
        gender: formData.gender,
        birth_place: formData.birth_place,
        birth_date: formData.birth_date,
        last_education: formData.last_education,
        parent_phone: formData.parent_phone,

        parent_relationship: formData.parent_relationship,
        major: formData.major,
        education_institution: formData.education_institution,
        current_activity: formData.current_activity,
        marital_status: formData.marital_status,

        ktp_province_code: formData.ktp_province,
        ktp_province_name: formData.ktp_province_name,
        ktp_city_code: formData.ktp_city,
        ktp_city_name: formData.ktp_city_name,
        ktp_address: formData.ktp_address,
        domicile_province_code: formData.domicile_province,
        domicile_province_name: formData.domicile_province_name,
        domicile_city_code: formData.domicile_city,
        domicile_city_name: formData.domicile_city_name,
        domicile_address: formData.domicile_address,

        photo_path: photoPath,

        n4_certificate_path: n4Path,
        ssw_certificate_path: sswPath,

        user_data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      };

      // console.log("Sending registration data:", registrationData);

      const response = await axios.post("/api/registrations", registrationData);

      if (response.data.success) {
        setRegistrationResult(response.data.data);
        setShowSuccessModal(true);
      } else {
        setError(response.data.message || "Gagal melakukan pendaftaran");
      }
    } catch (error) {
      console.error("Registration error:", error);
      console.error("Error details:", error.response?.data);
      setError(
        error.response?.data?.message ||
        "Terjadi kesalahan saat mendaftar. Silakan coba lagi."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const getCurrentCities = (provinceCode) => {
    return cities[provinceCode] || [];
  };

  const isCitiesLoading = (provinceCode) => {
    return loadingCities[provinceCode] || false;
  };

  const isUploading = (fieldName) => {
    return uploadingFiles[fieldName] || false;
  };

  const selectedProgram = programs.find((p) => p.id == formData.program_id);
  const isFastTrack = selectedProgram?.name
    ?.toLowerCase()
    .includes("fast track");

  const renderStep1 = () => (
    <div className="row">
      <div className="col-12">
        <h4 className="mb-4">Data Diri</h4>
      </div>

      <div className="col-12 mb-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Upload Foto</h5>
            <div className="row">
              <div className="col-md-6">
                <label htmlFor="photo" className="form-label">
                  Foto <span className="text-danger">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="photo"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange("photo", e.target.files[0])}
                  disabled={isUploading("photo")}
                  required
                />
                <div className="form-text">
                  Format: JPG, PNG (Maksimal 10MB)
                </div>
                {isUploading("photo") && (
                  <div className="mt-2">
                    <div
                      className="spinner-border spinner-border-sm"
                      role="status"
                    >
                      <span className="visually-hidden">Mengupload...</span>
                    </div>
                    <small className="text-muted ms-2">
                      Mengupload foto...
                    </small>
                  </div>
                )}
              </div>
              <div className="col-md-6">
                {formData.photo_preview && (
                  <div className="text-center">
                    <p className="mb-2">
                      <strong>Preview Foto:</strong>
                    </p>
                    <img
                      src={formData.photo_preview}
                      alt="Preview"
                      className="img-thumbnail"
                      style={{
                        maxWidth: "200px",
                        maxHeight: "200px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12">
        <h5 className="mb-3">Data Pribadi</h5>
      </div>

      {/* Baris 1 */}
      <div className="col-md-6 mb-3">
        <label htmlFor="full_name" className="form-label">
          Nama Lengkap <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="nik" className="form-label">
          NIK <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          id="nik"
          name="nik"
          value={formData.nik}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Baris 2 */}
      <div className="col-md-6 mb-3">
        <label htmlFor="gender" className="form-label">
          Jenis Kelamin <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          required
        >
          <option value="">Pilih Jenis Kelamin</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="birth_place" className="form-label">
          Tempat Lahir <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          id="birth_place"
          name="birth_place"
          value={formData.birth_place}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Baris 3 */}
      <div className="col-md-6 mb-3">
        <label htmlFor="birth_date" className="form-label">
          Tanggal Lahir <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          className="form-control"
          id="birth_date"
          name="birth_date"
          value={formData.birth_date}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="email" className="form-label">
          Email <span className="text-danger">*</span>
        </label>
        <input
          type="email"
          className="form-control"
          id="email"
          name="email"
          value={formData.email}
          readOnly
          disabled
        />
        <small className="text-muted">
          Email sesuai dengan akun registrasi
        </small>
      </div>

      {/* Baris 4 */}
      <div className="col-md-6 mb-3">
        <label htmlFor="phone" className="form-label">
          Nomor Handphone <span className="text-danger">*</span>
        </label>
        <input
          type="tel"
          className="form-control"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="last_education" className="form-label">
          Pendidikan Terakhir <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="last_education"
          name="last_education"
          value={formData.last_education}
          onChange={handleInputChange}
          required
        >
          <option value="">Pilih Pendidikan</option>
          <option value="SMA">SMA/Sederajat</option>
          <option value="D1">D1</option>
          <option value="D2">D2</option>
          <option value="D3">D3</option>
          <option value="D4">D4</option>
          <option value="S1">S1</option>
          <option value="S2">S2</option>
          <option value="S3">S3</option>
        </select>
      </div>

      {/* FIELD BARU: Baris 5 - Data Tambahan */}

      <div className="col-md-6 mb-3">
        <label htmlFor="major" className="form-label">
          Jurusan <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          id="major"
          name="major"
          value={formData.major}
          onChange={handleInputChange}
          placeholder="Contoh: Teknik Informatika, Akuntansi, dll."
          required
        />
      </div>

      {/* FIELD BARU: Baris 6 - Data Tambahan */}
      <div className="col-md-6 mb-3">
        <label htmlFor="education_institution" className="form-label">
          Asal Institusi Pendidikan Terakhir{" "}
          <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control"
          id="education_institution"
          name="education_institution"
          value={formData.education_institution}
          onChange={handleInputChange}
          placeholder="Contoh: Universitas Indonesia, SMAN 1 Bandung, dll."
          required
        />
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="current_activity" className="form-label">
          Pekerjaan/Aktivitas Saat Ini <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="current_activity"
          name="current_activity"
          value={formData.current_activity}
          onChange={handleInputChange}
          required
        >
          <option value="">Pilih Aktivitas</option>
          <option value="pelajar">Pelajar</option>
          <option value="mahasiswa">Mahasiswa</option>
          <option value="bekerja">Bekerja</option>
          <option value="tidak_bekerja">Tidak Bekerja</option>
          <option value="pencari_kerja">Pencari Kerja</option>
        </select>
      </div>

      {/* FIELD BARU: Baris 7 - Data Tambahan */}
      <div className="col-md-6 mb-3">
        <label htmlFor="marital_status" className="form-label">
          Status Pernikahan <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="marital_status"
          name="marital_status"
          value={formData.marital_status}
          onChange={handleInputChange}
          required
        >
          <option value="">Pilih Status</option>
          <option value="belum_menikah">Belum Menikah</option>
          <option value="sudah_menikah">Sudah Menikah</option>
          <option value="sudah_menikah_dan_memiliki_anak">
            Sudah Menikah dan Memiliki Anak
          </option>
        </select>
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="parent_relationship" className="form-label">
          Hubungan dengan Orang Tua/Wali <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="parent_relationship"
          name="parent_relationship"
          value={formData.parent_relationship}
          onChange={handleInputChange}
          required
        >
          <option value="">Pilih Hubungan</option>
          <option value="ayah">Ayah</option>
          <option value="ibu">Ibu</option>
          <option value="kakak">Kakak</option>
          <option value="kerabat">Kerabat</option>
        </select>
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="parent_phone" className="form-label">
          Nomor Handphone Orang Tua/Wali <span className="text-danger">*</span>
        </label>
        <input
          type="tel"
          className="form-control"
          id="parent_phone"
          name="parent_phone"
          value={formData.parent_phone}
          onChange={handleInputChange}
          required
        />
      </div>

      <div className="col-12 mt-4">
        <h5>Alamat Sesuai KTP</h5>
      </div>

      {/* Baris 8 - Alamat KTP */}
      <div className="col-md-6 mb-3">
        <label htmlFor="ktp_province" className="form-label">
          Provinsi <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="ktp_province"
          name="ktp_province"
          value={formData.ktp_province}
          onChange={handleInputChange}
          required
        >
          <option value="">Pilih Provinsi</option>
          {loadingProvinces ? (
            <option value="" disabled>
              Memuat data provinsi...
            </option>
          ) : (
            provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))
          )}
        </select>
        {loadingProvinces && (
          <small className="text-muted">Memuat data provinsi...</small>
        )}
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="ktp_city" className="form-label">
          Kabupaten/Kota <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="ktp_city"
          name="ktp_city"
          value={formData.ktp_city}
          onChange={handleInputChange}
          disabled={
            !formData.ktp_province || isCitiesLoading(formData.ktp_province)
          }
          required
        >
          <option value="">Pilih Kabupaten/Kota</option>
          {formData.ktp_province && isCitiesLoading(formData.ktp_province) ? (
            <option value="" disabled>
              Memuat data kabupaten/kota...
            </option>
          ) : (
            formData.ktp_province &&
            getCurrentCities(formData.ktp_province).map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))
          )}
        </select>
        {formData.ktp_province && isCitiesLoading(formData.ktp_province) && (
          <small className="text-muted">Memuat data kabupaten/kota...</small>
        )}
      </div>

      <div className="col-12 mb-3">
        <label htmlFor="ktp_address" className="form-label">
          Detail Alamat <span className="text-danger">*</span>
        </label>
        <textarea
          className="form-control"
          id="ktp_address"
          name="ktp_address"
          rows="3"
          value={formData.ktp_address}
          onChange={handleInputChange}
          placeholder="Masukkan alamat lengkap sesuai KTP"
          required
        ></textarea>
      </div>

      <div className="col-12 mt-4">
        <h5>Alamat Domisili</h5>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="same_as_ktp"
            checked={isSameAsKTP}
            onChange={handleCheckboxChange}
          />
          <label className="form-check-label" htmlFor="same_as_ktp">
            Sama dengan alamat KTP
          </label>
        </div>
      </div>

      {/* Baris 9 - Alamat Domisili */}
      <div className="col-md-6 mb-3">
        <label htmlFor="domicile_province" className="form-label">
          Provinsi <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="domicile_province"
          name="domicile_province"
          value={formData.domicile_province}
          onChange={handleInputChange}
          disabled={isSameAsKTP}
          required
        >
          <option value="">Pilih Provinsi</option>
          {loadingProvinces ? (
            <option value="" disabled>
              Memuat data provinsi...
            </option>
          ) : (
            provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="col-md-6 mb-3">
        <label htmlFor="domicile_city" className="form-label">
          Kabupaten/Kota <span className="text-danger">*</span>
        </label>
        <select
          className="form-select"
          id="domicile_city"
          name="domicile_city"
          value={formData.domicile_city}
          onChange={handleInputChange}
          disabled={
            isSameAsKTP ||
            !formData.domicile_province ||
            isCitiesLoading(formData.domicile_province)
          }
          required
        >
          <option value="">Pilih Kabupaten/Kota</option>
          {formData.domicile_province &&
            isCitiesLoading(formData.domicile_province) ? (
            <option value="" disabled>
              Memuat data kabupaten/kota...
            </option>
          ) : (
            formData.domicile_province &&
            getCurrentCities(formData.domicile_province).map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))
          )}
        </select>
        {formData.domicile_province &&
          isCitiesLoading(formData.domicile_province) && (
            <small className="text-muted">Memuat data kabupaten/kota...</small>
          )}
      </div>

      <div className="col-12 mb-3">
        <label htmlFor="domicile_address" className="form-label">
          Detail Alamat <span className="text-danger">*</span>
        </label>
        <textarea
          className="form-control"
          id="domicile_address"
          name="domicile_address"
          rows="3"
          value={formData.domicile_address}
          onChange={handleInputChange}
          placeholder="Masukkan alamat lengkap domisili saat ini"
          disabled={isSameAsKTP}
          required
        ></textarea>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="row">
      <div className="col-12">
        <h4 className="mb-4">Pemilihan Program dan Dokumen</h4>

        {/* Pilihan Program dengan Radio Button */}
        <div className="card mb-4">
          <div className="card-header">
            <h5>
              1. Pilih Program <span className="text-danger">*</span>
            </h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Memuat data program...</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="alert alert-warning">
                <p>Tidak ada program yang tersedia saat ini.</p>
              </div>
            ) : (
              <div className="row">
                {programs.map((program) => (
                  <div key={program.id} className="col-md-6 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="program_selection"
                            id={`program-${program.id}`}
                            value={program.id}
                            checked={formData.program_id == program.id}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                program_id: e.target.value,
                              }))
                            }
                          />
                          <label
                            className="form-check-label w-100"
                            htmlFor={`program-${program.id}`}
                          >
                            <h5 className="card-title">{program.name}</h5>
                            <p className="card-text text-muted small">
                              {program.description?.substring(0, 150)}...
                            </p>
                            <div className="mb-2">
                              <strong>Durasi:</strong> {program.duration}
                            </div>
                            <div className="mb-2">
                              <strong>Biaya:</strong>{" "}
                              {helpers.formatCurrency(program.training_cost)}
                            </div>
                            <div className="mb-2">
                              <strong>Jadwal:</strong> {program.schedule}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.program_id && (
              <div className="alert alert-info mt-3">
                <strong>Program Terpilih:</strong>{" "}
                {programs.find((p) => p.id == formData.program_id)?.name}
              </div>
            )}
          </div>
        </div>

        {/* Dokumen Tambahan untuk Fast Track */}
        {isFastTrack && (
          <div className="card">
            <div className="card-header">
              <h5>
                2. Dokumen Tambahan (Fast Track){" "}
                <span className="text-danger">*</span>
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="n4" className="form-label">
                    Sertifikat N4 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="n4"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange("n4", e.target.files[0])}
                    disabled={isUploading("n4")}
                    required={isFastTrack}
                  />
                  <div className="form-text">
                    Format: JPG, PNG, PDF (Maksimal 10MB)
                  </div>
                  {formData.n4_preview && (
                    <div className="mt-2">
                      {formData.n4_file.type.startsWith("image/") ? (
                        <img
                          src={formData.n4_preview}
                          alt="Preview N4"
                          className="img-thumbnail"
                          style={{ maxWidth: "200px" }}
                        />
                      ) : (
                        <div className="text-center">
                          <i className="bi bi-file-pdf fs-1 text-danger"></i>
                          <p className="small">{formData.n4_file.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="ssw" className="form-label">
                    Sertifikat SSW <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="ssw"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileChange("ssw", e.target.files[0])}
                    disabled={isUploading("ssw")}
                    required={isFastTrack}
                  />
                  <div className="form-text">
                    Format: JPG, PNG, PDF (Maksimal 10MB)
                  </div>
                  {formData.ssw_preview && (
                    <div className="mt-2">
                      {formData.ssw_file.type.startsWith("image/") ? (
                        <img
                          src={formData.ssw_preview}
                          alt="Preview SSW"
                          className="img-thumbnail"
                          style={{ maxWidth: "200px" }}
                        />
                      ) : (
                        <div className="text-center">
                          <i className="bi bi-file-pdf fs-1 text-danger"></i>
                          <p className="small">{formData.ssw_file.name}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="row">
      <div className="col-12">
        <h4 className="mb-4">Konfirmasi Pendaftaran</h4>

        {/* Foto */}
        <div className="card mb-3">
          <div className="card-header">
            <h5>Foto</h5>
          </div>
          <div className="card-body">
            {formData.photo_preview ? (
              <div className="text-center">
                <img
                  src={formData.photo_preview}
                  alt="Foto Peserta"
                  className="img-thumbnail"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                />
              </div>
            ) : (
              <p className="text-muted">Foto belum diupload</p>
            )}
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-header">
            <h5>Data Diri</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p>
                  <strong>Nama Lengkap:</strong> {formData.full_name}
                </p>
                <p>
                  <strong>NIK:</strong> {formData.nik}
                </p>
                <p>
                  <strong>Jenis Kelamin:</strong>{" "}
                  {formData.gender === "L" ? "Laki-laki" : "Perempuan"}
                </p>
                <p>
                  <strong>Tempat, Tanggal Lahir:</strong> {formData.birth_place}
                  , {formData.birth_date}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email}
                </p>
                <p>
                  <strong>No. Handphone:</strong> {formData.phone}
                </p>
                <p>
                  <strong>Pendidikan Terakhir:</strong>{" "}
                  {getDisplayLabel("last_education", formData.last_education)}
                </p>
              </div>
              <div className="col-md-6">

                <p>
                  <strong>Jurusan:</strong> {formData.major}
                </p>
                <p>
                  <strong>Asal Institusi Pendidikan:</strong>{" "}
                  {formData.education_institution}
                </p>
                <p>
                  <strong>Pekerjaan/Aktivitas Saat Ini:</strong>{" "}
                  {getDisplayLabel(
                    "current_activity",
                    formData.current_activity
                  )}
                </p>
                <p>
                  <strong>Status Pernikahan:</strong>{" "}
                  {getDisplayLabel("marital_status", formData.marital_status)}
                </p>
                <p>
                  <strong>Hubungan dengan Orang Tua/Wali:</strong>{" "}
                  {getDisplayLabel(
                    "parent_relationship",
                    formData.parent_relationship
                  )}
                </p>
                <p>
                  <strong>No. HP Orang Tua/Wali:</strong>{" "}
                  {formData.parent_phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Alamat */}
        <div className="card mb-3">
          <div className="card-header">
            <h5>Alamat</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Alamat KTP</h6>
                <p>
                  <strong>Provinsi:</strong> {formData.ktp_province_name}
                </p>
                <p>
                  <strong>Kota/Kabupaten:</strong> {formData.ktp_city_name}
                </p>
                <p>
                  <strong>Alamat:</strong> {formData.ktp_address}
                </p>
              </div>
              <div className="col-md-6">
                <h6>Alamat Domisili</h6>
                <p>
                  <strong>Provinsi:</strong> {formData.domicile_province_name}
                </p>
                <p>
                  <strong>Kota/Kabupaten:</strong> {formData.domicile_city_name}
                </p>
                <p>
                  <strong>Alamat:</strong> {formData.domicile_address}
                </p>
                {isSameAsKTP && (
                  <div className="alert alert-info mt-2 p-2">
                    <small>
                      <i className="bi bi-info-circle"></i> Alamat domisili sama
                      dengan alamat KTP
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Program */}
        <div className="card mb-3">
          <div className="card-header">
            <h5>Program yang Dipilih</h5>
          </div>
          <div className="card-body">
            <p>
              <strong>Program:</strong>{" "}
              {programs.find((p) => p.id == formData.program_id)?.name}
            </p>
            <p>
              <strong>Durasi:</strong>{" "}
              {programs.find((p) => p.id == formData.program_id)?.duration}
            </p>
            <p>
              <strong>Biaya:</strong>{" "}
              {helpers.formatCurrency(
                programs.find((p) => p.id == formData.program_id)?.training_cost
              )}
            </p>
          </div>
        </div>

        {/* Dokumen - HANYA untuk Fast Track */}
        {isFastTrack && (
          <div className="card mb-3">
            <div className="card-header">
              <h5>Dokumen Tambahan (Fast Track)</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Sertifikat N4:</strong>{" "}
                    {formData.n4_file
                      ? formData.n4_file.name
                      : "Belum diupload"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Sertifikat SSW:</strong>{" "}
                    {formData.ssw_file
                      ? formData.ssw_file.name
                      : "Belum diupload"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agreement Checkbox */}
        <div className="card">
          <div className="card-body">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreement"
                checked={agreement}
                onChange={(e) => setAgreement(e.target.checked)}
                required
              />
              <label className="form-check-label" htmlFor="agreement">
                Saya menyatakan bahwa semua data yang tercera di atas adalah
                benar dan valid. Saya juga telah membaca, memahami, dan
                menyetujui semua Syarat dan Ketentuan Program yang berlaku di
                FITALENTA. <span className="text-danger">*</span>
              </label>
            </div>
          </div>
        </div>

        <div className="alert alert-warning mt-4">
          <h6>Perhatian!</h6>
          <p className="mb-0">
            Pastikan semua data yang Anda isi sudah benar. Data yang sudah
            dikirim tidak dapat diubah. Setelah mengirim formulir, Anda akan
            masuk ke proses seleksi interview.
          </p>
        </div>
      </div>
    </div>
  );

  const SuccessModal = () => (
    <div
      className={`modal fade ${showSuccessModal ? "show" : ""}`}
      style={{ display: showSuccessModal ? "block" : "none" }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Pendaftaran Berhasil!</h5>
          </div>
          <div className="modal-body text-center">
            <div className="mb-4">
              <i
                className="bi bi-check-circle-fill text-success"
                style={{ fontSize: "4rem" }}
              ></i>
            </div>
            <h4 className="text-primary mb-3">
              Selamat! Pendaftaran Anda Berhasil Diterima!
            </h4>
            <p className="mb-3">
              Terima kasih telah mendaftar di Program{" "}
              <strong>
                {programs.find((p) => p.id == formData.program_id)?.name}
              </strong>
            </p>
            <div className="alert alert-info">
              <h5>Nomor Pendaftaran Anda:</h5>
              <h4 className="text-primary">
                #{registrationResult?.registration_code}
              </h4>
            </div>
            <p className="text-muted text-danger">
              Untuk informasi dan langkah seleksi lebih lanjut, Anda akan
              dihubungi melalui WhatsApp pada nomor yang telah didaftarkan.
              Mohon pastikan nomor WhatsApp Anda aktif.
            </p>
          </div>
          <div className="modal-footer justify-content-center">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate("/dashboard")}
            >
              Detail program anda
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header */}
          <div className="text-center mb-5">
            <h2>Formulir Pendaftaran Program Magang</h2>
            <p className="text-muted">
              Isi data diri Anda dengan lengkap dan benar
            </p>
          </div>

          {/* Progress Steps */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="text-center flex-fill">
                    <div
                      className={`rounded-circle d-inline-flex align-items-center justify-content-center ${step <= currentStep
                          ? "bg-primary text-white"
                          : "bg-light text-muted"
                        }`}
                      style={{ width: "40px", height: "40px" }}
                    >
                      {step}
                    </div>
                    <div className="mt-2 small">
                      {step === 1 && "Data Diri"}
                      {step === 2 && "Program & Dokumen"}
                      {step === 3 && "Konfirmasi"}
                    </div>
                  </div>
                ))}
              </div>
              <div className="progress mt-2" style={{ height: "4px" }}>
                <div
                  className="progress-bar"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="card">
              <div className="card-body">
                {/* Step Content */}
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                {/* Navigation Buttons */}
                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    ← Sebelumnya
                  </button>

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={nextStep}
                    >
                      Lanjutkan →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          ></span>
                          Mengirim...
                        </>
                      ) : (
                        "✓ Selesaikan Pendaftaran"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal />

      {/* Modal Backdrop */}
      {showSuccessModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default ProgramRegistration;
