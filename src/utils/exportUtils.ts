import { Workbook } from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Types ─────────────────────────────────────────
export interface ExportCaseData {
  referenceNo: string;
  title: string;
  petName: string;
  petSpecies: string;
  petBreed: string;
  ownerName: string;
  hospitalName: string;
  serviceName: string;
  status: string;
  vetName: string;
  createdAt: string;
  //   appointments: number;
  //   medicalFiles: number;
}

// ── Status Configuration ──────────────────────────
export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string; border?: string }
> = {
  PENDING: {
    bg: "#FEF3C7",
    text: "#92400E",
    label: "รอดำเนินการ",
    border: "#F59E0B",
  },
  RECEIVED: {
    bg: "#DBEAFE",
    text: "#1E40AF",
    label: "รับเรื่องแล้ว",
    border: "#3B82F6",
  },
  CONFIRMED: {
    bg: "#EDE9FE",
    text: "#5B21B6",
    label: "ยืนยันแล้ว",
    border: "#8B5CF6",
  },
  APPOINTED: {
    bg: "#CFFAFE",
    text: "#155E75",
    label: "นัดหมายแล้ว",
    border: "#06B6D4",
  },
  COMPLETED: {
    bg: "#D1FAE5",
    text: "#065F46",
    label: "เสร็จสิ้น",
    border: "#10B981",
  },
  CANCELLED: {
    bg: "#FEE2E2",
    text: "#991B1B",
    label: "ยกเลิก",
    border: "#EF4444",
  },
};

// ── Helper: Date format ───────────────────────────
function formatDateTH(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Helper: HEX → RGB ─────────────────────────────
function hexToRgbArray(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 200, g: 200, b: 200 };
}

// ─────────────────────────────────────────────────
// XLSX EXPORT
// ─────────────────────────────────────────────────

export async function exportToXLSX(
  data: ExportCaseData[],
  filename = "referral-cases",
): Promise<void> {
  const workbook = new Workbook();

  const worksheet = workbook.addWorksheet("เคสส่งต่อ", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headers = [
    "ลำดับ",
    "เลขที่อ้างอิง",
    "ชื่อเคส",
    "ชื่อสัตว์",
    "ชนิด/พันธุ์",
    "เจ้าของ",
    "โรงพยาบาล",
    "บริการ",
    "สถานะ",
    "สัตวแพทย์",
    "วันที่สร้าง",
    "นัดหมาย",
    "ไฟล์",
  ];

  const headerRow = worksheet.addRow(headers);

  headerRow.font = {
    bold: true,
    color: { argb: "FFFFFFFF" },
  };

  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };

  headerRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  headerRow.height = 25;

  worksheet.columns = [
    { key: "no", width: 6 },
    { key: "referenceNo", width: 22 },
    { key: "title", width: 25 },
    { key: "petName", width: 15 },
    { key: "species", width: 20 },
    { key: "owner", width: 25 },
    { key: "hospital", width: 30 },
    { key: "service", width: 25 },
    { key: "status", width: 18 },
    { key: "vet", width: 20 },
    { key: "date", width: 15 },
    // { key: "appointments", width: 10 },
    // { key: "files", width: 10 },
  ];

  data.forEach((item, idx) => {
    const row = worksheet.addRow({
      no: idx + 1,
      referenceNo: item.referenceNo,
      title: item.title,
      petName: item.petName,
      species: `${item.petSpecies} (${item.petBreed})`,
      owner: item.ownerName,
      hospital: item.hospitalName,
      service: item.serviceName,
      status: STATUS_COLORS[item.status]?.label || item.status,
      vet: item.vetName,
      date: formatDateTH(item.createdAt),
      //   appointments: item.appointments,
      //   files: item.medicalFiles,
    });

    const statusCell = row.getCell(9);
    const colorConfig = STATUS_COLORS[item.status];

    if (colorConfig) {
      const bg = colorConfig.bg.replace("#", "").toUpperCase();
      const text = colorConfig.text.replace("#", "").toUpperCase();
      const border = colorConfig.border?.replace("#", "").toUpperCase() || bg;

      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: `FF${bg}` },
      };

      statusCell.font = {
        bold: true,
        color: { argb: `FF${text}` },
      };

      statusCell.border = {
        top: { style: "thin", color: { argb: `FF${border}` } },
        left: { style: "thin", color: { argb: `FF${border}` } },
        bottom: { style: "thin", color: { argb: `FF${border}` } },
        right: { style: "thin", color: { argb: `FF${border}` } },
      };

      statusCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
    }

    if (idx % 2 === 0) {
      row.eachCell((cell) => {
        if ((cell as any).col !== 9) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }
      });
    }

    row.alignment = {
      vertical: "middle",
      wrapText: true,
    };
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`;

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 100);
}

// ─────────────────────────────────────────────────
// PDF EXPORT
// ─────────────────────────────────────────────────

export function exportToPDF(
  data: ExportCaseData[],
  filename = "referral-cases",
): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(18);
  doc.text("รายงานเคสส่งต่อผู้ป่วยสัตว์", 14, 20);

  doc.setFontSize(10);
  doc.text(`รวมทั้งหมด: ${data.length} เคส`, 14, 28);

  const tableData = data.map((item, idx) => [
    idx + 1,
    item.referenceNo,
    item.title,
    item.petName,
    `${item.petSpecies} ${item.petBreed}`,
    item.ownerName,
    item.hospitalName,
    item.serviceName,
    STATUS_COLORS[item.status]?.label || item.status,
    formatDateTH(item.createdAt),
    // `${item.appointments}/${item.medicalFiles}`,
  ]);

  autoTable(doc, {
    startY: 35,
    head: [
      [
        "#",
        "Ref",
        "เคส",
        "สัตว์",
        "พันธุ์",
        "เจ้าของ",
        "โรงพยาบาล",
        "บริการ",
        "สถานะ",
        "วันที่",
        "นัด/ไฟล์",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: "bold",
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body" && dataCell.column.index === 8) {
        const status = dataCell.cell.text[0];

        const key = Object.keys(STATUS_COLORS).find(
          (k) => STATUS_COLORS[k].label === status,
        );

        if (key) {
          const { r, g, b } = hexToRgbArray(STATUS_COLORS[key].bg);
          dataCell.cell.styles.fillColor = [r, g, b];
        }
      }
    },
  });

  const pageCount = (doc as any).getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(8);

    doc.text(
      `หน้า ${i} จาก ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: "center" },
    );
  }

  doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─────────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────────

export function exportToCSV(
  data: ExportCaseData[],
  filename = "referral-cases",
): void {
  const headers = [
    "ลำดับ",
    "เลขที่อ้างอิง",
    "ชื่อเคส",
    "ชื่อสัตว์",
    "ชนิด/พันธุ์",
    "เจ้าของ",
    "โรงพยาบาล",
    "บริการ",
    "สถานะ",
    "สัตวแพทย์",
    "วันที่สร้าง",
    "นัดหมาย",
    "ไฟล์",
  ];

  const rows = data.map((item, idx) => [
    idx + 1,
    item.referenceNo,
    item.title,
    item.petName,
    `${item.petSpecies} (${item.petBreed})`,
    item.ownerName,
    item.hospitalName,
    item.serviceName,
    STATUS_COLORS[item.status]?.label || item.status,
    item.vetName,
    formatDateTH(item.createdAt),
    // item.appointments,
    // item.medicalFiles,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row
        .map(
          (cell) => `"${String(cell).replace(/"/g, '""').replace(/\n/g, " ")}"`,
        )
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 100);
}
