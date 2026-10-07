/**
 * Utility functions for handling multi-unit conversions (e.g., Kg <-> Grams, Liter <-> mL)
 * across Purchasing, Inventory Management, and Recipe Costing.
 */

export type StandardUnitCategory = 'weight' | 'volume' | 'count';

export function parseNumericInput(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (val === null || val === undefined) return 0;
  const normalized = String(val)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .replace(/٫/g, '.')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '')
    .trim();
  const num = Number(normalized);
  return isNaN(num) ? 0 : num;
}

export function getUnitCategory(unitStr: string): StandardUnitCategory {
  if (!unitStr) return 'count';
  const u = unitStr.toLowerCase().trim();
  if (
    u.includes('كغ') ||
    u.includes('كيلو') ||
    u.includes('كجم') ||
    u === 'kg' ||
    u.includes('غرام') ||
    u.includes('جرام') ||
    u.includes('جم') ||
    u === 'g' ||
    u === 'gm' ||
    u === 'gram' ||
    u === 'غ'
  ) {
    return 'weight';
  }
  if (
    u.includes('لتر') ||
    u.includes('ليتر') ||
    u === 'liter' ||
    u === 'l' ||
    u.includes('مليلتر') ||
    u.includes('ملي') ||
    u.includes('مل') ||
    u === 'ml'
  ) {
    return 'volume';
  }
  return 'count';
}

export function isKgUnit(unitStr: string): boolean {
  if (!unitStr) return false;
  const u = unitStr.toLowerCase().trim();
  return u.includes('كغ') || u.includes('كيلو') || u.includes('كجم') || u === 'kg' || u.includes('كيلوغرام') || u.includes('كيلوجرام');
}

export function isGramUnit(unitStr: string): boolean {
  if (!unitStr) return false;
  const u = unitStr.toLowerCase().trim();
  return (u.includes('غرام') || u.includes('جرام') || u.includes('جم') || u === 'g' || u === 'gm' || u === 'gram' || u === 'غ') && !isKgUnit(unitStr);
}

export function isLiterUnit(unitStr: string): boolean {
  if (!unitStr) return false;
  const u = unitStr.toLowerCase().trim();
  return (u.includes('لتر') || u.includes('ليتر') || u === 'liter' || u === 'l') && !u.includes('مليلتر') && !u.includes('ملي');
}

export function isMlUnit(unitStr: string): boolean {
  if (!unitStr) return false;
  const u = unitStr.toLowerCase().trim();
  return (u.includes('مليلتر') || u.includes('ملي') || u.includes('مل') || u === 'ml') && !isLiterUnit(unitStr);
}

export interface PieceWeightConfig {
  pieceWeight?: number;
  pieceWeightUnit?: string;
  pieceUnitName?: string;
  unit?: string;
}

export function isCountUnit(unitStr: string): boolean {
  return getUnitCategory(unitStr) === 'count';
}

/**
 * Converts a quantity from `fromUnit` to `toUnit`.
 * e.g., convertQuantity(150, 'غرام (غ)', 'كيلوغرام (كغ)') => 0.15
 * e.g., convertQuantity(2.5, 'كيلوغرام (كغ)', 'غرام (غ)') => 2500
 */
export function convertQuantity(qty: number, fromUnit: string, toUnit: string): number {
  const numQty = parseNumericInput(qty);
  if (!numQty) return 0;
  if (!fromUnit || !toUnit || fromUnit.trim() === toUnit.trim()) return numQty;

  const fromIsKg = isKgUnit(fromUnit);
  const fromIsGram = isGramUnit(fromUnit);
  const toIsKg = isKgUnit(toUnit);
  const toIsGram = isGramUnit(toUnit);

  if (fromIsGram && toIsKg) return numQty / 1000;
  if (fromIsKg && toIsGram) return numQty * 1000;

  const fromIsLiter = isLiterUnit(fromUnit);
  const fromIsMl = isMlUnit(fromUnit);
  const toIsLiter = isLiterUnit(toUnit);
  const toIsMl = isMlUnit(toUnit);

  if (fromIsMl && toIsLiter) return numQty / 1000;
  if (fromIsLiter && toIsMl) return numQty * 1000;

  return numQty;
}

/**
 * Advanced quantity converter that also converts piece/count units to weight/volume
 * using an ingredient's pieceWeight configuration (e.g., 1 رأس خس = 500غ).
 */
export function convertQuantityAdvanced(
  qty: number,
  fromUnit: string,
  toUnit: string,
  pieceConfig?: PieceWeightConfig
): number {
  const numQty = parseNumericInput(qty);
  if (!numQty) return 0;
  if (!fromUnit || !toUnit || fromUnit.trim() === toUnit.trim()) return numQty;

  const fromCat = getUnitCategory(fromUnit);
  const toCat = getUnitCategory(toUnit);

  if (fromCat === toCat && fromCat !== 'count') {
    return convertQuantity(numQty, fromUnit, toUnit);
  }

  // Check if pieceWeight conversion is configured
  const pWeight = pieceConfig ? parseNumericInput(pieceConfig.pieceWeight) : 0;
  if (pieceConfig && pWeight > 0) {
    const pWeightUnit = pieceConfig.pieceWeightUnit || 'غرام (غ)';

    // From count/piece to weight/volume (e.g. 10 رؤوس -> grams or kg)
    if (fromCat === 'count' && toCat !== 'count') {
      const totalWeightInPieceUnit = numQty * pWeight;
      return convertQuantity(totalWeightInPieceUnit, pWeightUnit, toUnit);
    }

    // From weight/volume to count/piece (e.g. 80 grams -> رؤوس/قطع)
    if (fromCat !== 'count' && toCat === 'count') {
      const qtyInPieceWeightUnit = convertQuantity(numQty, fromUnit, pWeightUnit);
      return qtyInPieceWeightUnit / pWeight;
    }
  }

  return convertQuantity(numQty, fromUnit, toUnit);
}

/**
 * Converts a cost per unit from `costUnit` to `targetUnit`.
 * e.g., if cost is 120,000 SYP per kg, cost per gram is 120 SYP/g.
 */
export function convertCostPerUnit(cost: number, costUnit: string, targetUnit: string): number {
  if (!cost || isNaN(cost)) return 0;
  if (!costUnit || !targetUnit || costUnit.trim() === targetUnit.trim()) return cost;

  const costIsKg = isKgUnit(costUnit);
  const costIsGram = isGramUnit(costUnit);
  const targetIsKg = isKgUnit(targetUnit);
  const targetIsGram = isGramUnit(targetUnit);

  if (costIsKg && targetIsGram) return cost / 1000;
  if (costIsGram && targetIsKg) return cost * 1000;

  const costIsLiter = isLiterUnit(costUnit);
  const costIsMl = isMlUnit(costUnit);
  const targetIsLiter = isLiterUnit(targetUnit);
  const targetIsMl = isMlUnit(targetUnit);

  if (costIsLiter && targetIsMl) return cost / 1000;
  if (costIsMl && targetIsLiter) return cost * 1000;

  return cost;
}

/**
 * Advanced cost per unit converter with pieceWeight support.
 */
export function convertCostPerUnitAdvanced(
  cost: number,
  costUnit: string,
  targetUnit: string,
  pieceConfig?: PieceWeightConfig
): number {
  if (!cost || isNaN(cost)) return 0;
  if (!costUnit || !targetUnit || costUnit.trim() === targetUnit.trim()) return cost;

  const costCat = getUnitCategory(costUnit);
  const targetCat = getUnitCategory(targetUnit);

  if (costCat === targetCat && costCat !== 'count') {
    return convertCostPerUnit(cost, costUnit, targetUnit);
  }

  if (pieceConfig && pieceConfig.pieceWeight && pieceConfig.pieceWeight > 0) {
    const pWeight = pieceConfig.pieceWeight;
    const pWeightUnit = pieceConfig.pieceWeightUnit || 'غرام (غ)';

    if (costCat === 'count' && targetCat !== 'count') {
      const costPerPWeightUnit = cost / pWeight;
      return convertCostPerUnit(costPerPWeightUnit, pWeightUnit, targetUnit);
    }

    if (costCat !== 'count' && targetCat === 'count') {
      const costInPWeightUnit = convertCostPerUnit(cost, costUnit, pWeightUnit);
      return costInPWeightUnit * pWeight;
    }
  }

  return convertCostPerUnit(cost, costUnit, targetUnit);
}

/**
 * Returns available compatible unit choices for a given base unit.
 */
export function getCompatibleUnits(
  baseUnitStr: string,
  pieceConfig?: PieceWeightConfig
): { value: string; label: string }[] {
  const cat = getUnitCategory(baseUnitStr);
  const list: { value: string; label: string }[] = [];

  if (cat === 'weight') {
    list.push(
      { value: 'غرام (غ)', label: 'غرام (غ)' },
      { value: 'كيلوغرام (كغ)', label: 'كيلوغرام (كغ)' }
    );
  } else if (cat === 'volume') {
    list.push(
      { value: 'مليلتر (مل)', label: 'مليلتر (مل)' },
      { value: 'لتر', label: 'لتر' }
    );
  } else {
    list.push({ value: baseUnitStr || 'قطعة', label: baseUnitStr || 'قطعة' });
  }

  if (pieceConfig && pieceConfig.pieceWeight && pieceConfig.pieceWeight > 0) {
    const pieceUnitName = pieceConfig.pieceUnitName || 'قطعة / رأس';
    if (!list.some(u => u.value === pieceUnitName || u.value === 'قطعة' || u.value === 'رأس')) {
      list.push({
        value: pieceUnitName,
        label: `${pieceUnitName} (${pieceConfig.pieceWeight} ${pieceConfig.pieceWeightUnit || 'غرام'})`
      });
    }

    if (cat === 'count') {
      if (!list.some(u => isGramUnit(u.value))) {
        list.push({ value: 'غرام (غ)', label: 'غرام (غ)' });
      }
      if (!list.some(u => isKgUnit(u.value))) {
        list.push({ value: 'كيلوغرام (كغ)', label: 'كيلوغرام (كغ)' });
      }
    }
  }

  return list;
}
