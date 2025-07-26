import React from 'react'
import { WellData } from '../features/hooks'

interface DataPreviewTableProps {
  data: WellData[]
  maxWells?: number
  maxPoints?: number
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  data,
  maxWells = 5,
  maxPoints = 5
}) => {
  const wells = data.slice(0, maxWells)
  const showEllipsisRows = data.length > maxWells
  const showEllipsisCols = wells[0]?.timePoints.length > maxPoints

  return (
    <div className="overflow-auto border rounded bg-white max-h-60">
      <table className="min-w-[400px] text-sm" role="table">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left sticky left-0 bg-white">Well</th>
            {Array.from({ length: Math.min(maxPoints, wells[0]?.timePoints.length || 0) }, (_, i) => (
              <th key={i} className="px-2 py-1 text-right">T{i}</th>
            ))}
            {showEllipsisCols && <th className="px-2 py-1">…</th>}
          </tr>
        </thead>
        <tbody>
          {wells.map(well => (
            <tr key={well.wellId}>
              <td className="px-2 py-1 font-mono sticky left-0 bg-white">{well.wellId}</td>
              {well.timePoints.slice(0, maxPoints).map((v, idx) => (
                <td key={idx} className="px-2 py-1 text-right font-mono">{v}</td>
              ))}
              {showEllipsisCols && <td className="px-2 py-1 text-right">…</td>}
            </tr>
          ))}
          {showEllipsisRows && (
            <tr>
              <td className="px-2 py-1" colSpan={maxPoints + 2}>…</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

