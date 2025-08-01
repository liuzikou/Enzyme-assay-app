import { memo } from "react";
import { useAssayStore } from "../features/hooks"; // Zustand store
import { isDuplicateWell } from "../utils/metrics";

const COLS = Array.from({ length: 12 }, (_, i) => i + 1);
const ROWS = ["A","B","C","D","E","F","G","H"];

const PlateResultsGrid = memo(() => {
  const results = useAssayStore(s => s.results);
  const sigDigits = useAssayStore(s => s.sigDigits);
  const incDigits = useAssayStore(s => s.incDigits);
  const decDigits = useAssayStore(s => s.decDigits);
  const rawData = useAssayStore(s => s.rawData);
  // Map results to a lookup table for O(1) access
  const resultMap = Object.fromEntries(results.map(r => [r.wellId, r.isValid ? r.value : NaN])) as Record<string, number>;
  const hasData = results.length > 0;
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6 w-full max-w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Results Table</h3>
        <div className="flex items-center space-x-1 text-sm">
          <button
            onClick={decDigits}
            className="px-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
            aria-label="Decrease significant digits"
          >−</button>
          <span className="text-gray-500">{sigDigits} dp</span>
          <button
            onClick={incDigits}
            className="px-1 rounded bg-gray-200 hover:bg-gray-300 text-xs"
            aria-label="Increase significant digits"
          >+</button>
        </div>
      </div>
      {hasData ? (
        <div className="overflow-auto">
          <table className="border-collapse min-w-[900px]">
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
                    const hasDataInRow = rawData.some(well => well.wellId.startsWith(r));
                    const hasDataInCol = rawData.some(well => {
                      const match = well.wellId.match(/^([A-H])(\d+)$/);
                      return match && parseInt(match[2]) === c;
                    });
                    const isDuplicate = hasDataInRow && hasDataInCol && isDuplicateWell(id, rawData);
                    
                    return (
                      <td
                        key={id}
                        className={`h-6 w-8 text-center border border-gray-300 ${
                          Number.isFinite(val) ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {isDuplicate ? "dup" : (Number.isFinite(val) ? val.toFixed(sigDigits) : "—")}
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