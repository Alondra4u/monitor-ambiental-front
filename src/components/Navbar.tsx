import { useState } from "react";
import { NavLink } from "react-router-dom";

const linkBaseClasses = "cursor-pointer hover:text-gray-200";
const activeClasses = "font-semibold underline";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#0982A0] text-white px-4 py-3 shadow-md sm:px-6 md:px-8 md:py-4">
      <div className="mx-auto max-w-7xl md:flex md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 flex-1 text-base font-semibold leading-tight sm:text-lg md:text-xl">
          Estación de Monitoreo de Calidad del Aire
        </h1>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
        </div>

        <ul id="main-navigation" className={`${menuOpen ? "flex" : "hidden"} mt-3 flex-col gap-3 border-t border-white/20 pt-3 text-sm md:mt-0 md:flex md:flex-row md:items-center md:gap-8 md:border-0 md:pt-0`}>
          <li>
            <NavLink
              to="/"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
              end
            >
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/historial"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Historial
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/comparativa"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Comparativa
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/alarmas"
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `${linkBaseClasses} ${isActive ? activeClasses : ""}`
              }
            >
              Alarmas
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
