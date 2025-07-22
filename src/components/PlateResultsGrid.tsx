import { memo } from "react";
import { useAssayStore } from "../features/hooks"; // Zustand store
import clsx from "clsx";

const COLS = Array.from({ length: 12 }, (_, i) => i + 1);
const ROWS = ["A","B","C","D","E","F","G","H"];

const PlateResultsGrid = memo(() => {
  // results: AssayResult[]; AssayResult = { wellId: string, value: number, isValid: boolean }
  const results = useAssayStore(s => s.results);
  // Map results to a lookup table for O(1) access
  const resultMap = Object.fromEntries(results.map(r => [r.wellId, r.isValid ? r.value : NaN])) as Record<string, number>;
  return (
    <div className="overflow-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-8 sticky left-0 bg-white"></th>
            {COLS.map(c => (
              <th key={c} className="w-8 px-1 text-center font-medium">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(r => (
            <tr key={r}>
              <th className="sticky left-0 bg-white font-medium">{r}</th>
              {COLS.map(c => {
                const id = `${r}${c}`;         // e.g. A1
                const val = resultMap[id];
                return (
                  <td
                    key={id}
                    className={clsx(
                      "h-6 w-8 text-center border border-gray-300",
                      Number.isFinite(val) ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {Number.isFinite(val) ? val.toFixed(3) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default PlateResultsGrid; 