# T2943 计算修改总结

## 📋 **修改概述**

本文档总结了T2943酶分析计算的所有修改，包括重复测量逻辑、移动平均算法和调试工具的改进。

## 🔄 **主要修改**

### 1. **重复测量逻辑重构**

#### **问题**
- 原始逻辑固定以奇数列为主孔，偶数列为重复孔
- 无法适应数据从不同列开始的情况

#### **解决方案**
- 实现动态主孔/重复孔检测
- 基于每行第一个有数据的列来确定相对位置
- 相对位置为奇数的列为主孔，偶数的列为重复孔

#### **新增函数**
```typescript
// 获取每行第一个有数据的列
getFirstColumnWithData(row: string, rawData: WellData[]): number | null

// 动态判断是否为重复孔
isDuplicateWell(wellId: string, rawData: WellData[]): boolean

// 获取重复孔对应的主孔
getPrimaryWellId(wellId: string, rawData: WellData[]): string | null

// 从相邻孔获取重复测量数据
meanDuplicateFromAdjacentWells(wellId: string, rawData: WellData[]): number[] | null
```

#### **示例**
```
数据从A1开始: A1(主), A2(重复), A3(主), A4(重复)...
数据从A4开始: A4(主), A5(重复), A6(主), A7(重复)...
```

### 2. **移动平均算法修正**

#### **问题**
- 原始算法在边界处理上有问题
- 输出长度与输入长度相同，包含无效的边界值
- 边界处的平均值计算使用了不完整的窗口

#### **解决方案**
- 实现正确的滑动窗口平均
- 只输出完整窗口可用的平均值
- 输出长度 = 输入长度 - 窗口大小 + 1

#### **修改后的算法**
```typescript
export function movingAvg(arr: number[], window: number): number[] {
  if (window <= 0 || arr.length === 0) return []
  if (window === 1) return [...arr]
  if (window > arr.length) return []
  
  const result = []
  // 只计算完整窗口可用的位置
  for (let i = 0; i <= arr.length - window; i++) {
    const slice = arr.slice(i, i + window)
    const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length
    result.push(isFinite(avg) ? avg : 0)
  }
  return result
}
```

#### **示例**
```
输入: [0.25, 0.35, 0.20, 0.05, -0.85] (5个值)
窗口: 3
输出: [0.2667, 0.2000, -0.2000] (3个值)
```

### 3. **T2943计算函数增强**

#### **新增功能**
- 支持预计算平均值的直接使用
- 添加调试模式，返回中间计算结果
- 避免重复的平均值计算

#### **函数签名**
```typescript
calcT2943(
  duplicate: number[][], 
  window: number, 
  debug: boolean = false, 
  preCalculatedMean?: number[]
): { 
  result: number; 
  debug?: { 
    mean: number[]; 
    diff: number[]; 
    smooth: number[]; 
    maxVal: number 
  } 
}
```

### 4. **调试工具开发**

#### **T2943调试面板**
- 选择特定孔位进行详细分析
- 显示计算过程的每个步骤
- 支持平均值、一阶差分、移动平均的逐步验证

#### **移动平均调试工具**
- 独立的移动平均计算验证
- 详细的滑动窗口计算过程
- 支持自定义输入数据和窗口大小

## 🧮 **计算流程**

### **T2943完整计算步骤**

1. **数据输入**: 原始时间序列数据
2. **重复测量平均**: 使用相邻孔的数据计算平均值
3. **一阶差分**: 计算相邻时间点的差值
4. **移动平均平滑**: 使用滑动窗口进行平滑处理
5. **最大值提取**: 找到平滑后数据的最大值

### **示例计算**
```
原始数据:
A1: [1.2, 1.5, 1.8, 2.0, 2.1]
A2: [1.3, 1.4, 1.9, 2.1, 2.0]

步骤1 - 平均值: [1.25, 1.45, 1.85, 2.05, 2.05]
步骤2 - 一阶差分: [0.20, 0.40, 0.20, 0.00]
步骤3 - 移动平均(窗口=3): [0.2667, 0.2000]
步骤4 - 最大值: 0.2667
```

## 🎯 **影响范围**

### **修改的函数**
- `movingAvg()` - 移动平均算法
- `calcT2943()` - T2943计算函数
- `meanDuplicateFromAdjacentWells()` - 相邻孔平均值计算
- `isDuplicateWell()` - 重复孔判断
- `getPrimaryWellId()` - 主孔获取

### **影响的分析方法**
- **T2943**: 完全使用新的计算逻辑
- **S2251**: 使用修正后的移动平均
- **HoFF**: 使用修正后的移动平均

### **UI组件**
- `DebugPanel` - T2943调试面板
- `MovingAverageDebug` - 移动平均调试工具
- `PlateResultsGrid` - 结果显示（支持"dup"标记）

## ✅ **验证方法**

1. **使用调试面板**: 选择孔位，查看详细计算过程
2. **使用移动平均调试工具**: 验证滑动窗口计算
3. **对比预期结果**: 与手动计算的结果进行对比
4. **检查输出长度**: 确认移动平均输出长度正确

## 📊 **预期改进**

- **更准确的计算**: 正确的移动平均算法
- **更灵活的数据处理**: 动态主孔/重复孔检测
- **更好的调试能力**: 详细的中间计算过程
- **更可靠的结果**: 避免边界效应和重复计算 