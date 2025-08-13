import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown } from "lucide-react";

const ExportPDFDropdown = ({ schedules }) => {
  const handleExportPDF = async (filterBy = null) => {
    const doc = new jsPDF();
    doc.setFontSize(16);

    const title = filterBy
      ? `Schedules Grouped by ${filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}`
      : "Complete Schedule Report";

    let bodyData = [];

    if (filterBy) {
      const grouped = {};
      schedules.forEach(sched => {
        const key = sched[filterBy] || "Uncategorized";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(sched);
      });

      const sortedGroups = Object.keys(grouped).sort();

      sortedGroups.forEach(group => {
        bodyData.push({
          content: `${filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}: ${group}`,
          styles: { fontStyle: 'bold', fillColor: '#f4f4f4', textColor: '#333' },
          colSpan: 10,
        });
        
        const groupSchedules = grouped[group].map(s => [
          s.program || "-", s.yearLevel || "-", s.subject || "-", s.section || "-",
          s.faculty || "-", s.startTime || "-", s.endTime || "-",
          `${s.duration || 0} mins`, s.day || "-", s.room || "-",
        ]);
        bodyData.push(...groupSchedules);
      });
    } else {
      bodyData = schedules.map(s => [
        s.program || "-", s.yearLevel || "-", s.subject || "-", s.section || "-",
        s.faculty || "-", s.startTime || "-", s.endTime || "-",
        `${s.duration || 0} mins`, s.day || "-", s.room || "-",
      ]);
    }

    doc.text(title, 14, 20);

    const headers = [
      ["Program", "Year Level", "Subject", "Section", "Faculty", "Start", "End", "Duration", "Day", "Room"],
    ];

    autoTable(doc, {
      startY: 30,
      head: headers,
      body: bodyData,
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
      toast.success("PDF Exported", {
        description: `${filename} has been generated and logged.`,
      });
    } catch (error) {
      console.error("Failed to log export:", error);
      toast.error("Logging Failed", {
        description: "The PDF was created but failed to log to the database.",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default">
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem onClick={() => handleExportPDF(null)}>
          All Schedule
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportPDF("room")}>
          By room
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportPDF("faculty")}>
          By faculty
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExportPDF("section")}>
          By section
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportPDFDropdown;