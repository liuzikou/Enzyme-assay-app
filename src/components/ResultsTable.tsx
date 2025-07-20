import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table'
import { useAssayStore, AssayType } from '../features/hooks'

const columnHelper = createColumnHelper<{
  wellId: string
  value: number
  isValid: boolean
}>()

export const ResultsTable: React.FC = () => {
  const { results, assayType, hoffMetric } = useAssayStore()
  const [sorting, setSorting] = React.useState<SortingState>([])

  const getMetricColumnName = () => {
    switch (assayType) {
      case 'T2943':
        return 'Catalytic Rate'
      case 'S2251':
        return 'Generation Rate'
      case 'HoFF':
        return hoffMetric
      default:
        return 'Value'
    }
  }

  const columns = useMemo(() => [
    columnHelper.accessor('wellId', {
      header: 'Well ID',
      cell: info => (
        <span className="font-medium text-gray-900">
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor('value', {
      header: getMetricColumnName(),
      cell: info => {
        const value = info.getValue()
        const isValid = info.row.original.isValid
        
        return (
          <span className={`${isValid ? 'text-gray-900' : 'text-red-600'}`}>
            {isValid ? value.toFixed(4) : 'Invalid'}
          </span>
        )
      }
    }),
    columnHelper.accessor('isValid', {
      header: 'Status',
      cell: info => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          info.getValue() 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {info.getValue() ? 'Valid' : 'Invalid'}
        </span>
      )
    })
  ], [assayType, hoffMetric])

  const table = useReactTable({
    data: results,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Results Table</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No results available. Run calculation to see results.</p>
        </div>
      </div>
    )
  }

  const validResults = results.filter(r => r.isValid)
  const invalidResults = results.filter(r => !r.isValid)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Results Table</h3>
        <div className="text-sm text-gray-600">
          {validResults.length} valid, {invalidResults.length} invalid
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() && (
                        <span className="text-gray-400">
                          {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {validResults.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Summary Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Mean:</span>
              <span className="ml-2 font-medium">
                {(validResults.reduce((sum, r) => sum + r.value, 0) / validResults.length).toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Std Dev:</span>
              <span className="ml-2 font-medium">
                {(() => {
                  const mean = validResults.reduce((sum, r) => sum + r.value, 0) / validResults.length
                  const variance = validResults.reduce((sum, r) => sum + Math.pow(r.value - mean, 2), 0) / validResults.length
                  return Math.sqrt(variance).toFixed(4)
                })()}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Min:</span>
              <span className="ml-2 font-medium">
                {Math.min(...validResults.map(r => r.value)).toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Max:</span>
              <span className="ml-2 font-medium">
                {Math.max(...validResults.map(r => r.value)).toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 