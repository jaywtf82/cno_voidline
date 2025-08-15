import React, { useState } from "react";

export const ExportPanelMock = () => {
  const [progress, setProgress] = useState(0);
  const startExport = () => {
    setProgress(1);
    let p = 1;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) clearInterval(interval);
    }, 200);
  };
  return (
    <div>
      <button onClick={startExport}>[TRANSMIT]</button>
      <div style={{ width: `${progress}%`, background: "lime", height: 8, marginTop: 8 }} />
      <div>Status: {progress < 100 ? "Exporting..." : "Complete!"}</div>
    </div>
  );
};