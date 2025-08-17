# S2251 计算步骤更新 - 添加平滑处理

## 更新内容

根据您的要求，在S2251计算步骤2之后添加了平滑处理步骤。现在S2251的计算步骤为：

### **新的6步S2251算法**

1. **计算重复孔的平均值**
   - 如果有重复孔，计算两个孔的平均值
   - 如果只有一个孔，直接使用该孔的数据

2. **计算一阶差分得到裂解率(LR)**
   - 计算相邻时间点之间的差值
   - 得到每分钟的裂解率

3. **按照smoothing window将LR进行平滑**
   - 使用移动平均算法对LR进行平滑处理
   - 在末端平滑提前结束，保证每个平滑窗口包含的采样点数都是一样的
   - 平滑窗口大小由用户设置的 `smoothingWindow` 参数控制

4. **减去0%控制的LR得到净裂解率(net-LR)**
   - 计算0%控制孔的一阶差分得到背景裂解率
   - 从平滑后的测试孔裂解率中减去背景裂解率

5. **找到net-LR的最大值和位置**
   - 找到净裂解率的最大值及其在数组中的位置

6. **计算线性回归斜率**
   - 计算从开始到最大值位置的线性回归斜率
   - 得到最终的Plasmin Generation Rate (PGR)

## 技术实现

### 1. **平滑算法实现**

使用 `movingAvg` 函数实现平滑处理：

```typescript
function movingAvg(arr: number[], window: number): number[] {
  if (window <= 0 || arr.length === 0) return []
  if (window === 1) return [...arr]
  if (window > arr.length) return [] // Window larger than array
  
  const result = []
  // Only calculate for positions where the full window is available
  for (let i = 0; i <= arr.length - window; i++) {
    const slice = arr.slice(i, i + window)
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length
    result.push(isFinite(avg) ? avg : 0)
  }
  return result
}
```

### 2. **平滑处理特点**

- **提前结束**: 平滑处理在末端提前结束，确保每个平滑窗口包含相同数量的采样点
- **窗口大小**: 由用户设置的 `smoothingWindow` 参数控制（默认值为3）
- **数据一致性**: 平滑后的数据长度会减少，但每个数据点都基于完整的窗口计算

### 3. **函数签名更新**

```typescript
// 核心计算函数
export function calcS2251(duplicate: number[][], bgCtrl: number[], smoothingWindow: number = 3): number

// 带调试信息的计算函数
export function calcS2251WithDebug(duplicate: number[][], bgCtrl: number[], smoothingWindow: number = 3): {
  result: number
  debug: {
    mean: number[]
    lr: number[]
    smoothedLr: number[]  // 新增：平滑后的裂解率
    bgLr: number[]
    netLr: number[]
    maxNetLr: number
    maxNetLrIndex: number
    regressionSlope: number
    regressionData: { x: number[], y: number[] }
  }
}
```

## 调试面板更新

### 1. **新增显示内容**

- **平滑后裂解率图表**: 显示平滑处理后的LR数据
- **平滑后裂解率数值**: 显示具体的平滑后LR数值
- **平滑窗口大小**: 在调试状态中显示当前使用的平滑窗口大小

### 2. **布局调整**

- 将调试面板移到结果表格之后，确保计算结果可用后再显示调试信息
- 添加了更智能的自动选择逻辑，优先选择有有效结果的孔位

### 3. **调试状态增强**

```typescript
// 新增调试状态信息
<p>• 计算结果数量: {results.length}</p>
<p>• 平滑窗口大小: {smoothingWindow}</p>
<p>• 平滑后裂解率长度: {debugInfo.smoothedLr.length}</p>
```

## 测试验证

### 测试结果对比

运行 `scripts/test-s2251-with-smoothing.js` 的结果：

**单个孔测试**:
- 无平滑 (window=1): `0.0007261904761904775`
- 平滑窗口=3: `0.0006309523809523806`
- 平滑窗口=5: `0.0006400000000000006`

**重复孔测试**:
- 无平滑 (window=1): `0.0006999999999999993`
- 平滑窗口=3: `0.0006666666666666669`
- 平滑窗口=5: `0.0006700000000000006`

### 平滑效果分析

1. **数据长度变化**:
   - 原始LR长度: 9
   - 平滑窗口=3后长度: 7
   - 平滑窗口=5后长度: 5

2. **数值平滑效果**:
   - 平滑处理有效减少了数据的噪声
   - 不同窗口大小产生不同的平滑效果
   - 结果值相对稳定，变化幅度合理

## 使用说明

### 1. **平滑窗口设置**

用户可以通过界面设置平滑窗口大小：
- 较小的窗口 (1-3): 保留更多原始数据特征
- 较大的窗口 (5-10): 提供更强的平滑效果

### 2. **调试功能**

调试面板现在显示：
- 原始裂解率 (LR)
- 平滑后裂解率 (Smoothed LR)
- 平滑窗口大小
- 各步骤的数据长度变化

### 3. **结果验证**

用户可以通过调试面板：
- 对比平滑前后的数据变化
- 验证平滑处理的效果
- 检查最终PGR值的合理性

## 文件修改清单

### 修改的文件
- ✅ `src/utils/s2251Calculator.ts` - 添加平滑处理步骤
- ✅ `src/features/hooks.ts` - 传递smoothingWindow参数
- ✅ `src/components/S2251DebugPanel.tsx` - 显示平滑后数据
- ✅ `src/pages/HomePage.tsx` - 调整调试面板位置

### 新增文件
- ✅ `scripts/test-s2251-with-smoothing.js` - 平滑处理测试脚本

## 总结

S2251计算步骤已成功更新，现在包含6个步骤：

1. ✅ 计算重复孔平均值
2. ✅ 计算一阶差分得到LR
3. ✅ **新增**: 按smoothing window平滑LR
4. ✅ 减去背景控制得到net-LR
5. ✅ 找到最大值和位置
6. ✅ 计算线性回归斜率

平滑处理确保了：
- 每个平滑窗口包含相同数量的采样点
- 在末端提前结束，避免不完整窗口
- 提供可调节的平滑强度
- 完整的调试信息显示

用户现在可以在调试面板中查看平滑前后的数据对比，验证平滑处理的效果，并获得更稳定的PGR计算结果。
