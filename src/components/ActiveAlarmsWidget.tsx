// src/components/ActiveAlarmsWidget.tsx
import React, { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../config";

interface AlarmEvent {
  id: number;
  variable: string;
  deviceLabel: string;
  value: number;
  severity: number;      // 1 = baja, 2 = media, 3 = alta
  firedAt: string;
}

interface ActiveAlarmsWidgetProps {
  compact?: boolean;     // true = versión chiquita (Dashboard)
}

const EVENTS_URL = `${API_BASE_URL}/api/eventos-alarma/activos`;

const formatDateTime = (value: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getVariableLabel = (v: string) => {
  const key = v.toLowerCase();
  switch (key) {
    case "co2":
      return "CO₂ (ppm)";
    case "co":
      return "CO (ppm)";
    case "voc":
      return "VOC (Ip)";
    case "nox":
      return "NOx (Ip)";
    case "temperatura":
      return "Temperatura (°C)";
    case "humedad":
      return "Humedad (%)";
    default:
      return key.toUpperCase();
  }
};

const getSeverityStyles = (severity: number) => {
  switch (severity) {
    case 3:
      return {
        label: "SEVERIDAD ALTA",
        badgeClass: "text-red-700",
        cardClass: "border-l-4 border-red-400 bg-red-50",
      };
    case 2:
      return {
        label: "SEVERIDAD MEDIA",
        badgeClass: "text-amber-700",
        cardClass: "border-l-4 border-amber-300 bg-amber-50",
      };
    default:
      return {
        label: "SEVERIDAD BAJA",
        badgeClass: "text-sky-700",
        cardClass: "border-l-4 border-sky-300 bg-sky-50",
      };
  }
};

const ActiveAlarmsWidget: React.FC<ActiveAlarmsWidgetProps> = ({
  compact = false,
}) => {
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [resolvingSelected, setResolvingSelected] = useState(false);
  const hasEventsRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let requestInProgress = false;

    const fetchEvents = async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      if (!hasEventsRef.current) setLoading(true);
      try {
        const res = await fetch(EVENTS_URL);
        if (!res.ok) {
          throw new Error("Error al cargar eventos de alarma");
        }
        const data = await res.json();

        const mapped: AlarmEvent[] = data.map((e: any) => ({
          id:
            e.id_evento_alarma ??
            e.id ??
            e.idEvento ??
            Number(new Date()) + Math.random(),
          variable: (e.nombre_variable ?? e.variable ?? "").toLowerCase(),
          deviceLabel:
            e.nombre_dispositivo ??
            (e.id_dispositivo
              ? `Dispositivo #${e.id_dispositivo}`
              : "Dispositivo"),
          value: Number(e.valor ?? 0),
          severity: Number(e.nivel_severidad ?? 1),
          firedAt: e.fecha_disparo ?? e.fecha ?? "",
        }));

        if (!mounted) return;
        hasEventsRef.current = mapped.length > 0;
        setEvents(mapped);
        const activeIds = new Set(mapped.map((event) => event.id));
        setSelectedIds((current) => current.filter((id) => activeIds.has(id)));
        setError(null);
      } catch (err: unknown) {
        if (!mounted) return;
        console.error("Error cargando alarmas activas:", err);
        setError(err instanceof Error ? err.message : "Error desconocido al cargar alarmas");
      } finally {
        requestInProgress = false;
        if (mounted) setLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleResolve = async (id: number) => {
    setResolvingId(id);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/eventos-alarma/${id}/resolver`,
        { method: "PATCH" }
      );
      if (!res.ok) {
        throw new Error("Error al marcar la alarma como resuelta");
      }

      // Quitamos la alarma de la lista local
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Error al marcar como resuelta");
    } finally {
      setResolvingId(null);
    }
  };

  const toggleEventSelection = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const allEventsSelected =
    events.length > 0 && events.every((event) => selectedIds.includes(event.id));

  const toggleAllEvents = () => {
    setSelectedIds(allEventsSelected ? [] : events.map((event) => event.id));
  };

  const handleResolveSelected = async () => {
    const idsToResolve = events
      .filter((event) => selectedIds.includes(event.id))
      .map((event) => event.id);
    if (idsToResolve.length === 0) return;

    setResolvingSelected(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        idsToResolve.map(async (id) => {
          const res = await fetch(
            `${API_BASE_URL}/api/eventos-alarma/${id}/resolver`,
            { method: "PATCH" }
          );
          if (!res.ok) throw new Error(`No se pudo resolver la alarma ${id}`);
          return id;
        })
      );

      const resolvedIds = results
        .filter((result): result is PromiseFulfilledResult<number> => result.status === "fulfilled")
        .map((result) => result.value);
      const resolvedSet = new Set(resolvedIds);
      const failedCount = results.length - resolvedIds.length;

      setEvents((current) => current.filter((event) => !resolvedSet.has(event.id)));
      setSelectedIds((current) => current.filter((id) => !resolvedSet.has(id)));
      if (failedCount > 0) {
        setError(`Se resolvieron ${resolvedIds.length}; ${failedCount} no se pudieron resolver. Intenta de nuevo.`);
      }
    } catch (err: unknown) {
      console.error("Error resolviendo alarmas seleccionadas:", err);
      setError("No se pudieron resolver las alarmas seleccionadas. Intenta de nuevo.");
    } finally {
      setResolvingSelected(false);
    }
  };

  const containerClass = compact
    ? "bg-white rounded-xl p-4 shadow-md flex flex-col max-h-[260px]"
    : "bg-white rounded-xl p-5 shadow-md flex flex-col max-h-[420px]";

  const listClass = compact
    ? "mt-3 space-y-3 overflow-y-auto pr-2"
    : "mt-4 space-y-3 overflow-y-auto pr-2";

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alarmas activas</h2>
        <span className="text-xs text-gray-500">
          {loading ? "Cargando..." : `${events.length} activas`}
        </span>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Cargando alarmas...</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          No hay alarmas activas 🎉
        </p>
      ) : (
        <>
          {!compact && (
            <div className="mt-3 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex min-h-10 items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={allEventsSelected}
                  onChange={toggleAllEvents}
                  disabled={resolvingSelected || resolvingId !== null}
                  aria-label="Seleccionar todas las alarmas activas"
                  className="h-4 w-4 shrink-0 accent-[#0982A0]"
                />
                <span>Seleccionar todas</span>
              </label>

              {selectedIds.length > 0 && (
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="text-xs text-gray-600" aria-live="polite">
                    {selectedIds.length} seleccionadas
                  </span>
                  <button
                    type="button"
                    onClick={handleResolveSelected}
                    disabled={resolvingSelected || resolvingId !== null}
                    className="min-h-10 w-full rounded-lg bg-[#0982A0] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#076b83] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {resolvingSelected
                      ? "Resolviendo..."
                      : `Marcar seleccionadas como resueltas (${selectedIds.length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={listClass}>
            {events.map((ev) => {
              const { label, badgeClass, cardClass } = getSeverityStyles(
                ev.severity
              );
              const variableLabel = getVariableLabel(ev.variable);

              return (
                <div
                  key={ev.id}
                  className={`rounded-lg px-4 py-3 shadow-sm ${cardClass}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      {!compact && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(ev.id)}
                          onChange={() => toggleEventSelection(ev.id)}
                          disabled={resolvingSelected || resolvingId !== null}
                          aria-label={`Seleccionar alarma de ${variableLabel} del ${ev.deviceLabel}`}
                          className="mt-1 h-4 w-4 shrink-0 accent-[#0982A0]"
                        />
                      )}
                      <div className="min-w-0 break-words">
                        <p className="font-semibold text-sm">{variableLabel}</p>
                        <p className="text-xs text-gray-600">
                          {ev.deviceLabel} — Valor:{" "}
                          <span className="font-semibold">
                            {ev.value.toFixed(2)}
                          </span>
                        </p>
                        <p className="mt-1 text-[11px] text-gray-500">
                          Disparada: {formatDateTime(ev.firedAt)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`self-start text-[11px] font-semibold uppercase ${badgeClass}`}
                    >
                      {label}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResolve(ev.id)}
                    disabled={resolvingId === ev.id || resolvingSelected}
                    className="mt-2 min-h-10 w-full rounded-md px-2 text-left text-xs text-[#0982A0] hover:bg-white/60 hover:underline disabled:opacity-60 sm:min-h-8 sm:w-auto"
                  >
                    {resolvingId === ev.id
                      ? "Marcando..."
                      : "Marcar como resuelta"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ActiveAlarmsWidget;
