import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

const ExportPDFButton = ({ schedules, filterBy }) => {
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);

    let title = "All Schedules";
    let filteredSchedules = schedules;

    if (filterBy) {
      title = `Schedules by ${filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}`;

      const grouped = {};
      for (const sched of schedules) {
        const key = sched[filterBy] || "Unknown";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(sched);
      }

      filteredSchedules = Object.entries(grouped).flatMap(([group, items]) => [
        { isGroup: true, groupLabel: group },
        ...items,
      ]);
    }

    doc.text(title, 14, 20);

    const headers = [
      [
        "Program",
        "Year Level",
        "Subject",
        "Section",
        "Faculty",
        "Start",
        "End",
        "Duration",
        "Day",
        "Room",
      ],
    ];

    const data = filteredSchedules.map((s) => {
      if (s.isGroup) {
        return [`${filterBy.toUpperCase()}: ${s.groupLabel}`, "", "", "", "", "", "", "", "", ""];
      }

      return [
        s.program || "-",
        s.yearLevel || "-",
        s.subject || "-",
        s.section || "-",
        s.faculty || "-",
        s.startTime || "-",
        s.endTime || "-",
        `${s.duration || 0} mins`,
        s.day || "-",
        s.room || "-",
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: headers,
      body: data,
      didParseCell: function (data) {
        const isGroupRow = data.row.raw[1] === "" && data.row.raw[2] === "";
        if (isGroupRow) {
          data.cell.styles.fontStyle = "bold";
          data.cell.colSpan = 10;
        }
      },
    });

    const filename = `schedule_${filterBy || "all"}_${Date.now()}.pdf`;
    doc.save(filename);

    try {
      await addDoc(collection(db, "exports"), {
        filename,
        filter: filterBy || "all",
        createdAt: serverTimestamp(),
        total: schedules.length,
      });
      alert("PDF exported and logged in Firestore!");
    } catch (error) {
      console.error("Failed to log export:", error);
    }
  };

  return;
};

export default ExportPDFButton;
