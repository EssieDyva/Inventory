import express from "express";
import path from "path";

const app = express();
const PORT = process.env.PORT || 4173; // Railway inietta PORT
const distPath = path.join(process.cwd(), "dist");

// Serve i file statici buildati
app.use(express.static(distPath));

// SPA fallback: tutte le route ritornano index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend server listening on http://0.0.0.0:${PORT}`);
});
