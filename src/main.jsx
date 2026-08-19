import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";

import { ReportProvider } from "./context/ReportContext";
import { ExpenseProvider } from "./context/ExpenseContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ExpenseProvider>
      <ReportProvider>
        <App />
      </ReportProvider>
    </ExpenseProvider>
  </StrictMode>
);