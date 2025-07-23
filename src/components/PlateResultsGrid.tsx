import { memo } from "react";
import { useAssayStore } from "../features/hooks"; // Zustand store
import clsx from "clsx";

const COLS = Array.from({ length: 12 }, (_, i) => i + 1);
const ROWS = ["A","B","C","D","E","F","G","H"];

const PlateResultsGrid = memo(() => {
  const results = useAssayStore(s => s.results);
  const sigDigits = useAssayStore(s => s.sigDigits);
  const incDigits = useAssayStore(s => s.incDigits);
  const decDigits = useAssayStore(s => s.decDigits);
  // Map results to a lookup table for O(1) access
  const resultMap = Object.fromEntries(results.map(r => [r.wellId, r.isValid ? r.value : NaN])) as Record<string, number>;
  const hasData = results.length > 0;
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6 w-full max-w-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Results Table</h3>
      {hasData ? (
        <div className="overflow-auto">
          <table className="border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="w-8 sticky left-0 bg-white"></th>
                <th colSpan={12} className="text-right pr-2">
                  <button
                    onClick={decDigits}
                    className="px-1 mx-1 rounded bg-gray-200 hover:bg-gray-300"
                    aria-label="Decrease significant digits"
                  >−</button>
                  <button
                    onClick={incDigits}
                    className="px-1 mx-1 rounded bg-gray-200 hover:bg-gray-300"
                    aria-label="Increase significant digits"
                  >+</button>
                  <span className="ml-1 text-sm text-gray-500">{sigDigits} dp</span>
                </th>
              </tr>
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
                        {Number.isFinite(val) ? val.toFixed(sigDigits) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12 text-lg">No results yet. Paste data and calculate to see results.</div>
      )}
    </div>
  );
});

export default PlateResultsGrid; 