const helpers = {
  formatCurrency: (amount) => {
    if (!amount && amount !== 0) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  },

  formatDateForBirthDate: (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  },

  formatDate: (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  },

  formatDateTime: (date) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(date));
  },
};

export default helpers;
