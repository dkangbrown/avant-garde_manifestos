import React from "react";
import ReactDOM from "react-dom/client";
import GridTextBuilder from "./components/GridTextBuilder";
import "./styles/style.css";

const root = document.getElementById("root");

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <GridTextBuilder />
    </React.StrictMode>
  );
}