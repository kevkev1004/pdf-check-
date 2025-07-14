import { useState } from "react";

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".pdf")) return;
    setPdfFile(file);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result);
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

      let hasText = false;
      let hasOCGs = false;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        if (content.items.length > 0) hasText = true;
        if (page.ref?.num || page.structTreeRoot) hasOCGs = true;
      }

      const result = {
        status: hasText && hasOCGs ? "Good" : "Bad",
        reasons: [],
      };
      if (hasText) result.reasons.push("Text elements detected");
      else result.reasons.push("No true text objects found");
      if (hasOCGs) result.reasons.push("Likely structured layers present");
      else result.reasons.push("No organized layer structure detected");

      setAnalysis(result);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Vector PDF Quality Checker</h1>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={{ marginTop: 20, marginBottom: 20 }}
      />
      {analysis && (
        <div style={{
          background: "#fff",
          borderRadius: 8,
          padding: 20,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }}>
          <h2>
            Result: <span style={{ color: analysis.status === "Good" ? "green" : "red" }}>
              {analysis.status}
            </span>
          </h2>
          <ul>
            {analysis.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
