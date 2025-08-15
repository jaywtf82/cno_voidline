import React from "react";
import styles from "./VisualizerMock.module.css";

export const VisualizerMock = ({ type = "main" }) => (
  <div className={`${styles.visualizer} ${styles[type]}`}>
    <div className={styles.glow}></div>
    {/* Replace with animated SVG or canvas for effect */}
    <span className={styles.label}>
      {type === "main" ? "3D Orbital Spectrum" : type === "stereo" ? "Stereo Radar" : "Phase Grid"}
    </span>
  </div>
);