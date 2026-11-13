import React from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiShoppingCart, FiClipboard, FiLayers, FiBarChart2, FiCpu } from "react-icons/fi";
import "../css/AndroidHome.css";

const tiles = [
  { title: "Sales Invoice", path: "/app/sales", icon: FiFileText, tone: "sales" },
  { title: "Purchase Invoice", path: "/app/purchases", icon: FiShoppingCart, tone: "purchases" },
  { title: "Expense Entry", path: "/app/expenses", icon: FiClipboard, tone: "expenses" },
  { title: "Masters", path: "/app/items", icon: FiLayers, tone: "masters" },
  { title: "Reports", path: "/app/sales-reports", icon: FiBarChart2, tone: "reports" },
  { title: "AI Assistant", path: "/app/ai-assistant", icon: FiCpu, tone: "assistant" },
];

export default function AndroidHome() {
  const navigate = useNavigate();
  return (
    <main className="android-home" aria-label="Home">
      <div className="android-home-welcome">
        <span className="android-home-eyebrow">BILLING &amp; ACCOUNTING</span>
        <h1>Welcome back</h1>
        <p>What would you like to do today?</p>
      </div>
      <section className="android-home-grid" aria-label="Quick actions">
        {tiles.map(({ title, path, icon: Icon, tone, comingSoon }) => (
          <button key={title} type="button" className={`android-home-tile ${tone}`} onClick={() => path && navigate(path)} disabled={comingSoon} aria-label={title}>
            <span className="android-home-tile-icon"><Icon /></span>
            <span className="android-home-tile-title">{title}</span>
            {comingSoon && <span className="android-home-coming-soon">Coming soon</span>}
          </button>
        ))}
      </section>
    </main>
  );
}
