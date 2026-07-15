const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

const doc = new jsPDF();

// Headings
doc.setFont("helvetica", "bold");
doc.setFontSize(22);
doc.setTextColor(0, 102, 204);
doc.text("DIAGNOSTIC LABORATORY REPORT", 20, 30);

doc.setDrawColor(200, 200, 200);
doc.line(20, 35, 190, 35);

// Metadata
doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.setTextColor(50, 50, 50);

doc.text("Patient Name: Dhyey Rathi", 20, 50);
doc.text("Patient ID: CLI000009", 20, 57);
doc.text("Date of Analysis: " + new Date().toLocaleDateString("en-US", { dateStyle: "long" }), 20, 64);
doc.text("Status: Completed", 20, 71);

// Test Details
doc.setFont("helvetica", "bold");
doc.setFontSize(14);
doc.text("Test: Complete Blood Count (CBC)", 20, 85);

doc.setDrawColor(220, 220, 220);
doc.line(20, 89, 190, 89);

// CBC Results Table
doc.setFont("helvetica", "bold");
doc.setFontSize(11);
doc.text("Parameter", 20, 98);
doc.text("Result", 70, 98);
doc.text("Reference Range", 110, 98);
doc.text("Unit", 160, 98);

doc.line(20, 102, 190, 102);

doc.setFont("helvetica", "normal");
let y = 110;
const results = [
  { p: "Hemoglobin", r: "14.5", ref: "13.8 - 17.2", u: "g/dL" },
  { p: "White Blood Cells (WBC)", r: "6.5", ref: "4.5 - 11.0", u: "x10^3/uL" },
  { p: "Red Blood Cells (RBC)", r: "4.8", ref: "4.5 - 5.9", u: "x10^6/uL" },
  { p: "Hematocrit", r: "43.2", ref: "41.0 - 50.0", u: "%" },
  { p: "Platelet Count", r: "250", ref: "150 - 450", u: "x10^3/uL" },
];

results.forEach(item => {
  doc.text(item.p, 20, y);
  doc.text(item.r, 70, y);
  doc.text(item.ref, 110, y);
  doc.text(item.u, 160, y);
  y += 8;
});

doc.line(20, y + 2, 190, y + 2);

// Comments
doc.setFont("helvetica", "bold");
doc.text("Interpretation & Comments:", 20, y + 15);
doc.setFont("helvetica", "normal");
doc.text("All hematological parameters are within normal physiological limits.", 20, y + 23);
doc.text("No abnormal cells detected. Clinically normal profile.", 20, y + 30);

// Signatures
doc.setFont("helvetica", "italic");
doc.setFontSize(10);
doc.setTextColor(120, 120, 120);
doc.text("Electronically signed by Laboratory Manager, Clinic Management System", 20, 260);

const pdfPath = path.join(__dirname, "..", "public", "dummy-cbc-report.pdf");
const buffer = Buffer.from(doc.output("arraybuffer"));
fs.writeFileSync(pdfPath, buffer);
console.log("CBC report generated successfully at: " + pdfPath);
