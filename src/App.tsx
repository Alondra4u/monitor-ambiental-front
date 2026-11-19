import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Comparativa from "./components/Comparativa";
import RealTimeValues from "./components/RealTimeValues";
import LiveChart from "./components/LiveChart";
import HistoryTable from "./components/HistoryTable";
import AlarmsPanel from "./components/AlarmsPanel";
import DashboardHistoryTable from "./components/DashboardHistoryTable";
import ActiveAlarmsWidget from "./components/ActiveAlarmsWidget";
import { Routes, Route } from "react-router-dom";
import { API_BASE_URL } from "./config";

/* 👇 Tipo de dato que vamos a manejar desde la API */
export type Registro = {
  fecha: string;
  hora: string;
  estacion: string;
  co2: number;
  co: number;
  nox: number;
  voc: number;
  temperatura?: number;
  humedad?: number;
};

type PromedioDiario = Pick<Registro, "fecha" | "estacion" | "co2">;

type DashboardPageProps = {
  registros: Registro[];
  promedios: PromedioDiario[];
};

function DashboardPage({ registros, promedios }: DashboardPageProps) {
    
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-3 pb-6 pt-5 sm:px-6 sm:pt-10">
      {/* Fila 1: valores + gráfica */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <RealTimeValues registros={registros} />
        </div>
        <div className="lg:col-span-2">
          <LiveChart registros={registros} dailyAverages={promedios} />
        </div>
      </div>

      {/* Fila 2: historial + alarmas (compact) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DashboardHistoryTable registros={registros} />
        </div>
        <div className="lg:col-span-1">
          {/* 👇 AQUÍ usamos el modo compacto */}
          <ActiveAlarmsWidget compact />
        </div>
      </div>
    </div>
  );
}

function ComparativaPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 pb-6 pt-5 sm:px-6">
      <Comparativa />
    </div>
  );
}

function HistorialPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6">
      <HistoryTable />
    </div>
  );
}
function AlarmasPage() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6">
      {/* 👇 Aquí sí dejamos la configuración completa */}
      <AlarmsPanel showButton={true} />
    </div>
  );
}

function App() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [promedios, setPromedios] = useState<PromedioDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let requestInProgress = false;

    const fetchMediciones = async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      try {
        const res = await fetch(`${API_BASE_URL}/api/mediciones/dashboard`);

        if (!res.ok) {
          throw new Error("Error HTTP " + res.status);
        }

        const payload = await res.json();
        const data: any[] = Array.isArray(payload) ? payload : payload.registros;

        const normalizados: Registro[] = data.map((item: any) => ({
          fecha: item.fecha,
          hora: item.hora,
          estacion:
            item.estacion === "RURAL"
              ? "Rural"
              : item.estacion === "URBANA"
              ? "Urbana"
              : item.estacion ?? "N/A",
          co2: Number(item.co2),
          co: Number(item.co),
          nox: Number(item.nox),
          voc: Number(item.voc),
          temperatura:
            item.temperatura != null ? Number(item.temperatura) : undefined,
          humedad:
            item.humedad != null ? Number(item.humedad) : undefined,
        }));

        setRegistros(normalizados);
        setPromedios(
          Array.isArray(payload.promedios)
            ? payload.promedios.map((item: any) => ({
                fecha: item.fecha,
                estacion:
                  item.estacion === "RURAL"
                    ? "Rural"
                    : item.estacion === "URBANA"
                      ? "Urbana"
                      : item.estacion ?? "N/A",
                co2: Number(item.co2),
              }))
            : []
        );
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error cargando datos";
        console.error("Error cargando mediciones:", err);
        setError(message);
      } finally {
        setLoading(false);
        requestInProgress = false;
      }
    };

    fetchMediciones();
    const intervalo = setInterval(fetchMediciones, 30000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      {loading && (
        <p role="status" className="mx-auto mt-3 max-w-7xl px-3 text-sm text-gray-600 sm:px-6">
          Conectando con la API y cargando las últimas mediciones…
        </p>
      )}

      {error && (
        <div role="alert" className="mx-auto mt-4 max-w-7xl px-3 sm:px-6">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No se pudieron actualizar las mediciones. {registros.length > 0
              ? "Se muestran los últimos datos disponibles."
              : "Comprueba que la API esté disponible e inténtalo de nuevo."}
          </p>
        </div>
      )}

      <Routes>
        <Route path="/" element={<DashboardPage registros={registros} promedios={promedios} />} />
       <Route
  path="/historial"
  element={<HistorialPage />}
/>
        <Route path="/comparativa" element={<ComparativaPage />} />
        <Route path="/alarmas" element={<AlarmasPage />} />
        <Route path="*" element={<div className="mx-auto max-w-7xl px-3 py-12 text-center text-gray-600 sm:px-6">Página no encontrada.</div>} />
      </Routes>

      <div className="text-xs text-gray-500 text-center pb-2">
        Registros recientes cargados desde la API: {registros.length}
      </div>
    </div>
  );
}

export default App;
