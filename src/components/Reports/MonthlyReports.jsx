import React, { useState, useEffect, useMemo, useCallback } from "react";
import apiCall from "../../services/api";
import Alert from "../UI/Alert";

const MonthlyReports = ({
  hasPermission,
  handleLogout,
  activeTab,
  setActiveTab,
  setOpnameData,
}) => {
  const [reportMonth, setReportMonth] = useState("");
  const [filterSparepart, setFilterSparepart] = useState("");
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [reportSummary, setReportSummary] = useState(null);

  const showAlert = useCallback((message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert({ message: "", type: "" }), 5000);
  }, []);

  // Fetch available months and set default report month
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await apiCall("api/monthly-reports/months");
        if (response.success && response.data) {
          setAvailableMonths(response.data);
          if (response.data.length > 0) {
            // Set the latest month as default
            setReportMonth(response.data[0]);
          } else {
            // If no months, set current month as default for generation
            setReportMonth(new Date().toISOString().slice(0, 7));
          }
        } else {
          showAlert(
            response.message || "Gagal memuat daftar bulan laporan.",
            "error"
          );
          setReportMonth(new Date().toISOString().slice(0, 7)); // Fallback to current month
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(
            err.message ||
              "Terjadi kesalahan saat memuat daftar bulan laporan.",
            "error"
          );
          setReportMonth(new Date().toISOString().slice(0, 7)); // Fallback to current month
        }
      }
    };

    if (activeTab === "monthly") {
      fetchAvailableMonths();
    }
  }, [activeTab, handleLogout, showAlert]);

  // Fetch monthly report data when reportMonth changes
  const fetchMonthlyReport = useCallback(async () => {
    if (!reportMonth) return;
    setLoading(true);
    setError(null);
    setReportSummary(null); // Reset summary on new fetch
    try {
      const response = await apiCall(`api/monthly-reports/${reportMonth}`);
      if (response.success && response.data) {
        // Handle cases where data is the array or is in data.items
        const items = Array.isArray(response.data)
          ? response.data
          : response.data.items;
        setMonthlyReportData(items || []);

        // Set summary if it exists
        if (response.summary) {
          setReportSummary(response.summary);
        }
      } else {
        setMonthlyReportData([]);
        showAlert(
          response.message || "Tidak ada data laporan untuk bulan ini.",
          "info"
        );
      }
    } catch (err) {
      if (err.isAuthError) {
        handleLogout();
      } else {
        setError(
          err.message || "Terjadi kesalahan saat memuat laporan bulanan.",
          "error"
        );
        setMonthlyReportData([]);
      }
    } finally {
      setLoading(false);
    }
  }, [reportMonth, handleLogout, showAlert]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [fetchMonthlyReport]);

  const formatCurrency = (num) => {
    if (isNaN(num)) return "Rp 0";
    return "Rp " + num.toLocaleString("id-ID");
  };

  const handleMonthChange = (e) => {
    setReportMonth(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterSparepart(e.target.value);
  };

  const filteredMonthlyData = useMemo(() => {
    if (!monthlyReportData) return [];
    if (!filterSparepart) return monthlyReportData;
    return monthlyReportData.filter(
      (item) =>
        item.itemId?.name &&
        item.itemId.name.toLowerCase().includes(filterSparepart.toLowerCase())
    );
  }, [monthlyReportData, filterSparepart]);

  const exportMonthlyReport = async () => {
    if (monthlyReportData.length === 0) {
      showAlert("Tidak ada data laporan untuk di-export!", "error");
      return;
    }
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const url = `${API_BASE_URL}api/monthly-reports/${reportMonth}/export`;
      const authToken = localStorage.getItem("authToken");
      const headers = {
        Authorization: `Bearer ${authToken}`,
      };

      const response = await fetch(url, { headers });

      if (response.status === 401 || response.status === 403) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        let errorMessage = "Gagal meng-export laporan bulanan.";
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch (_parseError) {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        showAlert(errorMessage, "error");
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `laporan_bulanan_${reportMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl); // Clean up the URL object

      showAlert("Laporan bulanan berhasil di-export!", "success");
    } catch (err) {
      showAlert(
        err.message || "Terjadi kesalahan saat meng-export laporan bulanan.",
        "error"
      );
    }
  };

  const handleDeleteReport = async () => {
    if (!hasPermission("admin")) {
      showAlert("Anda tidak memiliki izin untuk menghapus laporan!", "error");
      return;
    }
    if (!reportMonth) {
      showAlert("Pilih bulan laporan untuk dihapus!", "error");
      return;
    }
    if (
      window.confirm(
        `Yakin ingin menghapus laporan bulanan untuk ${reportMonth}?`
      )
    ) {
      try {
        const response = await apiCall(
          `api/monthly-reports/${reportMonth}`,
          "DELETE"
        );
        if (response.success) {
          showAlert("Laporan berhasil dihapus!", "success");
          // Re-fetch available months and reports
          // This will also reset the selected month if the deleted one was selected
          const fetchAvailableMonths = async () => {
            try {
              const monthsResponse = await apiCall(
                "api/monthly-reports/months"
              );
              if (monthsResponse.success && monthsResponse.data) {
                setAvailableMonths(monthsResponse.data);
                if (monthsResponse.data.length > 0) {
                  setReportMonth(monthsResponse.data[0]);
                } else {
                  setReportMonth(new Date().toISOString().slice(0, 7));
                }
              }
            } catch (err) {
              console.error("Error re-fetching months:", err);
            }
          };
          fetchAvailableMonths();
        } else {
          showAlert(response.message || "Gagal menghapus laporan.", "error");
        }
      } catch (err) {
        if (err.isAuthError) {
          handleLogout();
        } else {
          showAlert(
            err.message || "Terjadi kesalahan saat menghapus laporan.",
            "error"
          );
        }
      }
    }
  };

  const copyToOpname = () => {
    if (!reportMonth) {
      showAlert("Pilih bulan untuk copy ke stock opname!", "error");
      return;
    }
    if (monthlyReportData.length === 0) {
      showAlert(
        "Tidak ada data laporan untuk dicopy ke stock opname!",
        "error"
      );
      return;
    }

    const opnameMonth = reportMonth;
    const opnameItems = monthlyReportData.map((item) => ({
      sku: item.itemId?.sku,
      sparepart: item.itemId?.name,
      jenis: item.itemId?.category,
      merk: item.itemId?.brand,
      stockSistem: item.stockAkhir,
      stockFisik: item.stockAkhir, // Default to system stock
      selisih: 0,
      harga: item.hargaRataRata,
      valueSistem: item.totalValue,
      valueFisik: item.totalValue,
      keterangan: "",
    }));

    setOpnameData((prev) => {
      const existingOpnameIndex = prev.findIndex(
        (o) => o.month === opnameMonth
      );
      if (existingOpnameIndex >= 0) {
        const newOpnameData = [...prev];
        newOpnameData[existingOpnameIndex] = {
          month: opnameMonth,
          data: opnameItems,
        };
        return newOpnameData;
      } else {
        return [...prev, { month: opnameMonth, data: opnameItems }];
      }
    });

    showAlert("Data berhasil dicopy ke stock opname!", "success");
    setActiveTab("stock-opname");
  };

  const tabClassName = `tab-content ${activeTab === "monthly" ? "active" : ""}`;
  return (
    <div id="monthlyTab" className={tabClassName}>
      {alert.message && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: "", type: "" })}
        />
      )}

      {/* Monthly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">
            {reportSummary?.totalStockAkhir || 0}
          </div>
          <div className="text-sm">Total Stock Akhir</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">
            {formatCurrency(reportSummary?.totalValue || 0)}
          </div>
          <div className="text-sm">Total Value</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">
            {reportSummary?.totalMasuk || 0}
          </div>
          <div className="text-sm">Total Masuk Bulan Ini</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-xl text-center shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out">
          <div className="text-3xl font-bold">
            {reportSummary?.totalKeluar || 0}
          </div>
          <div className="text-sm">Total Keluar Bulan Ini</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Laporan Bulanan
        </h2>
        <div className="flex flex-wrap justify-between items-start mb-6 gap-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="mb-4">
              <label
                htmlFor="reportMonth"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Pilih Bulan
              </label>
              <select
                id="reportMonth"
                value={reportMonth}
                onChange={handleMonthChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Tidak ada laporan tersedia</option>
                {availableMonths.length > 0 ? (
                  availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))
                ) : (
                  <option value="">Tidak ada laporan tersedia</option>
                )}
              </select>
            </div>
            <div className="mb-4">
              <label
                htmlFor="filterMonthlySparepart"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Filter Nama Barang
              </label>
              <input
                type="text"
                id="filterMonthlySparepart"
                placeholder="Cari nama barang..."
                value={filterSparepart}
                onChange={handleFilterChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap items-center">
            <button
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={exportMonthlyReport}
            >
              Export Laporan Bulanan
            </button>
            <button
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              onClick={copyToOpname}
            >
              Copy ke Stock Opname
            </button>
            {hasPermission("admin") && (
              <button
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleDeleteReport}
              >
                Hapus Laporan
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-md">
        {loading ? (
          <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
            Memuat laporan...
          </div>
        ) : error ? (
          <div className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center">
            Error: {error}
          </div>
        ) : filteredMonthlyData.length === 0 ? (
          <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
            Tidak ada data laporan untuk bulan ini.
          </div>
        ) : (
          <table
            id="monthlyReportTable"
            className="min-w-full divide-y divide-gray-200"
          >
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-28">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-56">
                  Nama Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-40">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-28">
                  Merk
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">
                  Stock Awal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-36">
                  Harga Awal
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">
                  Barang Masuk
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">
                  Barang Keluar
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-32">
                  Stock Akhir
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-40">
                  Harga Rata - Rata
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-48">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody id="monthlyReportBody">
              {filteredMonthlyData.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-28">
                    {item.itemId?.sku || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-56">
                    {item.itemId?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-40">
                    {item.itemId?.category || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-28">
                    {item.itemId?.brand || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-32 text-right">
                    {item.stockAwal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-36 text-right">
                    {formatCurrency(item.hargaAwal)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-32 text-right">
                    {item.barangMasuk}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-32 text-right">
                    {item.barangKeluar}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-32 text-right">
                    {item.stockAkhir}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-40 text-right">
                    {formatCurrency(item.hargaRataRata)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 overflow-hidden text-ellipsis w-48 text-right">
                    {formatCurrency(item.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MonthlyReports;
