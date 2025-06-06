import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/analyze-resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Upload failed Check console for details.");
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
  try {
    const res = await axios.get("http://127.0.0.1:8000/history/");
    setHistory(res.data.resumes);
  } catch (err) {
    console.error("Failed to fetch history", err);
  }
};


  return (
    <div className="App">
      <h1>AI Resume Analyzer</h1>
      <input type="file" onChange={handleFileChange} accept=".txt" />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      <button onClick={fetchHistory} style={{ marginTop: "20px" }}>
        View Resume History
      </button>

      {history.length > 0 && (
        <div className="result">
          <h3> Past Resume Analyses</h3>
          <ul>
            {history.map((item) => (
              <li key={item._id}>
                <strong>{item.name}</strong> — {item.top_prediction} ({(item.score * 100).toFixed(2)}%)
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <div className="result">
          <h3>Result</h3>
          <p><strong>MongoDB ID:</strong> {result.inserted_id}</p>
          <p><strong>Top Role Match:</strong> {result.top_prediction}</p>
          <p><strong>Confidence:</strong> {(result.score * 100).toFixed(2)}%</p>

          <h4> Full Predictions:</h4>
          <ul>
            {result.summary.labels.map((label, index) => (
              <li key={label}>
                {label}: {(result.summary.scores[index] * 100).toFixed(2)}%
              </li>
      ))}
    </ul>
  </div>
      )}
    </div>
  );
}

export default App;
