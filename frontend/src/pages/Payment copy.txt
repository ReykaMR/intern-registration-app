import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const paymentUtils = {
  formatCurrency: (value) => {
    if (!value && value !== 0) return "Rp 0";
    const numValue = parseFloat(value);
    return isNaN(numValue)
      ? "Rp 0"
      : `Rp ${Math.round(numValue).toLocaleString("id-ID")}`;
  },

  parseFloatSafe: (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === "") {
      return defaultValue;
    }
    const numValue = parseFloat(value);
    return isNaN(numValue) ? defaultValue : Math.round(numValue * 100) / 100;
  },

  calculateRemainingSafe: (total, paid) => {
    const totalCents = Math.round(parseFloat(total || 0) * 100);
    const paidCents = Math.round(parseFloat(paid || 0) * 100);
    return Math.max(0, (totalCents - paidCents) / 100);
  },

  getStatusBadge: (status) => {
    const statusConfig = {
      pending: { class: "bg-warning", text: "Menunggu Pembayaran" },
      installment_1: { class: "bg-primary", text: "Cicilan 1" },
      installment_2: { class: "bg-primary", text: "Cicilan 2" },
      installment_3: { class: "bg-primary", text: "Cicilan 3" },
      installment_4: { class: "bg-primary", text: "Cicilan 4" },
      installment_5: { class: "bg-primary", text: "Cicilan 5" },
      installment_6: { class: "bg-primary", text: "Cicilan 6" },
      paid: { class: "bg-success", text: "Lunas" },
      overdue: { class: "bg-danger", text: "Jatuh Tempo" },
      cancelled: { class: "bg-secondary", text: "Dibatalkan" },
    };

    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  },

  getStatusText: (status) => {
    const statusTexts = {
      pending: "Menunggu Pembayaran",
      installment_1: "Cicilan 1",
      installment_2: "Cicilan 2",
      installment_3: "Cicilan 3",
      installment_4: "Cicilan 4",
      installment_5: "Cicilan 5",
      installment_6: "Cicilan 6",
      paid: "Lunas",
      overdue: "Terlambat",
      cancelled: "Dibatalkan",
    };
    return statusTexts[status] || status;
  },

  getTotalInstallments: (payment) => {
    if (!payment || !payment.program_installment_plan) return 4;

    const plan = payment.program_installment_plan;
    if (plan === "none") return 1;
    if (plan === "4_installments") return 4;
    if (plan === "6_installments") return 6;

    return parseInt(plan.split("_")[0]) || 4;
  },

  getInstallmentText: (payment) => {
    if (!payment || !payment.status) return "Unknown";

    if (payment.status === "paid") return "Lunas";
    if (payment.status === "pending") return "Menunggu Pembayaran";

    if (payment.status.startsWith("installment_")) {
      const installmentNum = payment.status.split("_")[1];
      return `Cicilan ${installmentNum}`;
    }

    return payment.status;
  },

  getCurrentInstallmentInfo: (payment) => {
    if (!payment) return { number: 0, text: "Unknown", isPaid: false, totalInstallments: 4, isWaitingVerification: false };

    const totalInstallments = paymentUtils.getTotalInstallments(payment);
    const isWaitingVerification = paymentUtils.isWaitingVerification(payment);

    if (payment.status === "paid") {
      return {
        number: totalInstallments,
        text: "Lunas",
        isPaid: true,
        totalInstallments,
        isWaitingVerification: false
      };
    }

    if (payment.status === "pending") {
      return {
        number: 1,
        text: "Menunggu Cicilan 1",
        isPaid: false,
        totalInstallments,
        isWaitingVerification
      };
    }

    if (payment.status.startsWith("installment_")) {
      const currentNum = parseInt(payment.status.split("_")[1]) || 1;
      const isPaid = paymentUtils.isInstallmentPaid(payment, currentNum);

      let text = `Cicilan ${currentNum}`;
      if (isWaitingVerification) {
        text += " (Menunggu Verifikasi)";
      } else if (isPaid) {
        text += " (Sudah Dibayar)";
      }

      return {
        number: currentNum,
        text: text,
        isPaid,
        totalInstallments,
        isWaitingVerification
      };
    }

    return {
      number: 0,
      text: payment.status,
      isPaid: false,
      totalInstallments,
      isWaitingVerification
    };
  },

  getNextInstallmentInfo: (payment) => {
    if (!payment) return { number: 0, text: "Unknown", exists: false, totalInstallments: 4 };

    const currentInfo = paymentUtils.getCurrentInstallmentInfo(payment);
    const totalInstallments = currentInfo.totalInstallments;

    if (currentInfo.number >= totalInstallments || payment.status === "paid") {
      return { number: null, text: "Lunas", exists: false, totalInstallments };
    }

    const nextNumber = currentInfo.number + 1;

    return {
      number: nextNumber,
      text: `Cicilan ${nextNumber}`,
      exists: true,
      totalInstallments
    };
  },

  isInstallmentPaid: (payment, installmentNumber) => {
    if (!payment || !installmentNumber) return false;

    if (payment.status === 'paid') return true;

    const totalInstallments = paymentUtils.getTotalInstallments(payment);
    const totalAmount = paymentUtils.parseFloatSafe(payment.program_training_cost);
    const paidAmount = paymentUtils.parseFloatSafe(payment.amount_paid);

    if (paidAmount >= totalAmount) return true;

    const installmentAmount = totalAmount / totalInstallments;
    const expectedPaid = installmentAmount * installmentNumber;

    return paidAmount >= expectedPaid;
  },

  getCurrentInstallmentAmount: (payment) => {
    if (!payment) return 0;

    if (!payment.due_date && payment.status !== "pending") {
      return 0;
    }

    if (payment.installment_amounts) {
      try {
        const installmentAmounts =
          typeof payment.installment_amounts === "string"
            ? JSON.parse(payment.installment_amounts)
            : payment.installment_amounts;

        const currentInfo = paymentUtils.getCurrentInstallmentInfo(payment);
        const currentInstallment = currentInfo.number;

        if (currentInstallment > 0) {
          const installmentKey = `installment_${currentInstallment}`;
          if (installmentAmounts[installmentKey]?.amount) {
            return parseFloat(installmentAmounts[installmentKey].amount);
          }
        }

        for (let i = 1; i <= 6; i++) {
          const key = `installment_${i}`;
          if (installmentAmounts[key]?.amount) {
            return parseFloat(installmentAmounts[key].amount);
          }
        }
      } catch (e) {
        console.error("❌ Error parsing installment_amounts:", e);
      }
    }

    const totalAmount = paymentUtils.parseFloatSafe(payment.program_training_cost);
    const totalInstallments = paymentUtils.getTotalInstallments(payment);
    return totalInstallments > 0 ? Math.round(totalAmount / totalInstallments) : 0;
  },

  isOverdue: (payment) => {
    if (!payment?.due_date || payment.status === "paid") return false;
    try {
      const dueDate = new Date(payment.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    } catch (error) {
      console.error("Error checking overdue:", error);
      return false;
    }
  },

  isDueSoon: (payment) => {
    if (!payment?.due_date || payment.status === "paid") return false;
    try {
      const dueDate = new Date(payment.due_date);
      const today = new Date();
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);

      return dueDate >= today && dueDate <= threeDaysFromNow;
    } catch (error) {
      console.error("Error checking due soon:", error);
      return false;
    }
  },

  isWaitingVerification: (payment) => {
    if (!payment) return false;

    if (payment.status === "paid" || payment.status === "cancelled") {
      return false;
    }

    const hasProof = !!payment.proof_image;
    const notVerified = !payment.verified_by;

    return hasProof && notVerified;
  },

  needsUpload: (payment) => {
    if (!payment) return false;

    const currentInfo = paymentUtils.getCurrentInstallmentInfo(payment);
    const hasDueDate = !!payment.due_date;
    const noProof = !payment.proof_image;
    const notVerified = !payment.verified_by;
    const notPaid = payment.status !== "paid" && payment.status !== "cancelled";
    const currentNotPaid = !currentInfo.isPaid;

    return hasDueDate && noProof && notVerified && notPaid && currentNotPaid;
  },

  hasActiveInvoice: (payment) => {
    if (!payment) return false;

    const hasDueDate = !!payment.due_date;
    const isNotPaid = payment.status !== "paid" && payment.status !== "cancelled";
    const hasRemaining = paymentUtils.parseFloatSafe(payment.amount_paid || 0) <
      paymentUtils.parseFloatSafe(payment.program_training_cost || 0);

    const notWaitingVerification = !paymentUtils.isWaitingVerification(payment);

    return hasDueDate && isNotPaid && hasRemaining && notWaitingVerification;
  },

  isWaitingForInvoice: (payment) => {
    if (!payment) return false;

    const hasRemaining = paymentUtils.parseFloatSafe(payment.amount_paid || 0) <
      paymentUtils.parseFloatSafe(payment.program_training_cost || 0);

    const currentInfo = paymentUtils.getCurrentInstallmentInfo(payment);
    const nextInfo = paymentUtils.getNextInstallmentInfo(payment);

    return (
      !payment.due_date &&
      hasRemaining &&
      payment.status !== "paid" &&
      payment.status !== "cancelled" &&
      currentInfo.isPaid &&
      nextInfo.exists &&
      !paymentUtils.isWaitingVerification(payment)
    );
  },

  getInstallmentInfo: (payment) => {
    if (!payment) {
      return {
        currentInstallment: 0,
        totalInstallments: 4,
        totalAmount: 0,
        paidAmount: 0,
        remainingAmount: 0,
        progressPercentage: 0,
      };
    }

    const totalAmount = paymentUtils.parseFloatSafe(
      payment.program_training_cost || 0
    );
    const paidAmount = paymentUtils.parseFloatSafe(payment.amount_paid || 0);
    const remainingAmount = totalAmount - paidAmount;

    const currentInfo = paymentUtils.getCurrentInstallmentInfo(payment);

    return {
      currentInstallment: currentInfo.number,
      totalInstallments: currentInfo.totalInstallments,
      totalAmount,
      paidAmount,
      remainingAmount,
      progressPercentage:
        totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
    };
  },

  validatePayment: (payment) => {
    if (!payment) return { isValid: false, error: "Payment data is null" };
    if (!payment.id) return { isValid: false, error: "Payment ID is missing" };
    if (!payment.invoice_number)
      return { isValid: false, error: "Invoice number is missing" };

    return { isValid: true, error: null };
  },

  getImageUrl: (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
  },
};

const Payment = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [paymentAlerts, setPaymentAlerts] = useState([]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  }, []);

  const safeCalculateProgress = useCallback((payment) => {
    if (!payment) return 0;

    const totalAmount =
      paymentUtils.parseFloatSafe(payment?.program_training_cost) || 0;
    const amountPaid = paymentUtils.parseFloatSafe(payment?.amount_paid) || 0;
    if (totalAmount <= 0) return 0;
    return Math.min(100, (amountPaid / totalAmount) * 100);
  }, []);

  const safeCalculateRemaining = useCallback((payment) => {
    if (!payment) return 0;

    const totalAmount =
      paymentUtils.parseFloatSafe(payment?.program_training_cost) || 0;
    const amountPaid = paymentUtils.parseFloatSafe(payment?.amount_paid) || 0;
    return paymentUtils.calculateRemainingSafe(totalAmount, amountPaid);
  }, []);

  const getDisplayAmount = useCallback((payment) => {
    if (!payment) return 0;
    return paymentUtils.getCurrentInstallmentAmount(payment);
  }, []);

  const generatePaymentAlerts = useCallback(
    (payments) => {
      if (!payments || payments.length === 0) return [];

      const alerts = [];

      payments.forEach((payment) => {
        const validation = paymentUtils.validatePayment(payment);
        if (!validation.isValid) {
          console.warn("Invalid payment data:", validation.error);
          return;
        }

        const currentInfo = paymentUtils.getCurrentInstallmentInfo(payment);
        const nextInfo = paymentUtils.getNextInstallmentInfo(payment);
        const hasActiveInvoice = paymentUtils.hasActiveInvoice(payment);
        const isWaitingForInvoice = paymentUtils.isWaitingForInvoice(payment);
        const isWaitingVerification = paymentUtils.isWaitingVerification(payment);
        const currentAmount = getDisplayAmount(payment);

        // console.log("Payment Alert Analysis:", {
        //   invoice: payment.invoice_number,
        //   status: payment.status,
        //   currentInstallment: currentInfo.number,
        //   isCurrentPaid: currentInfo.isPaid,
        //   isWaitingVerification: isWaitingVerification,
        //   hasActiveInvoice,
        //   isWaitingForInvoice,
        //   hasProof: !!payment.proof_image,
        //   verified: !!payment.verified_by,
        //   dueDate: payment.due_date
        // });

        if (hasActiveInvoice && paymentUtils.isOverdue(payment) && !isWaitingVerification) {
          alerts.push({
            type: "danger",
            title: "Pembayaran Terlambat!",
            message: `Tagihan ${payment.invoice_number} (${currentInfo.text}) sudah melewati batas waktu. Segera lakukan pembayaran.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            dueDate: payment.due_date,
            amount: currentAmount,
            installmentText: currentInfo.text,
            icon: "bi-exclamation-triangle",
            action: "upload",
          });
        }

        else if (hasActiveInvoice && paymentUtils.isDueSoon(payment) && !isWaitingVerification) {
          alerts.push({
            type: "warning",
            title: "Akan Jatuh Tempo",
            message: `Tagihan ${payment.invoice_number} (${currentInfo.text}) akan jatuh tempo pada ${formatDate(payment.due_date)}.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            dueDate: payment.due_date,
            amount: currentAmount,
            installmentText: currentInfo.text,
            icon: "bi-clock",
            action: "upload",
          });
        }

        if (isWaitingVerification) {
          alerts.push({
            type: "secondary",
            title: "Menunggu Verifikasi Admin",
            message: `Bukti pembayaran untuk ${payment.invoice_number} (${currentInfo.text}) sedang diverifikasi. Biasanya membutuhkan 1-2 hari kerja.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            installmentText: currentInfo.text,
            icon: "bi-hourglass-split",
            action: "view_proof",
          });
        }

        else if (hasActiveInvoice && paymentUtils.needsUpload(payment) && !isWaitingVerification) {
          alerts.push({
            type: "primary",
            title: "Upload Bukti Pembayaran",
            message: `Silakan upload bukti pembayaran untuk ${currentInfo.text} sebesar ${paymentUtils.formatCurrency(currentAmount)}.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            dueDate: payment.due_date,
            amount: currentAmount,
            installmentText: currentInfo.text,
            action: "upload",
            icon: "bi-upload",
          });
        }

        else if (isWaitingForInvoice && nextInfo.exists) {
          alerts.push({
            type: "info",
            title: "Menunggu Tagihan Berikutnya",
            message: `Pembayaran ${currentInfo.text} sudah diverifikasi. Admin akan menerbitkan tagihan ${nextInfo.text} untuk program ${payment.program_name}.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            installmentText: nextInfo.text,
            icon: "bi-clock-history",
          });
        }

        else if (!payment.due_date && payment.status === "pending" && !isWaitingVerification) {
          alerts.push({
            type: "info",
            title: "Menunggu Tagihan Pertama",
            message: `Admin akan menerbitkan tagihan cicilan pertama untuk program ${payment.program_name}. Silakan tunggu pemberitahuan selanjutnya.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            installmentText: "Cicilan 1",
            icon: "bi-info-circle",
          });
        }

        else if (payment.status === "paid") {
          alerts.push({
            type: "success",
            title: "Pembayaran Lunas",
            message: `Selamat! Pembayaran untuk ${payment.program_name} sudah lunas.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            icon: "bi-check-circle",
          });
        }

        else if (hasActiveInvoice && !isWaitingVerification) {
          alerts.push({
            type: "info",
            title: "Tagihan Aktif",
            message: `Tagihan ${currentInfo.text} sebesar ${paymentUtils.formatCurrency(currentAmount)}.`,
            paymentId: payment.id,
            invoiceNumber: payment.invoice_number,
            dueDate: payment.due_date,
            amount: currentAmount,
            installmentText: currentInfo.text,
            action: "upload",
            icon: "bi-receipt",
          });
        }
      });

      return alerts.sort((a, b) => {
        const priority = {
          secondary: 0,
          danger: 1,
          warning: 2,
          primary: 3,
          info: 4,
          success: 5,
        };
        return priority[a.type] - priority[b.type];
      });
    },
    [formatDate, getDisplayAmount]
  );

  const fetchPayments = useCallback(async () => {
    if (!user?.id) {
      console.warn("User ID not available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const response = await axios.get(`/api/payments/user/${user.id}`, {
        timeout: 10000,
      });

      if (response.data?.success) {
        const paymentsData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setPayments(paymentsData);

        const alerts = generatePaymentAlerts(paymentsData);
        setPaymentAlerts(alerts);

        // console.log("Payments loaded:", paymentsData.length);
        // console.log("Alerts generated:", alerts.length);
      } else {
        throw new Error(
          response.data?.message || "Format response tidak valid"
        );
      }
    } catch (error) {
      console.error("❌ Error fetching payments:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal memuat data pembayaran";

      setMessage({
        type: "error",
        text: errorMessage,
      });

      setPayments([]);
      setPaymentAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [user, generatePaymentAlerts]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage({
        type: "error",
        text: "Hanya file gambar (JPG, PNG, GIF) yang diizinkan",
      });
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "Ukuran file maksimal 5MB",
      });
      e.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setMessage({ type: "", text: "" });

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleUploadProof = async () => {
    if (!file || !selectedPayment) {
      setMessage({
        type: "error",
        text: "Pilih file bukti pembayaran terlebih dahulu",
      });
      return;
    }

    const validation = paymentUtils.validatePayment(selectedPayment);
    if (!validation.isValid) {
      setMessage({
        type: "error",
        text: "Data pembayaran tidak valid: " + validation.error,
      });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("proof_image", file);

      const response = await axios.post(
        `/api/payments/${selectedPayment.id}/upload-proof`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      if (response.data?.success) {
        setMessage({
          type: "success",
          text: "✅ Bukti pembayaran berhasil diupload! Status sekarang: Menunggu Verifikasi Admin. Admin akan memverifikasi dalam 1-2 hari kerja.",
        });

        handleCloseUploadModal();

        setTimeout(() => {
          fetchPayments();
        }, 2000);
      } else {
        throw new Error(response.data?.message || "Upload gagal");
      }
    } catch (error) {
      console.error("❌ Error uploading proof:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Gagal upload bukti pembayaran";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const canUploadProof = (payment) => {
    if (!payment) return false;
    return paymentUtils.needsUpload(payment);
  };

  const canDownloadReceipt = (payment) => {
    if (!payment) return false;
    return (
      payment.verified_by &&
      payment.status !== "pending" &&
      payment.status !== "cancelled"
    );
  };

  const downloadReceipt = async (payment) => {
    const validation = paymentUtils.validatePayment(payment);
    if (!validation.isValid) {
      setMessage({
        type: "error",
        text: "Data pembayaran tidak valid: " + validation.error,
      });
      return;
    }

    try {
      try {
        const response = await axios.get(
          `/api/payments/${payment.id}/receipt`,
          {
            responseType: "blob",
            timeout: 15000,
          }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `kwitansi-${payment.receipt_number || payment.invoice_number}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        setMessage({
          type: "success",
          text: "Kwitansi PDF berhasil diunduh",
        });
        return;
      } catch (pdfError) {
        console.log("PDF receipt not available, generating HTML receipt...");
      }

      const receiptWindow = window.open("", "_blank");
      if (!receiptWindow) {
        setMessage({
          type: "error",
          text: "Popup diblokir. Izinkan popup untuk generate kwitansi.",
        });
        return;
      }

      const receiptDate = payment.payment_date
        ? new Date(payment.payment_date).toLocaleDateString("id-ID")
        : new Date().toLocaleDateString("id-ID");

      const totalAmount = paymentUtils.parseFloatSafe(
        payment.program_training_cost || 0
      );
      const amountPaid = paymentUtils.parseFloatSafe(payment.amount_paid || 0);
      const remaining = paymentUtils.calculateRemainingSafe(
        totalAmount,
        amountPaid
      );

      const currentInstallmentAmount = getDisplayAmount(payment);
      const installmentText = paymentUtils.getInstallmentText(payment);

      receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>KWITANSI - ${payment.receipt_number || payment.invoice_number}</title>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
              overflow: hidden;
              position: relative;
            }
            
            .receipt-header {
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .receipt-header::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
              background-size: 20px 20px;
              animation: float 20s linear infinite;
            }
            
            @keyframes float {
              0% { transform: translate(0, 0) rotate(0deg); }
              100% { transform: translate(-20px, -20px) rotate(360deg); }
            }
            
            .receipt-title {
              font-size: 2.5em;
              font-weight: 700;
              margin-bottom: 10px;
              letter-spacing: 2px;
              position: relative;
              z-index: 1;
            }
            
            .receipt-subtitle {
              font-size: 1.2em;
              font-weight: 300;
              opacity: 0.9;
              position: relative;
              z-index: 1;
            }
            
            .company-info {
              background: #f8f9fa;
              padding: 25px 30px;
              border-bottom: 1px solid #e9ecef;
              text-align: center;
            }
            
            .company-name {
              font-size: 1.4em;
              font-weight: 700;
              color: #2c3e50;
              margin-bottom: 5px;
            }
            
            .company-address {
              color: #6c757d;
              line-height: 1.5;
            }
            
            .receipt-content {
              padding: 40px 30px;
            }
            
            .receipt-info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
              background: #f8f9fa;
              padding: 25px;
              border-radius: 15px;
              border: 1px solid #e9ecef;
            }
            
            .info-item {
              display: flex;
              flex-direction: column;
              gap: 5px;
            }
            
            .info-label {
              font-size: 0.85em;
              color: #6c757d;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-value {
              font-size: 1.1em;
              font-weight: 600;
              color: #2c3e50;
            }
            
            .installment-highlight {
              background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
              border: 2px solid #ffd43b;
              border-radius: 15px;
              padding: 25px;
              margin: 30px 0;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .installment-highlight::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #ffd43b, #f08c00);
            }
            
            .installment-text {
              font-size: 1.1em;
              color: #856404;
              font-weight: 500;
              margin-bottom: 10px;
            }
            
            .installment-amount {
              font-size: 1.8em;
              font-weight: 700;
              color: #e67700;
            }
            
            .section {
              margin-bottom: 35px;
            }
            
            .section-title {
              font-size: 1.1em;
              font-weight: 600;
              color: #007bff;
              padding: 12px 20px;
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
              border-radius: 10px;
              margin-bottom: 20px;
              border-left: 4px solid #007bff;
            }
            
            .data-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            
            .data-item {
              display: flex;
              flex-direction: column;
              gap: 5px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 10px;
              border: 1px solid #e9ecef;
            }
            
            .progress-container {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 15px;
              border: 1px solid #e9ecef;
            }
            
            .progress-header {
              display: flex;
              justify-content: between;
              margin-bottom: 15px;
              font-weight: 600;
              color: #2c3e50;
            }
            
            .progress-bar-container {
              height: 12px;
              background: #e9ecef;
              border-radius: 10px;
              overflow: hidden;
              margin: 15px 0;
            }
            
            .progress-bar {
              height: 100%;
              background: linear-gradient(90deg, #28a745, #20c997);
              border-radius: 10px;
              transition: width 0.5s ease;
              position: relative;
              overflow: hidden;
            }
            
            .progress-bar::after {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
              animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
              0% { left: -100%; }
              100% { left: 100%; }
            }
            
            .progress-text {
              text-align: center;
              font-weight: 600;
              color: #495057;
              font-size: 1.1em;
            }
            
            .payment-table {
              width: 100%;
              border-collapse: collapse;
              background: white;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
            }
            
            .payment-table th {
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
              color: white;
              padding: 18px 15px;
              text-align: left;
              font-weight: 600;
              font-size: 0.9em;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .payment-table td {
              padding: 18px 15px;
              border-bottom: 1px solid #e9ecef;
              font-weight: 500;
            }
            
            .payment-table tr:last-child td {
              border-bottom: none;
            }
            
            .payment-table .amount {
              text-align: right;
              font-weight: 600;
            }
            
            .payment-table .total-row {
              background: #f8f9fa;
              font-weight: 700;
              font-size: 1.1em;
            }
            
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
              color: white;
              border-radius: 25px;
              font-weight: 600;
              font-size: 1.1em;
              text-transform: uppercase;
              letter-spacing: 1px;
              box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
            }
            
            .signature-area {
              margin-top: 50px;
              text-align: right;
              padding: 30px;
              background: #f8f9fa;
              border-radius: 15px;
              border: 1px solid #e9ecef;
            }
            
            .signature-line {
              width: 300px;
              height: 1px;
              background: #6c757d;
              margin: 60px 0 10px auto;
            }
            
            .footer {
              background: #2c3e50;
              color: white;
              padding: 30px;
              text-align: center;
              margin-top: 40px;
            }
            
            .footer-text {
              font-size: 0.9em;
              opacity: 0.8;
              line-height: 1.6;
            }
            
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 8em;
              font-weight: 900;
              color: rgba(0, 123, 255, 0.03);
              pointer-events: none;
              z-index: 0;
              white-space: nowrap;
            }
            
            @media print {
              body {
                background: white !important;
                padding: 0 !important;
              }
              .receipt-container {
                box-shadow: none !important;
                margin: 0 !important;
                max-width: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="watermark">FITALENTA</div>
            
            <div class="receipt-header">
              <h1 class="receipt-title">KWITANSI RESMI</h1>
              <p class="receipt-subtitle">Program Magang Perusahaan</p>
            </div>
            
            <div class="company-info">
              <div class="company-name">FITALENTA</div>
              <div class="company-address">
                Jl. Ganesa No.15E, Lb. Siliwangi, Kec. Coblong Bandung 40132<br>
                Telp: (021) 123-4567 | Email: admin@fitalenta.com
              </div>
            </div>
            
            <div class="receipt-content">
              <div class="receipt-info-grid">
                <div class="info-item">
                  <span class="info-label">No. Kwitansi</span>
                  <span class="info-value">${payment.receipt_number || payment.invoice_number}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">No. Invoice</span>
                  <span class="info-value">${payment.invoice_number}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Tanggal Kwitansi</span>
                  <span class="info-value">${receiptDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status Pembayaran</span>
                  <span class="info-value">${paymentUtils.getStatusText(payment.status)}</span>
                </div>
              </div>

              <div class="installment-highlight">
                <div class="installment-text">${installmentText}</div>
                <div class="installment-amount">${paymentUtils.formatCurrency(currentInstallmentAmount)}</div>
              </div>

              <div class="section">
                <div class="section-title">DATA PESERTA</div>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="info-label">Nama Lengkap</span>
                    <span class="info-value">${user?.full_name || "N/A"}</span>
                  </div>
                  <div class="data-item">
                    <span class="info-label">Email</span>
                    <span class="info-value">${user?.email || "N/A"}</span>
                  </div>
                  <div class="data-item">
                    <span class="info-label">Nomor Telepon</span>
                    <span class="info-value">${user?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">DETAIL PROGRAM</div>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="info-label">Program Magang</span>
                    <span class="info-value">${payment.program_name || "N/A"}</span>
                  </div>
                  <div class="data-item">
                    <span class="info-label">Durasi Program</span>
                    <span class="info-value">${payment.program_duration || "N/A"}</span>
                  </div>
                  <div class="data-item">
                    <span class="info-label">Total Biaya Program</span>
                    <span class="info-value">${paymentUtils.formatCurrency(totalAmount)}</span>
                  </div>
                  <div class="data-item">
                    <span class="info-label">Plan Cicilan</span>
                    <span class="info-value">${payment.program_installment_plan || "4 cicilan"}</span>
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">PROGRESS PEMBAYARAN</div>
                <div class="progress-container">
                  <div class="progress-header">
                    <span>Progress Pembayaran</span>
                    <span>${safeCalculateProgress(payment).toFixed(1)}%</span>
                  </div>
                  <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${safeCalculateProgress(payment)}%"></div>
                  </div>
                  <div class="progress-text">
                    ${paymentUtils.formatCurrency(amountPaid)} / ${paymentUtils.formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>

              <div class="section">
                <div class="section-title">RINCIAN PEMBAYARAN</div>
                <table class="payment-table">
                  <thead>
                    <tr>
                      <th>Keterangan</th>
                      <th style="text-align: right;">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Biaya Program ${payment.program_name || ""}</td>
                      <td class="amount">${paymentUtils.formatCurrency(totalAmount)}</td>
                    </tr>
                    <tr class="total-row">
                      <td>TOTAL TAGIHAN</td>
                      <td class="amount">${paymentUtils.formatCurrency(totalAmount)}</td>
                    </tr>
                    <tr class="total-row">
                      <td>SUDAH DIBAYAR</td>
                      <td class="amount">${paymentUtils.formatCurrency(amountPaid)}</td>
                    </tr>
                    ${remaining > 0 ? `
                    <tr class="total-row">
                      <td>SISA TAGIHAN</td>
                      <td class="amount">${paymentUtils.formatCurrency(remaining)}</td>
                    </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>

              <div style="text-align: center; margin: 40px 0;">
                <div class="status-badge">
                  ${payment.status === "paid" ? "LUNAS" : paymentUtils.getInstallmentText(payment).toUpperCase()}
                </div>
              </div>

              ${payment.status === "paid" ? `
              <div class="section">
                <div class="section-title">KONFIRMASI PEMBAYARAN</div>
                <div class="data-grid">
                  <div class="data-item">
                    <span class="info-label">Status</span>
                    <span class="info-value" style="color: #28a745; font-weight: 700;">LUNAS</span>
                  </div>
                  <div class="data-item">
                    <span class="info-label">Tanggal Pembayaran</span>
                    <span class="info-value">${receiptDate}</span>
                  </div>
                  <div class="data-item">
                    <span class="info-label">Metode Pembayaran</span>
                    <span class="info-value">${payment.payment_method || "Transfer Bank"}</span>
                  </div>
                  ${payment.bank_name ? `
                  <div class="data-item">
                    <span class="info-label">Bank</span>
                    <span class="info-value">${payment.bank_name}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              ` : ''}

              <div class="signature-area">
                <p>Bandung, ${receiptDate}</p>
                <div class="signature-line"></div>
                <p style="font-weight: 700; margin-top: 10px;">Admin FITALENTA</p>
              </div>
            </div>

            <div class="footer">
              <p class="footer-text">
                ** Kwitansi ini sah dan dapat digunakan sebagai bukti pembayaran yang valid **<br>
                Terima kasih telah mempercayai program magang kami<br>
                Generated on: ${new Date().toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </body>
        </html>
      `);

      receiptWindow.document.close();

      setTimeout(() => {
        receiptWindow.print();
      }, 1000);
    } catch (error) {
      console.error("❌ Error generating receipt:", error);
      setMessage({
        type: "error",
        text: "Gagal mengunduh kwitansi: " + (error.message || "Unknown error"),
      });
    }
  };

  const handleShowDetail = (payment) => {
    const validation = paymentUtils.validatePayment(payment);
    if (!validation.isValid) {
      setMessage({
        type: "error",
        text: "Data pembayaran tidak valid: " + validation.error,
      });
      return;
    }

    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedPayment(null);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedPayment(null);
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setMessage({ type: "", text: "" });
  };

  const handleShowProof = (payment) => {
    setSelectedPayment(payment);
    setShowProofModal(true);
  };

  const handleCloseProofModal = () => {
    setShowProofModal(false);
    setSelectedPayment(null);
  };

  const handleAlertAction = (alert) => {
    const payment = payments.find((p) => p.id === alert.paymentId);
    if (!payment) {
      setMessage({
        type: "error",
        text: "Data pembayaran tidak ditemukan",
      });
      return;
    }

    if (alert.action === "upload") {
      setSelectedPayment(payment);
      setShowUploadModal(true);
    } else if (alert.action === "view_proof" && payment.proof_image) {
      handleShowProof(payment);
    }
  };

  const dismissAlert = (index) => {
    setPaymentAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  const dismissAllAlerts = () => {
    setPaymentAlerts([]);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "50vh" }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "3rem", height: "3rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Memuat data pembayaran...</p>
          </div>
        </div>
      </div>
    );
  }

  const alertCounts = {
    danger: paymentAlerts.filter((alert) => alert.type === "danger").length,
    warning: paymentAlerts.filter((alert) => alert.type === "warning").length,
    primary: paymentAlerts.filter((alert) => alert.type === "primary").length,
    secondary: paymentAlerts.filter((alert) => alert.type === "secondary")
      .length,
    info: paymentAlerts.filter((alert) => alert.type === "info").length,
    success: paymentAlerts.filter((alert) => alert.type === "success").length,
  };

  const renderPaymentRow = (payment) => {
    const progress = safeCalculateProgress(payment);
    const isPaymentOverdue = paymentUtils.isOverdue(payment);
    const hasActiveInvoice = paymentUtils.hasActiveInvoice(payment);
    const isWaitingForInvoice = paymentUtils.isWaitingForInvoice(payment);
    const isWaitingVerification = paymentUtils.isWaitingVerification(payment);
    const currentAmount = getDisplayAmount(payment);

    const currentInfo = paymentUtils.getCurrentInstallmentInfo(payment);
    const nextInfo = paymentUtils.getNextInstallmentInfo(payment);

    return (
      <tr key={payment.id}>
        <td>
          <div>
            <strong className="d-block">
              {payment.invoice_number}
            </strong>
            {payment.receipt_number && (
              <small className="text-success">
                Kwitansi: {payment.receipt_number}
              </small>
            )}

            {isWaitingVerification && (
              <div className="small text-warning mt-1">
                <i className="bi bi-hourglass-split me-1"></i>
                <strong>Menunggu Verifikasi {currentInfo.text}</strong>
              </div>
            )}

            {/* Informasi cicilan aktif */}
            {hasActiveInvoice && !isWaitingVerification && (
              <div className="small text-primary mt-1">
                <strong>
                  {currentAmount > 0
                    ? `Tagihan ${currentInfo.text}: ${paymentUtils.formatCurrency(currentAmount)}`
                    : `Tagihan ${currentInfo.text}`}
                </strong>
              </div>
            )}

            {/* Informasi: Menunggu Tagihan */}
            {isWaitingForInvoice && nextInfo.exists && !isWaitingVerification && (
              <div className="small text-primary mt-1">
                <i className="bi bi-clock me-1"></i>
                <strong>Menunggu {nextInfo.text} dari Admin</strong>
              </div>
            )}

            {/* Informasi: Cicilan sudah dibayar, menunggu berikutnya */}
            {currentInfo.isPaid && nextInfo.exists && !hasActiveInvoice && !isWaitingVerification && (
              <div className="small text-success mt-1">
                <i className="bi bi-check-circle me-1"></i>
                <strong>{currentInfo.text}</strong>
              </div>
            )}
          </div>
        </td>
        <td>
          <div className="fw-bold">
            {payment.program_name}
          </div>
          <div className="small text-muted">
            {payment.program_duration}
          </div>
          <div className="small">
            <strong>
              Total:{" "}
              {paymentUtils.formatCurrency(
                payment.program_training_cost
              )}
            </strong>
          </div>
          <div className="small text-muted">
            Plan:{" "}
            {payment.program_installment_plan ||
              "4 cicilan"}
          </div>
        </td>
        <td>
          <div
            className="progress"
            style={{ height: "20px" }}
          >
            <div
              className="progress-bar bg-success"
              role="progressbar"
              style={{ width: `${progress}%` }}
            >
              {progress.toFixed(0)}%
            </div>
          </div>
          <div className="small text-center mt-1">
            {paymentUtils.formatCurrency(
              payment.amount_paid || 0
            )}{" "}
            /{" "}
            {paymentUtils.formatCurrency(
              payment.program_training_cost || 0
            )}
          </div>
          {progress < 100 && (
            <div className="small text-muted text-center">
              Sisa:{" "}
              {paymentUtils.formatCurrency(
                safeCalculateRemaining(payment)
              )}
            </div>
          )}
        </td>
        <td>
          <div>
            {paymentUtils.getStatusBadge(payment.status)}

            {/* Status Menunggu Verifikasi */}
            {isWaitingVerification && (
              <div className="small text-warning mt-1">
                <i className="bi bi-hourglass-split me-1"></i>
                Menunggu Verifikasi Admin
              </div>
            )}

            {/* Informasi cicilan */}
            {hasActiveInvoice && payment.due_date && !isWaitingVerification && (
              <div
                className={`small mt-1 ${isPaymentOverdue
                  ? "text-danger fw-bold"
                  : "text-muted"
                  }`}
              >
                <i className="bi bi-calendar-event me-1"></i>
                {currentInfo.text} - Jatuh tempo:{" "}
                {formatDate(payment.due_date)}
                {isPaymentOverdue && (
                  <span className="badge bg-danger ms-1">
                    Terlambat
                  </span>
                )}
              </div>
            )}

            {/* Informasi: Menunggu Tagihan */}
            {isWaitingForInvoice && nextInfo.exists && !isWaitingVerification && (
              <div className="small text-primary mt-1">
                <i className="bi bi-clock me-1"></i>
                Menunggu {nextInfo.text}
              </div>
            )}

            {/* Informasi: Cicilan sudah dibayar, menunggu berikutnya */}
            {currentInfo.isPaid && nextInfo.exists && !hasActiveInvoice && !isWaitingVerification && (
              <div className="small text-success mt-1">
                <i className="bi bi-check-circle me-1"></i>
                {currentInfo.text} sudah dibayar, menunggu {nextInfo.text}
              </div>
            )}

            {/* Informasi: Sudah Lunas */}
            {payment.status === "paid" && (
              <div className="small text-success mt-1">
                <i className="bi bi-check-circle me-1"></i>
                Pembayaran lunas
              </div>
            )}
          </div>
        </td>

        <td>
          {payment.receipt_number ? (
            <span className="badge bg-success">
              {payment.receipt_number}
            </span>
          ) : (
            <span className="badge bg-secondary">-</span>
          )}
        </td>
        <td>
          <div className="btn-group btn-group-sm">
            {/* Upload button hanya jika ada tagihan aktif dan perlu upload */}
            {canUploadProof(payment) && (
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  setSelectedPayment(payment);
                  setShowUploadModal(true);
                }}
                title="Upload Bukti Bayar"
              >
                <i className="bi bi-upload"></i>
              </button>
            )}

            {/* View Proof Button jika sudah upload */}
            {payment.proof_image && (
              <button
                className="btn btn-outline-primary"
                onClick={() => handleShowProof(payment)}
                title="Lihat Bukti Pembayaran"
              >
                <i className="bi bi-eye"></i>
              </button>
            )}

            {/* Download Receipt Button */}
            {canDownloadReceipt(payment) && (
              <button
                className="btn btn-outline-primary"
                onClick={() => downloadReceipt(payment)}
                title="Download Kwitansi"
              >
                <i className="bi bi-download"></i>
              </button>
            )}

            {/* View Details Button */}
            <button
              className="btn btn-outline-primary"
              onClick={() => handleShowDetail(payment)}
              title="Lihat Detail Pembayaran"
            >
              <i className="bi bi-info-circle"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>Manajemen Pembayaran</h2>
          <p className="text-muted">Kelola pembayaran program magang Anda</p>

          {/* Quick Status Summary */}
          {paymentAlerts.length > 0 && (
            <div className="alert alert-warning mb-0 mt-2">
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>
                  <strong>
                    Perhatian: Anda memiliki {paymentAlerts.length}{" "}
                    pemberitahuan
                  </strong>
                  <div className="mt-1">
                    {alertCounts.danger > 0 && (
                      <span className="badge bg-danger me-2">
                        <i className="bi bi-flag-fill me-1"></i>
                        Terlambat: {alertCounts.danger}
                      </span>
                    )}
                    {alertCounts.warning > 0 && (
                      <span className="badge bg-warning text-dark me-2">
                        <i className="bi bi-clock me-1"></i>
                        Akan Jatuh Tempo: {alertCounts.warning}
                      </span>
                    )}
                    {alertCounts.primary > 0 && (
                      <span className="badge bg-primary me-2">
                        <i className="bi bi-upload me-1"></i>
                        Perlu Upload: {alertCounts.primary}
                      </span>
                    )}
                    {alertCounts.secondary > 0 && (
                      <span className="badge bg-secondary me-2">
                        <i className="bi bi-hourglass-split me-1"></i>
                        Menunggu Verifikasi: {alertCounts.secondary}
                      </span>
                    )}
                    {alertCounts.info > 0 && (
                      <span className="badge bg-info me-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Informasi: {alertCounts.info}
                      </span>
                    )}
                    {alertCounts.success > 0 && (
                      <span className="badge bg-success me-2">
                        <i className="bi bi-check-circle me-1"></i>
                        Lunas: {alertCounts.success}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div
          className={`alert alert-${message.type === "error"
            ? "danger"
            : message.type === "success"
              ? "success"
              : "info"
            } alert-dismissible fade show`}
          role="alert"
        >
          {message.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage({ type: "", text: "" })}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Payment Alerts Section */}
      {paymentAlerts.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-bell-fill me-2"></i>
                  Pemberitahuan Pembayaran
                </h6>
                <span className="badge bg-light text-primary">
                  {paymentAlerts.length}
                </span>
              </div>
              <div className="card-body p-0">
                {paymentAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`alert alert-${alert.type} alert-dismissible fade show m-3 mb-2`}
                    role="alert"
                  >
                    <div className="d-flex align-items-start">
                      <i className={`bi ${alert.icon} me-3 mt-1 fs-5`}></i>
                      <div className="flex-grow-1">
                        <h6 className="alert-heading mb-1">{alert.title}</h6>
                        <p className="mb-1">{alert.message}</p>
                        {alert.amount > 0 && (
                          <p className="mb-1">
                            <strong>
                              Jumlah:{" "}
                              {paymentUtils.formatCurrency(alert.amount)}
                            </strong>
                          </p>
                        )}
                        {alert.dueDate && (
                          <small className="text-muted">
                            <i className="bi bi-calendar-event me-1"></i>
                            Jatuh tempo: {formatDate(alert.dueDate)}
                          </small>
                        )}
                      </div>
                      <div className="ms-3 d-flex flex-column gap-1">
                        {alert.action === "upload" && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleAlertAction(alert)}
                          >
                            <i className="bi bi-upload me-1"></i>
                            Upload
                          </button>
                        )}
                        {alert.action === "view_proof" && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleAlertAction(alert)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Lihat Bukti
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => dismissAlert(index)}
                          aria-label="Close"
                        ></button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Quick Actions */}
                <div className="p-3 bg-light border-top">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {paymentAlerts.length} pemberitahuan aktif
                    </small>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={dismissAllAlerts}
                    >
                      <i className="bi bi-eye-slash me-1"></i>
                      Sembunyikan Semua
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Card */}
      <div className="alert alert-info mb-4">
        <h6>
          <i className="bi bi-info-circle me-2"></i>Informasi Sistem Pembayaran
        </h6>
        <ol className="mb-2">
          <li>Admin menerbitkan tagihan cicilan 1 setelah Anda dinyatakan lolos interview</li>
          <li>Anda melakukan pembayaran dan upload bukti</li>
          <li>Admin memverifikasi pembayaran (1-2 hari kerja)</li>
          <li>Setelah verifikasi, admin akan menerbitkan tagihan cicilan berikutnya</li>
          <li>Proses berulang hingga pembayaran lunas</li>
        </ol>
        <p className="mb-0">
          <strong>Note:</strong> Jika status "Menunggu Tagihan Admin", silakan tunggu admin menerbitkan tagihan berikutnya.
        </p>
      </div>

      {/* Payments List */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Invoice Pembayaran</h5>
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={fetchPayments}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
            <div className="card-body">
              {payments.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-muted mb-3">
                    <i className="bi bi-receipt display-4"></i>
                  </div>
                  <h5>Belum ada pembayaran</h5>
                  <p className="text-muted">
                    Setelah mendaftar program dan lolos interview, invoice
                    pembayaran akan muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover text-center">
                    <thead className="table-light align-middle">
                      <tr>
                        <th>Invoice</th>
                        <th>Program & Biaya</th>
                        <th>Progress Pembayaran</th>
                        <th>Status & Jatuh Tempo</th>
                        <th>Kwitansi</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="align-middle">
                      {payments.map(renderPaymentRow)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && selectedPayment && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-upload me-2"></i>
                  Upload Bukti Pembayaran
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseUploadModal}
                  disabled={uploading}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Setelah upload, admin akan memverifikasi pembayaran Anda.
                  Status akan diperbarui dalam 1-2 hari kerja.
                </div>

                <div className="row mb-4">
                  <div className="col-md-6">
                    <h6>Informasi Pembayaran</h6>
                    <p>
                      <strong>Invoice:</strong> {selectedPayment.invoice_number}
                    </p>
                    <p>
                      <strong>Program:</strong> {selectedPayment.program_name}
                    </p>
                    <p>
                      <strong>Cicilan:</strong>{" "}
                      {paymentUtils.getInstallmentText(selectedPayment)}
                    </p>
                    <p>
                      <strong>Jumlah yang Harus Dibayar:</strong>{" "}
                      <span className="fw-bold text-primary">
                        {paymentUtils.formatCurrency(
                          getDisplayAmount(selectedPayment)
                        )}
                      </span>
                    </p>
                    {selectedPayment.due_date && (
                      <p
                        className={
                          paymentUtils.isOverdue(selectedPayment)
                            ? "text-danger fw-bold"
                            : ""
                        }
                      >
                        <strong>Jatuh Tempo:</strong>{" "}
                        {formatDate(selectedPayment.due_date)}
                        {paymentUtils.isOverdue(selectedPayment) && (
                          <span className="badge bg-danger ms-2">
                            TERLAMBAT
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6>Detail Biaya</h6>
                    <p>
                      <strong>Total Biaya:</strong>{" "}
                      {paymentUtils.formatCurrency(
                        selectedPayment.program_training_cost || 0
                      )}
                    </p>
                    <p>
                      <strong>Sudah Dibayar:</strong>{" "}
                      {paymentUtils.formatCurrency(
                        selectedPayment.amount_paid || 0
                      )}
                    </p>
                    <p>
                      <strong>Sisa Tagihan:</strong>{" "}
                      {paymentUtils.formatCurrency(
                        safeCalculateRemaining(selectedPayment)
                      )}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="proofFile" className="form-label">
                    Pilih File Bukti Pembayaran *
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="proofFile"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <div className="form-text">
                    Format: JPG, PNG, GIF (Maksimal 5MB)
                  </div>
                </div>

                {previewUrl && (
                  <div className="mb-3">
                    <h6>Preview:</h6>
                    <img
                      src={previewUrl}
                      alt="Preview bukti pembayaran"
                      className="img-fluid rounded border"
                      style={{ maxHeight: "300px" }}
                      onError={(e) => {
                        console.error("Error loading preview image");
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {file && (
                  <div className="alert alert-primary">
                    <strong>File terpilih:</strong> {file.name}
                    <br />
                    <small>
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </div>
                )}

                {paymentUtils.isOverdue(selectedPayment) && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Pembayaran ini sudah melewati batas waktu. Segera lakukan
                    pembayaran untuk menghindari konsekuensi.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseUploadModal}
                  disabled={uploading}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUploadProof}
                  disabled={!file || uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>Upload Bukti
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Proof Modal */}
      {showProofModal && selectedPayment && selectedPayment.proof_image && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-eye me-2"></i>
                  Bukti Pembayaran - {selectedPayment.invoice_number}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseProofModal}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={paymentUtils.getImageUrl(selectedPayment.proof_image)}
                  alt="Bukti Pembayaran"
                  className="img-fluid rounded border"
                  style={{ maxHeight: "70vh" }}
                  onError={(e) => {
                    console.error("Error loading proof image");
                    e.target.style.display = "none";
                    setMessage({
                      type: "error",
                      text: "Gagal memuat gambar bukti pembayaran",
                    });
                  }}
                />
                <div className="mt-3">
                  <p>
                    <strong>Status:</strong> {paymentUtils.getStatusBadge(selectedPayment.status)}
                  </p>
                  <p className="text-muted">
                    Admin akan memverifikasi pembayaran ini dalam 1-2 hari kerja.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseProofModal}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Payment Modal */}
      {showDetailModal && selectedPayment && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-receipt me-2"></i>Detail Invoice -{" "}
                  {paymentUtils.getInstallmentText(selectedPayment)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetail}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">Informasi Invoice</h6>
                      </div>
                      <div className="card-body">
                        <table className="table table-sm table-borderless">
                          <tbody>
                            <tr>
                              <td>
                                <strong>Nomor Invoice:</strong>
                              </td>
                              <td>{selectedPayment.invoice_number}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Nomor Kwitansi:</strong>
                              </td>
                              <td>
                                {selectedPayment.receipt_number ? (
                                  <span className="badge bg-success">
                                    {selectedPayment.receipt_number}
                                  </span>
                                ) : (
                                  <span className="badge bg-secondary">-</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Program:</strong>
                              </td>
                              <td>{selectedPayment.program_name}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Durasi:</strong>
                              </td>
                              <td>{selectedPayment.program_duration}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Plan Cicilan:</strong>
                              </td>
                              <td>
                                {selectedPayment.program_installment_plan ||
                                  "4 cicilan"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Cicilan Saat Ini:</strong>
                              </td>
                              <td>
                                <strong>
                                  {paymentUtils.getInstallmentText(
                                    selectedPayment
                                  )}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Jumlah yang Harus Dibayar:</strong>
                              </td>
                              <td>
                                <strong>
                                  {paymentUtils.formatCurrency(
                                    getDisplayAmount(selectedPayment)
                                  )}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Jatuh Tempo:</strong>
                              </td>
                              <td>
                                {selectedPayment.due_date ? (
                                  <span
                                    className={
                                      paymentUtils.isOverdue(selectedPayment)
                                        ? "text-danger fw-bold"
                                        : ""
                                    }
                                  >
                                    {formatDate(selectedPayment.due_date)}
                                    {paymentUtils.isOverdue(
                                      selectedPayment
                                    ) && (
                                        <span className="badge bg-danger ms-2">
                                          TERLAMBAT
                                        </span>
                                      )}
                                  </span>
                                ) : (
                                  <span className="text-info">
                                    <i className="bi bi-clock me-1"></i>
                                    Menunggu tagihan dari admin
                                  </span>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card mb-3">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">Status Pembayaran</h6>
                      </div>
                      <div className="card-body">
                        <table className="table table-sm table-borderless">
                          <tbody>
                            <tr>
                              <td>
                                <strong>Status:</strong>
                              </td>
                              <td>
                                {paymentUtils.getStatusBadge(
                                  selectedPayment.status
                                )}
                                {paymentUtils.isWaitingVerification(selectedPayment) && (
                                  <div className="small text-warning mt-1">
                                    <i className="bi bi-hourglass-split me-1"></i>
                                    Menunggu Verifikasi Admin
                                  </div>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Tanggal Invoice:</strong>
                              </td>
                              <td>{formatDate(selectedPayment.created_at)}</td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Tanggal Bayar:</strong>
                              </td>
                              <td>
                                {selectedPayment.payment_date
                                  ? formatDate(selectedPayment.payment_date)
                                  : "-"}
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <strong>Terverifikasi Oleh:</strong>
                              </td>
                              <td>
                                {selectedPayment.verified_by
                                  ? "Admin"
                                  : "Belum diverifikasi"}
                              </td>
                            </tr>
                            {selectedPayment.proof_image && (
                              <tr>
                                <td>
                                  <strong>Bukti Pembayaran:</strong>
                                </td>
                                <td>
                                  <span className="badge bg-success me-2">
                                    Sudah diupload
                                  </span>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-3">
                  <div className="card-header bg-primary text-white">
                    <h6 className="mb-0">Progress Pembayaran</h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-md-4">
                        <div className="border rounded p-3">
                          <h5 className="text-primary">
                            {paymentUtils.formatCurrency(
                              selectedPayment.program_training_cost || 0
                            )}
                          </h5>
                          <small className="text-muted">
                            Total Biaya Program
                          </small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="border rounded p-3">
                          <h5 className="text-success">
                            {paymentUtils.formatCurrency(
                              selectedPayment.amount_paid || 0
                            )}
                          </h5>
                          <small className="text-muted">Sudah Dibayar</small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="border rounded p-3">
                          <h5 className="text-warning">
                            {paymentUtils.formatCurrency(
                              safeCalculateRemaining(selectedPayment)
                            )}
                          </h5>
                          <small className="text-muted">Sisa Tagihan</small>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="progress" style={{ height: "25px" }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{
                            width: `${safeCalculateProgress(selectedPayment)}%`,
                          }}
                        >
                          {safeCalculateProgress(selectedPayment).toFixed(0)}%
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <small>0%</small>
                        <small>100%</small>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPayment.payment_method && (
                  <div className="card mb-3">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">Metode Pembayaran</h6>
                    </div>
                    <div className="card-body">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          <tr>
                            <td width="30%">
                              <strong>Metode:</strong>
                            </td>
                            <td>{selectedPayment.payment_method}</td>
                          </tr>
                          {selectedPayment.bank_name && (
                            <tr>
                              <td>
                                <strong>Bank:</strong>
                              </td>
                              <td>{selectedPayment.bank_name}</td>
                            </tr>
                          )}
                          {selectedPayment.account_number && (
                            <tr>
                              <td>
                                <strong>No. Rekening:</strong>
                              </td>
                              <td>{selectedPayment.account_number}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedPayment.notes && (
                  <div className="card">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">Catatan</h6>
                    </div>
                    <div className="card-body">
                      <p className="mb-0">{selectedPayment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDetail}
                >
                  Tutup
                </button>
                {canDownloadReceipt(selectedPayment) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      downloadReceipt(selectedPayment);
                      handleCloseDetail();
                    }}
                  >
                    <i className="bi bi-download me-2"></i>Download Kwitansi
                  </button>
                )}
                {canUploadProof(selectedPayment) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      handleCloseDetail();
                      setSelectedPayment(selectedPayment);
                      setShowUploadModal(true);
                    }}
                  >
                    <i className="bi bi-upload me-2"></i>Upload Bukti Bayar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;