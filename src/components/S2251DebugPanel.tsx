import React, { useState } from 'react'
import { useAssayStore } from '../features/hooks'
import { S2251DebugInfo, calculateS2251ForWell } from '../utils/s2251Calculator'

// Simple chart component for debugging
const SimpleChart: React.FC<{
  data: number[]
  title: string
  color?: string
}> = ({ data, title, color = '#3b82f6' }) => {
  if (data.length === 0) return null

  const max = Math.max(...data.filter(isFinite))
  const min = Math.min(...data.filter(isFinite))
  const range = max - min || 1

  return (
    <div className="bg-white p-4 rounded border">
      <h5 className="text-sm font-medium text-gray-900 mb-2">{title}</h5>
      <div className="flex items-end space-x-1 h-20">
        {data.map((value, index) => {
          const height = isFinite(value) ? ((value - min) / range) * 100 : 0
          return (
            <div
              key={index}
              className="flex-1 bg-blue-200 rounded-t"
              style={{
                height: `${Math.max(height, 1)}%`,
                backgroundColor: color
              }}
              title={`${index}: ${value.toFixed(4)}`}
            />
          )
        })}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        长度: {data.length} | 范围: {min.toFixed(4)} - {max.toFixed(4)}
      </div>
    </div>
  )
}



export const S2251DebugPanel: React.FC = () => {
  const { assayType, rawData, selectedWells, control0Wells, smoothingWindow, results } = useAssayStore()
  const [selectedWellForDebug, setSelectedWellForDebug] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<S2251DebugInfo | null>(null)

  // Auto-select first well if available and no well is selected
  // Also trigger when results are available
  React.useEffect(() => {
    const autoCalculate = async () => {
      if (selectedWells.size > 0 && !selectedWellForDebug) {
        // Try to find first well with valid results
        let firstWell = Array.from(selectedWells)[0]
        
        // If we have results, try to find first valid result
        if (results.length > 0) {
          const validResult = results.find(r => selectedWells.has(r.wellId) && r.isValid)
          if (validResult) {
            firstWell = validResult.wellId
          }
        }
        
        setSelectedWellForDebug(firstWell)
        const debug = await calculateDebugInfo(firstWell)
        setDebugInfo(debug)
      }
    }
    
    autoCalculate()
  }, [selectedWells, selectedWellForDebug, results])

  // Only show for S2251 assay
  if (assayType !== 'S2251') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          S2251 计算调试面板
        </h3>
        <div className="text-center text-gray-500 py-8">
          <p>请选择 S2251 模式以显示调试面板</p>
          <p className="text-sm mt-2">当前模式: {assayType}</p>
        </div>
      </div>
    )
  }

  const calculateDebugInfo = async (wellId: string): Promise<S2251DebugInfo | null> => {
    try {
      console.log('Calculating debug info for well:', wellId)
      
      const wellData = rawData.find(well => well.wellId === wellId)
      if (!wellData) {
        console.log('Well data not found for:', wellId)
        return null
      }

      console.log('Found well data, length:', wellData.timePoints.length)

      // Get control data
      const controlData = rawData
        .filter(well => control0Wells.has(well.wellId))
        .map(well => well.timePoints)
      
      console.log('Control wells found:', controlData.length)
      
      if (controlData.length === 0) {
        console.log('No control data available')
        return null
      }
      
      const bgCtrl = controlData[0]
      console.log('Background control data length:', bgCtrl.length)

      // Get duplicate data
      const { meanDuplicateFromAdjacentWells } = await import('../utils/metrics')
      const duplicateData = meanDuplicateFromAdjacentWells(wellId, rawData)
      console.log('Duplicate data found:', !!duplicateData)

      // Use the new S2251 calculation function
      const { result: finalResult, debug } = calculateS2251ForWell(
        wellId,
        wellData.timePoints,
        duplicateData,
        bgCtrl,
        smoothingWindow
      )
      
      console.log('Calculation completed, result:', finalResult)
      console.log('Debug info available:', !!debug)

      if (!debug) {
        console.log('Debug info is null, calculation may have failed')
        return null
      }

      return debug
    } catch (error) {
      console.error('Error calculating debug info:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      return null
    }
  }

  const handleWellSelect = async (wellId: string) => {
    setSelectedWellForDebug(wellId)
    const debug = await calculateDebugInfo(wellId)
    setDebugInfo(debug)
  }

  const formatArray = (arr: number[], maxLength: number = 10) => {
    if (arr.length <= maxLength) {
      return arr.map(v => v.toFixed(4)).join(', ')
    }
    return arr.slice(0, maxLength).map(v => v.toFixed(4)).join(', ') + ` ... (${arr.length - maxLength} more)`
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        S2251 计算调试面板
      </h3>
      
      {/* Debug Status */}
      <div className="bg-gray-100 p-3 rounded mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">调试状态</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• 原始数据数量: {rawData.length}</p>
          <p>• 选择的孔位数量: {selectedWells.size}</p>
          <p>• 控制孔数量: {control0Wells.size}</p>
          <p>• 计算结果数量: {results.length}</p>
          <p>• 当前选择的调试孔位: {selectedWellForDebug || '无'}</p>
          <p>• 调试信息状态: {debugInfo ? '已加载' : '未加载'}</p>
          <p>• 平滑窗口大小: {smoothingWindow}</p>
        </div>
      </div>

      {/* Instructions */}
      {rawData.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">使用说明</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. 在输入面板中粘贴或上传数据</p>
            <p>2. 选择0%控制孔（如G11、G12）</p>
            <p>3. 选择要分析的样本孔位</p>
            <p>4. 点击"计算"按钮</p>
            <p>5. 调试面板将显示详细的计算步骤和结果</p>
          </div>
        </div>
      )}

      {/* Well Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择要调试的孔位:
        </label>
        <div className="flex gap-2">
          <select
            value={selectedWellForDebug}
            onChange={(e) => handleWellSelect(e.target.value)}
            className="input-field flex-1"
          >
            <option value="">请选择孔位</option>
            {Array.from(selectedWells).map(wellId => (
              <option key={wellId} value={wellId}>{wellId}</option>
            ))}
          </select>
          {selectedWellForDebug && (
            <button
              onClick={async () => {
                console.log('Manual recalculation triggered for well:', selectedWellForDebug)
                const debug = await calculateDebugInfo(selectedWellForDebug)
                console.log('Manual calculation result:', debug)
                setDebugInfo(debug)
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新计算
            </button>
          )}
          <button
            onClick={async () => {
              console.log('Force calculation for first well')
              if (selectedWells.size > 0) {
                const firstWell = Array.from(selectedWells)[0]
                console.log('Calculating for first well:', firstWell)
                setSelectedWellForDebug(firstWell)
                const debug = await calculateDebugInfo(firstWell)
                console.log('Force calculation result:', debug)
                setDebugInfo(debug)
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            强制计算
          </button>
        </div>
      </div>

      {/* Debug Information */}
      <div className="space-y-4">
        {debugInfo ? (
          <>
            {/* Data Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SimpleChart data={debugInfo.originalData} title="主孔数据" color="#3b82f6" />
            {debugInfo.duplicateData && (
              <SimpleChart data={debugInfo.duplicateData} title="重复孔数据" color="#10b981" />
            )}
            <SimpleChart data={debugInfo.meanData} title="平均值 (dup-mean)" color="#f59e0b" />
            <SimpleChart data={debugInfo.lr} title="裂解率 (LR)" color="#ef4444" />
            <SimpleChart data={debugInfo.smoothedLr} title="平滑后裂解率" color="#8b5cf6" />
            <SimpleChart data={debugInfo.bgLr} title="背景平滑裂解率" color="#6b7280" />
            <SimpleChart data={debugInfo.netLr} title="净裂解率 (net-LR)" color="#ec4899" />
          </div>

          {/* Calculation Steps Display */}
          <div className="bg-blue-50 p-4 rounded mb-4">
            <h4 className="font-medium text-blue-900 mb-3">S2251 计算步骤结果</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Step 1: Duplicate Mean */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">步骤1: 重复孔平均值 (dup-mean)</h5>
                <p className="text-sm text-gray-600 font-mono">
                  主孔数据: {formatArray(debugInfo.originalData)}
                </p>
                {debugInfo.duplicateData && (
                  <p className="text-sm text-gray-600 font-mono mt-1">
                    重复孔数据: {formatArray(debugInfo.duplicateData)}
                  </p>
                )}
                <p className="text-sm text-gray-600 font-mono mt-1">
                  <span className="font-medium">平均值 (dup-mean):</span> {formatArray(debugInfo.meanData)}
                </p>
              </div>

              {/* Step 2: LR */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">步骤2: 裂解率 (LR)</h5>
                <p className="text-sm text-gray-600 font-mono">
                  {formatArray(debugInfo.lr)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  长度: {debugInfo.lr.length}
                </p>
              </div>

              {/* Step 3: Smooth LR */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">步骤3: 平滑后裂解率 (smooth-LR)</h5>
                <p className="text-sm text-gray-600 font-mono">
                  {formatArray(debugInfo.smoothedLr)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  长度: {debugInfo.smoothedLr.length} (平滑窗口: {smoothingWindow})
                </p>
              </div>

              {/* Step 4: Net LR */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">步骤4: 净裂解率 (net-LR)</h5>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">计算:</span> 样本平滑裂解率 - 背景平滑裂解率
                </p>
                <p className="text-sm text-gray-600 font-mono mt-1">
                  {formatArray(debugInfo.netLr)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  长度: {debugInfo.netLr.length}
                </p>
              </div>

              {/* Step 5: Max Value and Position */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">步骤5: 最大值和位置</h5>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">最大值:</span> {debugInfo.maxNetLr.toFixed(6)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">最大值位置:</span> {debugInfo.maxNetLrIndex}
                </p>
              </div>

              {/* Step 6: Linear Regression Slope */}
              <div className="bg-white p-3 rounded border">
                <h5 className="font-medium text-gray-900 mb-2">步骤6: 线性回归斜率 (PGR)</h5>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">回归斜率:</span> {debugInfo.regressionSlope.toFixed(8)}
                </p>
                <p className="text-sm text-gray-600 font-bold text-blue-600">
                  <span className="font-medium">PGR (科学计数法):</span> {debugInfo.finalResult.toExponential(6)}
                </p>
              </div>

            </div>
          </div>

          {/* Raw Data Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-gray-900 mb-2">原始数据</h4>
              <p className="text-sm text-gray-600 font-mono">
                {formatArray(debugInfo.originalData)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-gray-900 mb-2">背景平滑裂解率</h4>
              <p className="text-sm text-gray-600 font-mono">
                {formatArray(debugInfo.bgLr)}
              </p>
            </div>
          </div>



          {/* Control Wells Info */}
          <div className="bg-green-50 p-4 rounded">
            <h4 className="font-medium text-green-900 mb-2">控制孔信息</h4>
            <div className="text-sm text-green-800">
              <p>• 选择的0%控制孔: {Array.from(control0Wells).join(', ') || '无'}</p>
              <p>• 控制孔数量: {control0Wells.size}</p>
              <p>• 主要控制孔: {Array.from(control0Wells)[0] || '无'}</p>
              <p>• 背景控制数据处理: 与样本孔相同（dup-mean → LR → 平滑）</p>
            </div>
          </div>

          {/* Linear Regression Data */}
          <div className="bg-purple-50 p-4 rounded">
            <h4 className="font-medium text-purple-900 mb-2">线性回归数据</h4>
            <div className="text-sm text-purple-800">
              <p>• 回归时间点: {debugInfo.regressionData.x.join(', ')}</p>
              <p>• 回归净裂解率: {debugInfo.regressionData.y.map(v => v.toFixed(6)).join(', ')}</p>
              <p>• 回归斜率: {debugInfo.regressionSlope.toFixed(8)}</p>
            </div>
          </div>

          {/* Validation */}
          <div className="bg-yellow-50 p-4 rounded">
            <h4 className="font-medium text-yellow-900 mb-2">验证信息</h4>
            <div className="text-sm text-yellow-800">
              <p>• 原始数据长度: {debugInfo.originalData.length}</p>
              <p>• 平均值数据长度: {debugInfo.meanData.length}</p>
              <p>• 裂解率长度: {debugInfo.lr.length}</p>
              <p>• 平滑后裂解率长度: {debugInfo.smoothedLr.length}</p>
              <p>• 背景裂解率长度: {debugInfo.bgLr.length}</p>
              <p>• 净裂解率长度: {debugInfo.netLr.length}</p>
              <p>• 回归数据点数: {debugInfo.regressionData.x.length}</p>
              <p>• 计算结果是否有效: {isFinite(debugInfo.finalResult) ? '是' : '否'}</p>
              <p>• 是否有重复孔数据: {debugInfo.duplicateData ? '是' : '否'}</p>
            </div>
          </div>
        </>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">调试信息未加载</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• 请选择一个孔位进行调试</p>
              <p>• 确保已执行计算</p>
              <p>• 检查控制台是否有错误信息</p>
              <p>• 尝试点击"强制计算"按钮</p>
            </div>
            <div className="mt-3 text-xs text-yellow-600">
              <p>调试状态: 原始数据={rawData.length}, 选择孔位={selectedWells.size}, 控制孔={control0Wells.size}, 结果={results.length}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
