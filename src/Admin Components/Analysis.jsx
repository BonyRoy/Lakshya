import { CircleChevronLeft, Download, Trash2 } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useNavigate } from "react-router-dom";
import { lectureProgressService } from "../firebase/dbService.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

const Analysis = () => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isMobile, setIsMobile] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    total: 1024,
    percentage: 0,
  }); // MB
  const [showSelectiveMode, setShowSelectiveMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState(new Set());
  const [showSelectiveDeleteModal, setShowSelectiveDeleteModal] =
    useState(false);
  const navigate = useNavigate();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load data from Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const progressData = await lectureProgressService.getAll();
        console.log("Loaded progress data:", progressData);
        console.log("Sample record structure:", progressData[0]);

        // Transform Firebase data to match expected format
        const transformedData = progressData.map((item, index) => {
          console.log(`Transforming item ${index}:`, {
            id: item.id,
            UUID: item.UUID,
          });
          // Get unique faculties involved in this chapter-branch combination
          const facultiesInvolved = [
            ...new Set(
              (item.PROGRESS || []).map(
                (p) => p["Faculty name"] || p.facultyName
              )
            ),
          ].join(", ");

          // Calculate the ACTUAL current state of this chapter-branch combination
          const lectureTypesArray = (() => {
            if (!item.PROGRESS || item.PROGRESS.length === 0)
              return ["REGULAR"];

            const types = [];

            // Check if ANY lecture is overshoot (if so, the whole thing is overshoot status)
            const hasOvershoot = item.PROGRESS.some(
              (progress) =>
                progress.lectureTypes &&
                (Array.isArray(progress.lectureTypes)
                  ? progress.lectureTypes.includes("OVERSHOOT")
                  : progress.lectureTypes === "OVERSHOOT")
            );

            // Check if ANY lecture involves substitute teaching
            const hasSubstitute = item.PROGRESS.some(
              (progress) =>
                progress.lectureTypes &&
                (Array.isArray(progress.lectureTypes)
                  ? progress.lectureTypes.includes("SUBSTITUTE")
                  : progress.lectureTypes === "SUBSTITUTE")
            );

            // Apply common sense logic:
            if (hasOvershoot) {
              types.push("OVERSHOOT"); // If any lecture is overshoot, the chapter is in overshoot status
            } else {
              types.push("REGULAR"); // Otherwise it's regular
            }

            // Substitute can be combined with either regular or overshoot
            if (hasSubstitute) {
              types.push("SUBSTITUTE");
            }

            return types;
          })();

          const transformedItem = {
            "Faculty name": item["Faculty name"] || item.facultyName, // This will now be "Chapter - Branch"
            "Faculty code": facultiesInvolved || "N/A", // Show all faculties involved
            SUBJECT: item.SUBJECT || item.subject || "N/A",
            "BRANCH NAME": item["BRANCH NAME"] || item.branchName,
            CHAPTERNAME: item.CHAPTERNAME || item.chapterName,
            LECTURENUMBER: item.LECTURENUMBER || "0",
            PROGRESS: item.PROGRESS || [],
            LECTURETYPE: lectureTypesArray, // Use calculated types from progress entries
            OVERSHOOTREMARK: item.OVERSHOOTREMARK || item.overshootRemark || "",
            UUID: item.UUID || item.id,
            id: item.id, // Preserve the actual Firestore document ID for deletion
            "TOTALNOOF LECTURES":
              item["TOTALNOOF LECTURES"] || item.totalLectures || "0",
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };

          console.log(
            `Transformed item ${index} - UUID: ${transformedItem.UUID}, id: ${transformedItem.id}`
          );
          return transformedItem;
        });

        console.log("Transformed data sample:", transformedData[0]);
        setData(transformedData);

        // Calculate and update storage usage
        const usage = calculateStorageUsage(transformedData);
        setStorageInfo(usage);

        if (transformedData.length === 0) {
          toast.info(
            "No lecture progress data found. Faculty members need to submit some lectures first."
          );
        }
      } catch (err) {
        console.error("Error loading analysis data:", err);
        setError("Failed to load analysis data. Please try again.");
        toast.error("Failed to load data from database.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Excel export function
  const exportToExcel = () => {
    try {
      if (data.length === 0) {
        toast.warn("No data to export!");
        return;
      }

      // Prepare data for Excel export
      const exportData = data
        .map((item) => {
          // Flatten the progress entries
          const progressEntries = item.PROGRESS.map((progress, index) => ({
            "Chapter-Branch": item["Faculty name"],
            "Faculties Involved": item["Faculty code"],
            Subject: item.SUBJECT,
            Branch: item["BRANCH NAME"],
            Chapter: item.CHAPTERNAME,
            "Faculty for This Entry":
              progress["Faculty name"] || progress.facultyName || "Unknown",
            "Progress Entry": index + 1,
            "Total Progress Entries": item.PROGRESS.length,
            "Current Lecture Number": item.LECTURENUMBER,
            "Total Required Lectures": item["TOTALNOOF LECTURES"],
            "Lecture Types": item.LECTURETYPE.join(", "),
            "Content Taught": progress.CONTENTTAUGHT || "",
            Date: progress.DATE
              ? new Date(progress.DATE).toLocaleDateString()
              : "",
            "Overshoot Remark": item.OVERSHOOTREMARK || "",
            "Substitute Remark": progress.substituteRemark || "",
            "Created At": item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : "",
            "Updated At": item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString()
              : "",
          }));

          return progressEntries;
        })
        .flat();

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Auto-width columns
      const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Lecture Progress");

      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().split("T")[0];
      const filename = `lecture_progress_${timestamp}.xlsx`;

      XLSX.writeFile(wb, filename);
      toast.success(`Excel file "${filename}" downloaded successfully!`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  // Calculate Firebase storage usage (more realistic estimation)
  const calculateStorageUsage = (dataArray) => {
    if (dataArray.length === 0) {
      return { used: 0, total: 1024, percentage: 0 };
    }

    let totalSize = 0;

    dataArray.forEach((item) => {
      // More realistic Firestore document size calculation:
      // - Base document overhead: ~1KB per document
      // - Field names and metadata overhead
      // - Actual content size

      let docSize = 1024; // Base 1KB per document (Firestore overhead)

      // Calculate actual content size
      if (item.PROGRESS && Array.isArray(item.PROGRESS)) {
        item.PROGRESS.forEach((progress) => {
          // Each progress entry: ~0.5-1KB depending on content length
          const contentLength = (progress.CONTENTTAUGHT || "").length;
          const remarkLength =
            (progress.overshootRemark || "").length +
            (progress.substituteRemark || "").length;
          docSize += Math.max(512, (contentLength + remarkLength) * 2); // Minimum 0.5KB per entry
        });
      }

      // Add other fields (faculty names, metadata, etc.)
      const otherFieldsSize = JSON.stringify({
        facultyName: item["Faculty name"],
        subject: item.SUBJECT,
        branch: item["BRANCH NAME"],
        chapter: item.CHAPTERNAME,
        metadata: "etc",
      }).length;

      docSize += otherFieldsSize;
      totalSize += docSize;
    });

    totalSize = totalSize / (1024 * 1024); // Convert to MB

    // Firebase Firestore free tier: 1GB = 1024 MB
    const totalLimit = 1024; // MB
    const percentage = Math.min((totalSize / totalLimit) * 100, 100);

    return {
      used: Math.max(0.01, Math.round(totalSize * 1000) / 1000), // Show at least 0.01MB, round to 3 decimals
      total: totalLimit,
      percentage: Math.max(0.01, Math.round(percentage * 100) / 100), // Show at least 0.01%
    };
  };

  // Handle checkbox selection
  const handleSelectRecord = (uuid, checked) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(uuid);
    } else {
      newSelected.delete(uuid);
    }
    setSelectedRecords(newSelected);
  };

  // Handle select all checkbox
  const handleSelectAll = (checked) => {
    if (checked) {
      const allUUIDs = filteredAndSortedData.map((item) => item.UUID);
      setSelectedRecords(new Set(allUUIDs));
    } else {
      setSelectedRecords(new Set());
    }
  };

  // Selective delete function
  const handleSelectiveDelete = async () => {
    try {
      setLoading(true);

      // Get selected records and delete them
      const selectedUUIDs = Array.from(selectedRecords);
      console.log("Selected UUIDs for deletion:", selectedUUIDs);
      console.log("Current data array length:", data.length);

      const deletePromises = selectedUUIDs.map((uuid) => {
        const record = data.find((item) => item.UUID === uuid);
        console.log(`Looking for UUID ${uuid}:`, record);

        if (!record) {
          throw new Error(`Record with UUID ${uuid} not found in local data`);
        }
        if (!record.id) {
          console.log("Record missing ID:", record);
          throw new Error(
            `Record with UUID ${uuid} is missing Firestore document ID. Available keys: ${Object.keys(
              record
            ).join(", ")}`
          );
        }

        console.log(`Deleting record: UUID=${uuid}, FirestoreID=${record.id}`);
        // Use the actual Firestore document ID for deletion
        return lectureProgressService.delete(record.id);
      });

      await Promise.all(deletePromises);

      // Update local data
      const remainingData = data.filter(
        (item) => !selectedRecords.has(item.UUID)
      );
      setData(remainingData);

      // Recalculate storage after deletion
      const updatedUsage = calculateStorageUsage(remainingData);
      setStorageInfo(updatedUsage);

      // Clear selections and close modal
      setSelectedRecords(new Set());
      setShowSelectiveMode(false);
      setShowSelectiveDeleteModal(false);

      toast.success(
        `Successfully deleted ${selectedUUIDs.length} selected records!`
      );
    } catch (error) {
      console.error("Error deleting selected records:", error);
      toast.error("Failed to delete selected records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to get badge style based on lecture type
  const getBadgeStyle = (type) => {
    switch (type) {
      case "REGULAR":
        return {
          backgroundColor: "#4caf50", // green
          color: "white",
        };
      case "SUBSTITUTE":
        return {
          backgroundColor: "#ff9800", // yellow/orange
          color: "white",
        };
      case "OVERSHOOT":
        return {
          backgroundColor: "#f44336", // red
          color: "white",
        };
      default:
        return {
          backgroundColor: "#666",
          color: "white",
        };
    }
  };

  // Get unique lecture types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set();
    data.forEach((item) => {
      item.LECTURETYPE.forEach((type) => types.add(type));
    });
    return Array.from(types).sort();
  }, [data]);

  // Helper function to get latest date from progress
  const getLatestDate = (item) => {
    if (!item.PROGRESS || item.PROGRESS.length === 0)
      return new Date("1900-01-01");
    const dates = item.PROGRESS.map((p) => new Date(p.DATE));
    return new Date(Math.max(...dates));
  };

  // Filter and sort data using useMemo for performance
  const filteredAndSortedData = useMemo(() => {
    return data
      .filter((item) => {
        // Search filter - make it more robust
        const searchLower = searchTerm.toLowerCase().trim();
        if (searchLower === "") return true;

        const searchFields = [
          item["Faculty name"],
          item["Faculty code"],
          item.SUBJECT,
          item["BRANCH NAME"],
          item.CHAPTERNAME,
        ];

        return searchFields.some(
          (field) => field && field.toLowerCase().includes(searchLower)
        );
      })
      .filter((item) => {
        // Type filter
        if (filterType === "ALL") return true;
        return item.LECTURETYPE.includes(filterType);
      })
      .sort((a, b) => {
        const dateA = getLatestDate(a);
        const dateB = getLatestDate(b);

        if (sortOrder === "newest") {
          return dateB.getTime() - dateA.getTime();
        } else {
          return dateA.getTime() - dateB.getTime();
        }
      });
  }, [searchTerm, filterType, sortOrder, data]);

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Spinning animation for loading */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Responsive breakpoints */
        @media (max-width: 1200px) {
          .main-grid {
            grid-template-columns: 2fr 1fr !important;
          }
        }
        
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
          }
          .controls-grid {
            grid-template-columns: 1fr !important;
            gap: 15px !important;
          }
          .header-padding {
            padding: 15px 20px !important;
          }
          .content-padding {
            padding: 15px !important;
          }
        }
        
        @media (max-width: 480px) {
          .header-padding {
            padding: 10px 15px !important;
          }
          .content-padding {
            padding: 10px !important;
          }
        }
        
        /* Mobile card styles */
        .mobile-card {
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        }
        
        .mobile-card.selected {
          background: #e3f2fd;
          border: 2px solid #2196f3;
          box-shadow: 0 4px 8px rgba(33, 150, 243, 0.2);
        }
        
        .mobile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .mobile-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
        }
        
        .mobile-card-subtitle {
          font-size: 14px;
          color: #666;
          margin: 0;
        }
        
        .mobile-card-progress {
          width: 50px;
          height: 50px;
          flex-shrink: 0;
        }
        
        .mobile-card-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .mobile-card-detail {
          display: flex;
          flex-direction: column;
        }
        
        .mobile-card-detail-label {
          font-size: 11px;
          color: #888;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .mobile-card-detail-value {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        
        .mobile-timeline-item {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: flex-start;
        }
        
        .mobile-timeline-dot {
          width: 12px;
          height: 12px;
          background: #666;
          border-radius: 50%;
          margin-top: 4px;
          flex-shrink: 0;
          position: relative;
        }
        
        .mobile-timeline-dot.end {
          width: 16px;
          height: 16px;
          background: #333;
        }
        
        .mobile-timeline-dot::after {
          content: '';
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 24px;
          background: #ddd;
        }
        
        .mobile-timeline-dot.last::after {
          display: none;
        }
        
        .mobile-timeline-content {
          flex: 1;
          padding-top: 2px;
        }
        
        .mobile-timeline-title {
          font-size: 15px;
          font-weight: 600;
          color: #333;
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        
        .mobile-timeline-subtitle {
          font-size: 13px;
          color: #666;
          margin: 0;
          line-height: 1.2;
        }
      `}</style>

      <div
        className="header-padding"
        style={{
          padding: "20px 40px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ minWidth: "250px" }}>
          <h1
            style={{
              fontSize: "clamp(18px, 4vw, 20px)",
              fontWeight: "bold",
              color: "#111827",
              margin: "0 0 4px 0",
            }}
          >
            Admin Data Analysis
          </h1>
          <p
            style={{
              color: "#6b7280",
              margin: 0,
              fontSize: "clamp(12px, 2.5vw, 14px)",
            }}
          >
            Analyse records base on data submited by faculties after completion
            of each lecture
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "10px",
            gap: "8px",
            cursor: "pointer",
            minWidth: "fit-content",
          }}
          onClick={() => {
            navigate("/admin");
          }}
        >
          <CircleChevronLeft />
          <p style={{ margin: 0 }}>Back</p>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="content-padding" style={{ padding: "20px 20px 0 20px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: "15px",
            marginBottom: "20px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Excel Export Button */}
          <button
            onClick={exportToExcel}
            disabled={loading || data.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              backgroundColor: data.length === 0 ? "#d1d5db" : "#10b981",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: data.length === 0 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              boxShadow:
                data.length === 0
                  ? "none"
                  : "0 2px 4px rgba(16, 185, 129, 0.3)",
            }}
          >
            <Download size={18} />
            Export Excel
          </button>

          {/* Selective Delete Button */}
          <button
            onClick={() => {
              const newMode = !showSelectiveMode;
              setShowSelectiveMode(newMode);
              if (!newMode) {
                // Clear selections when exiting selective mode
                setSelectedRecords(new Set());
              }
            }}
            disabled={loading || data.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px 16px",
              backgroundColor:
                data.length === 0
                  ? "#d1d5db"
                  : showSelectiveMode
                  ? "#f59e0b"
                  : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: data.length === 0 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              boxShadow:
                data.length === 0
                  ? "none"
                  : showSelectiveMode
                  ? "0 2px 4px rgba(245, 158, 11, 0.3)"
                  : "0 2px 4px rgba(59, 130, 246, 0.3)",
            }}
          >
            <input
              type="checkbox"
              checked={showSelectiveMode}
              readOnly
              style={{
                width: "16px",
                height: "16px",
                margin: 0,
              }}
            />
            {showSelectiveMode
              ? "Cancel Selection"
              : "Select Records to Delete"}
          </button>

          {/* Firebase Storage Usage */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              backgroundColor: "#f8fafc",
              border: `2px solid ${
                storageInfo.percentage > 80
                  ? "#ef4444"
                  : storageInfo.percentage > 60
                  ? "#f59e0b"
                  : "#10b981"
              }`,
              borderRadius: "8px",
              minWidth: "200px",
            }}
          >
            {/* Circular Progress */}
            <div
              style={{
                position: "relative",
                width: "36px",
                height: "36px",
              }}
            >
              <svg
                width="36"
                height="36"
                style={{ transform: "rotate(-90deg)" }}
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  stroke={
                    storageInfo.percentage > 80
                      ? "#ef4444"
                      : storageInfo.percentage > 60
                      ? "#f59e0b"
                      : "#10b981"
                  }
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 16 * (1 - storageInfo.percentage / 100)
                  }`}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "10px",
                  fontWeight: "600",
                  color:
                    storageInfo.percentage > 80
                      ? "#ef4444"
                      : storageInfo.percentage > 60
                      ? "#f59e0b"
                      : "#10b981",
                }}
              >
                {storageInfo.percentage}%
              </div>
            </div>

            {/* Storage Info */}
            <div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                }}
              >
                Firebase Storage
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280" }}>
                {storageInfo.used} MB / {storageInfo.total} MB
              </div>
            </div>
          </div>
        </div>

        {/* Selected Records Actions */}
        {showSelectiveMode && selectedRecords.size > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <span
              style={{ color: "#92400e", fontSize: "14px", fontWeight: "500" }}
            >
              {selectedRecords.size} record(s) selected
            </span>
            <button
              onClick={() => setShowSelectiveDeleteModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      <div className="content-padding" style={{ padding: "20px" }}>
        {/* Search and Filter Controls */}
        <div
          className="controls-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "15px",
            marginBottom: "25px",
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Search Field */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              Search
            </label>
            <input
              type="text"
              placeholder="Search by chapter-branch, faculties, subject, branch, or chapter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "clamp(12px, 2.5vw, 14px)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Filter by Type */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "clamp(12px, 2.5vw, 14px)",
                backgroundColor: "white",
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              <option value="ALL">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Sort by Date */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              Sort by Date
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "clamp(12px, 2.5vw, 14px)",
                backgroundColor: "white",
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div
          style={{
            marginBottom: "15px",
            color: "#666",
            fontSize: "clamp(12px, 2.5vw, 14px)",
          }}
        >
          Showing {filteredAndSortedData.length} of {data.length} results
          {searchTerm && ` for "${searchTerm}"`}
          {filterType !== "ALL" && ` (${filterType} only)`}
        </div>

        <div
          className="main-grid"
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "3fr 1fr",
            gap: "20px",
          }}
        >
          {/* Faculty Data Card */}
          <div
            style={{
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
              borderRadius: "10px",
              height: "clamp(400px, 60vh, 500px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Fixed Header */}
            <div style={{ padding: "20px 20px 0 20px", flexShrink: 0 }}>
              <h3
                style={{
                  marginBottom: "20px",
                  color: "#333",
                  fontSize: "clamp(16px, 3vw, 18px)",
                }}
              >
                Faculty Data
              </h3>

              {/* Desktop Header Row */}
              {!isMobile && (
                <div
                  className="data-table-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: showSelectiveMode
                      ? "40px repeat(7, 1fr)"
                      : "repeat(7, 1fr)",
                    gap: "10px",
                    padding: "15px",
                    marginBottom: "15px",
                    backgroundColor: "#2196f3",
                    color: "white",
                    borderRadius: "8px",
                    fontWeight: "600",
                    alignItems: "center",
                  }}
                >
                  {showSelectiveMode && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedRecords.size ===
                            filteredAndSortedData.length &&
                          filteredAndSortedData.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        style={{
                          width: "16px",
                          height: "16px",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  )}
                  <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                    Chapter - Branch
                  </div>
                  <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                    Faculties
                  </div>
                  <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                    Subject
                  </div>
                  <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                    Branch
                  </div>
                  <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                    Chapter
                  </div>
                  <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>Type</div>
                  <div
                    style={{
                      fontSize: "clamp(10px, 2vw, 14px)",
                      textAlign: "center",
                    }}
                  >
                    Progress
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div
              className="data-table-container custom-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "0 20px 20px 20px",
              }}
            >
              {loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#666",
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                    fontStyle: "italic",
                  }}
                >
                  Loading data...
                </div>
              ) : error ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#f44336",
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                  }}
                >
                  {error}
                </div>
              ) : filteredAndSortedData.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#666",
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                    fontStyle: "italic",
                  }}
                >
                  {searchTerm || filterType !== "ALL"
                    ? "No data found matching your filters"
                    : "No data found"}
                </div>
              ) : isMobile ? (
                // Mobile Card Layout
                filteredAndSortedData.map((item) => {
                  const currentLecture = parseInt(item.LECTURENUMBER);
                  const totalLectures = parseInt(item["TOTALNOOF LECTURES"]);
                  const progressPercentage = Math.round(
                    (currentLecture / totalLectures) * 100
                  );

                  return (
                    <div
                      key={item.UUID}
                      className={`mobile-card ${
                        selectedRow?.UUID === item.UUID ? "selected" : ""
                      }`}
                      onClick={() => setSelectedRow(item)}
                    >
                      {/* Card Header with Name and Progress */}
                      <div className="mobile-card-header">
                        <div>
                          <h4 className="mobile-card-title">
                            {item["Faculty name"]}
                          </h4>
                          <p className="mobile-card-subtitle">
                            {item.SUBJECT} | Faculties: {item["Faculty code"]}
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {showSelectiveMode && (
                            <input
                              type="checkbox"
                              checked={selectedRecords.has(item.UUID)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectRecord(item.UUID, e.target.checked);
                              }}
                              style={{
                                width: "18px",
                                height: "18px",
                                cursor: "pointer",
                              }}
                            />
                          )}
                          <div className="mobile-card-progress">
                            <CircularProgressbar
                              value={Math.min(progressPercentage, 100)}
                              text={`${currentLecture}/${totalLectures}`}
                              styles={buildStyles({
                                textSize: "20px",
                                pathColor:
                                  progressPercentage > 100
                                    ? "#f44336"
                                    : progressPercentage === 100
                                    ? "#4caf50"
                                    : "#2196f3",
                                textColor: "#333",
                                trailColor: "#e0e0e0",
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="mobile-card-details">
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">
                            Branch
                          </span>
                          <span className="mobile-card-detail-value">
                            {item["BRANCH NAME"]}
                          </span>
                        </div>
                        <div className="mobile-card-detail">
                          <span className="mobile-card-detail-label">
                            Chapter
                          </span>
                          <span className="mobile-card-detail-value">
                            {item.CHAPTERNAME}
                          </span>
                        </div>
                      </div>

                      {/* Lecture Types */}
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {item.LECTURETYPE.map((type, typeIndex) => (
                          <span
                            key={typeIndex}
                            style={{
                              fontSize: "10px",
                              fontWeight: "600",
                              borderRadius: "12px",
                              padding: "4px 8px",
                              ...getBadgeStyle(type),
                            }}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                // Desktop Grid Layout
                filteredAndSortedData.map((item) => {
                  const currentLecture = parseInt(item.LECTURENUMBER);
                  const totalLectures = parseInt(item["TOTALNOOF LECTURES"]);
                  const progressPercentage = Math.round(
                    (currentLecture / totalLectures) * 100
                  );

                  return (
                    <div
                      key={item.UUID}
                      onClick={() => setSelectedRow(item)}
                      className="data-row-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: showSelectiveMode
                          ? "40px repeat(7, 1fr)"
                          : "repeat(7, 1fr)",
                        gap: "10px",
                        padding: "15px",
                        marginBottom: "10px",
                        backgroundColor:
                          selectedRow?.UUID === item.UUID
                            ? "#e3f2fd"
                            : "#f8f9fa",
                        border:
                          selectedRow?.UUID === item.UUID
                            ? "2px solid #2196f3"
                            : "1px solid #ddd",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        alignItems: "center",
                      }}
                    >
                      {showSelectiveMode && (
                        <div
                          style={{ display: "flex", justifyContent: "center" }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRecords.has(item.UUID)}
                            onChange={(e) =>
                              handleSelectRecord(item.UUID, e.target.checked)
                            }
                            style={{
                              width: "16px",
                              height: "16px",
                              cursor: "pointer",
                            }}
                          />
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "clamp(10px, 2vw, 14px)",
                          fontWeight: "500",
                        }}
                      >
                        {item["Faculty name"]}
                      </div>
                      <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                        {item["Faculty code"]}
                      </div>
                      <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                        {item.SUBJECT}
                      </div>
                      <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                        {item["BRANCH NAME"]}
                      </div>
                      <div style={{ fontSize: "clamp(10px, 2vw, 14px)" }}>
                        {item.CHAPTERNAME}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "4px",
                        }}
                      >
                        {item.LECTURETYPE.map((type, typeIndex) => (
                          <span
                            key={typeIndex}
                            style={{
                              fontSize: "clamp(8px, 1.5vw, 11px)",
                              fontWeight: "600",
                              borderRadius: "12px",
                              padding: "4px 8px",
                              ...getBadgeStyle(type),
                            }}
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "clamp(40px, 8vw, 60px)",
                        }}
                      >
                        <div
                          style={{
                            width: "clamp(30px, 6vw, 50px)",
                            height: "clamp(30px, 6vw, 50px)",
                          }}
                        >
                          <CircularProgressbar
                            value={Math.min(progressPercentage, 100)}
                            text={`${currentLecture}/${totalLectures}`}
                            styles={buildStyles({
                              textSize: "clamp(20px, 4vw, 30px)",
                              pathColor:
                                progressPercentage > 100
                                  ? "#f44336"
                                  : progressPercentage === 100
                                  ? "#4caf50"
                                  : "#2196f3",
                              textColor: "#333",
                              trailColor: "#e0e0e0",
                              backgroundColor: "#f8f9fa",
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Progress Timeline Card */}
          <div
            style={{
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
              borderRadius: "10px",
              height: "clamp(400px, 60vh, 500px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Fixed Header */}
            <div style={{ padding: "20px 20px 0 20px", flexShrink: 0 }}>
              <h3
                style={{
                  marginBottom: "20px",
                  color: "#333",
                  fontSize: "clamp(16px, 3vw, 18px)",
                }}
              >
                Progress Timeline
              </h3>
            </div>

            {/* Scrollable Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "0 20px 20px 20px",
              }}
              className="custom-scrollbar"
            >
              {selectedRow ? (
                <div style={{ position: "relative" }}>
                  {/* Faculty Info Header */}
                  <div
                    style={{
                      marginBottom: isMobile ? "20px" : "30px",
                      padding: "15px",
                      backgroundColor: "#f0f8ff",
                      borderRadius: "8px",
                      borderLeft: "4px solid #2196f3",
                    }}
                  >
                    <h4
                      style={{
                        margin: "0 0 10px 0",
                        color: "#1976d2",
                        fontSize: "clamp(14px, 2.5vw, 16px)",
                      }}
                    >
                      {selectedRow["Faculty name"]} ({selectedRow.SUBJECT})
                    </h4>
                    <p
                      style={{
                        margin: "5px 0",
                        fontSize: "clamp(12px, 2vw, 14px)",
                      }}
                    >
                      <strong>Chapter:</strong> {selectedRow.CHAPTERNAME}
                    </p>
                    <p
                      style={{
                        margin: "5px 0",
                        fontSize: "clamp(12px, 2vw, 14px)",
                      }}
                    >
                      <strong>Branch:</strong> {selectedRow["BRANCH NAME"]}
                    </p>
                  </div>

                  {/* Timeline */}
                  {isMobile ? (
                    // Mobile Timeline Layout
                    <div>
                      {[
                        {
                          type: "start",
                          title: "Chapter Started",
                          subtitle: selectedRow.CHAPTERNAME,
                          isLast: false,
                        },
                        ...selectedRow.PROGRESS.map((progress, idx) => ({
                          type: "progress",
                          title: progress.CONTENTTAUGHT,
                          subtitle: (() => {
                            let subtitle = `${
                              progress["Faculty name"] ||
                              progress.facultyName ||
                              "Unknown"
                            } • ${new Date(progress.DATE).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}`;

                            // Add overshoot remark directly to this lecture entry
                            if (
                              progress.overshootRemark &&
                              progress.overshootRemark.trim()
                            ) {
                              subtitle += ` 🔴 OVERSHOOT: ${progress.overshootRemark.trim()}`;
                            }

                            // Add substitute remark directly to this lecture entry
                            if (
                              progress.substituteRemark &&
                              progress.substituteRemark.trim()
                            ) {
                              subtitle += ` 🟡 SUBSTITUTE: ${progress.substituteRemark.trim()}`;
                            }

                            return subtitle;
                          })(),
                          isLast: idx === selectedRow.PROGRESS.length - 1,
                        })),
                      ].map((item, index, array) => (
                        <div key={index} className="mobile-timeline-item">
                          <div
                            className={`mobile-timeline-dot ${
                              item.type === "end" ? "end" : ""
                            } ${index === array.length - 1 ? "last" : ""}`}
                          />
                          <div className="mobile-timeline-content">
                            <h5 className="mobile-timeline-title">
                              {item.title}
                            </h5>
                            <p className="mobile-timeline-subtitle">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Desktop Timeline Layout
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr",
                        gap: "0 16px",
                        position: "relative",
                      }}
                    >
                      {[
                        {
                          type: "start",
                          title: "Chapter Started",
                          subtitle: selectedRow.CHAPTERNAME,
                          isLast: false,
                        },
                        ...selectedRow.PROGRESS.map((progress, idx) => ({
                          type: "progress",
                          title: progress.CONTENTTAUGHT,
                          subtitle: (() => {
                            let subtitle = `${
                              progress["Faculty name"] ||
                              progress.facultyName ||
                              "Unknown"
                            } • ${new Date(progress.DATE).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}`;

                            // Add overshoot remark directly to this lecture entry
                            if (
                              progress.overshootRemark &&
                              progress.overshootRemark.trim()
                            ) {
                              subtitle += ` 🔴 OVERSHOOT: ${progress.overshootRemark.trim()}`;
                            }

                            // Add substitute remark directly to this lecture entry
                            if (
                              progress.substituteRemark &&
                              progress.substituteRemark.trim()
                            ) {
                              subtitle += ` 🟡 SUBSTITUTE: ${progress.substituteRemark.trim()}`;
                            }

                            return subtitle;
                          })(),
                          isLast: idx === selectedRow.PROGRESS.length - 1,
                        })),
                      ].map((item, index, array) => (
                        <React.Fragment key={index}>
                          {/* Dot Column */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              position: "relative",
                            }}
                          >
                            {/* Connecting Line */}
                            {index < array.length - 1 && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "20px",
                                  bottom: "-8px",
                                  width: "2px",
                                  backgroundColor: "#666",
                                  zIndex: 1,
                                }}
                              />
                            )}

                            {/* Circle */}
                            <div
                              style={{
                                width: item.type === "end" ? "16px" : "12px",
                                height: item.type === "end" ? "16px" : "12px",
                                borderRadius: "50%",
                                backgroundColor:
                                  item.type === "end" ? "#333" : "#666",
                                border: "3px solid white",
                                boxShadow: `0 0 0 2px ${
                                  item.type === "end" ? "#333" : "#666"
                                }`,
                                marginTop: "8px",
                                zIndex: 2,
                                position: "relative",
                              }}
                            />
                          </div>

                          {/* Content Column */}
                          <div
                            style={{
                              paddingBottom:
                                index < array.length - 1 ? "40px" : "0",
                              paddingTop: "8px",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "600",
                                fontSize: "clamp(14px, 2.5vw, 16px)",
                                color: "#333",
                                lineHeight: "1.2",
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                fontSize: "clamp(12px, 2vw, 14px)",
                                color: "#666",
                                marginTop: "4px",
                                lineHeight: "1.2",
                              }}
                            >
                              {item.subtitle}
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#666",
                    marginTop: "50px",
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                  }}
                >
                  {isMobile
                    ? "Tap on any card to view progress timeline"
                    : "Click on any row to view progress timeline"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />

      {/* Selective Delete Confirmation Modal */}
      {showSelectiveDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              width: "90%",
              maxWidth: "480px",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: "#fef2f2",
                padding: "20px",
                textAlign: "center",
                borderBottom: "1px solid #fecaca",
              }}
            >
              <h3
                style={{
                  color: "#dc2626",
                  margin: "0 0 8px 0",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                🗑️ Delete Selected Lecture Data
              </h3>
              <p
                style={{
                  color: "#7f1d1d",
                  fontSize: "14px",
                  margin: "0",
                  lineHeight: "1.4",
                }}
              >
                This will permanently delete the selected lecture progress data
                from the database.
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px" }}>
              <div
                style={{
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    color: "#c2410c",
                    fontSize: "14px",
                  }}
                >
                  ⚠️ Data to be deleted ({selectedRecords.size} records):
                </h4>
                <ul
                  style={{ margin: "0", paddingLeft: "16px", color: "#9a3412" }}
                >
                  {Array.from(selectedRecords).map((uuid) => {
                    const record = data.find((item) => item.UUID === uuid);
                    return (
                      <li
                        key={uuid}
                        style={{ fontSize: "13px", marginBottom: "4px" }}
                      >
                        {record["Faculty name"]} - {record.SUBJECT} (Lecture:{" "}
                        {record.LECTURENUMBER})
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div
                style={{
                  backgroundColor: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    color: "#0369a1",
                    fontSize: "14px",
                  }}
                >
                  💡 Recommendation:
                </h4>
                <p style={{ margin: "0", color: "#075985", fontSize: "13px" }}>
                  Export data to Excel first using the "Export Excel" button to
                  keep a backup before deleting.
                </p>
              </div>

              <p
                style={{
                  margin: "16px 0 0 0",
                  fontSize: "12px",
                  fontStyle: "italic",
                  color: "#dc2626",
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                ⚠️ This action cannot be undone and will free up Firebase
                storage space.
              </p>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                borderTop: "1px solid #e5e7eb",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                backgroundColor: "#f9fafb",
              }}
            >
              <button
                onClick={() => setShowSelectiveDeleteModal(false)}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSelectiveDelete}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid transparent",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Yes, Delete Selected Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Analysis;
