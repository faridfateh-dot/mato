/**
 * Utility functions for handling multi-unit conversions (e.g., Kg <-> Grams, Liter <-> mL)
 * across Purchasing, Inventory Management, and Recipe Costing.
 */

export type StandardUnitCategory = 'weight' | 'volume' | 'count';

export function getUnitCategory(unitStr: string): StandardUnitCategory {
  if (!unitStr) return 'count';
  const u = unitStr.toLowerCase().trim();
  if (
    u.includes('كغ') ||
    u.includes('كيلو') ||
    u === 'kg' ||
    u.includes('غرام') ||
    u === 'g' ||
    u === 'غ'
  ) {
    return 'weight';
  }
  if (
    u.includes('لتر') ||
    u === 'liter' ||
    u === 'l' ||
    u.includes('مليلتر') ||
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
  return u.includes('كغ') || u.includes('كيلو') || u === 'kg' || u.includes('كيلوغرام');
}

export function isGramUnit(unitStr: string): boolean {
  if (!unitStr) return false;
  const u = unitStr.toLowerCase().trim();
  return (u.includes('غرام') || u === 'g' || u === 'غ') && !isKgUnit(unitStr);
}

export function isLiterUnit(unitStr: string): boolean {
  if (!unitStr) return false;
  const u = unitStr.toLowerCase().trim();
  return u.includes('لتر') || u === 'liter' || u === 'l';
}

export function isMlUnit(unitStr: string): boolean {
  if (!unitStr) return false;
  const u = unitStr.toLowerCase().trim();
  return (u.includes('مليلتر') || u.includes('مل') || u === 'ml') && !isLiterUnit(unitStr);
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
  if (!qty || isNaN(qty)) return 0;
  if (!fromUnit || !toUnit || fromUnit.trim() === toUnit.trim()) return qty;

  const fromIsKg = isKgUnit(fromUnit);
  const fromIsGram = isGramUnit(fromUnit);
  const toIsKg = isKgUnit(toUnit);
  const toIsGram = isGramUnit(toUnit);

  if (fromIsGram && toIsKg) return qty / 1000;
  if (fromIsKg && toIsGram) return qty * 1000;

  const fromIsLiter = isLiterUnit(fromUnit);
  const fromIsMl = isMlUnit(fromUnit);
  const toIsLiter = isLiterUnit(toUnit);
  const toIsMl = isMlUnit(toUnit);

  if (fromIsMl && toIsLiter) return qty / 1000;
  if (fromIsLiter && toIsMl) return qty * 1000;

  return qty;
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
  if (!qty || isNaN(qty)) return 0;
  if (!fromUnit || !toUnit || fromUnit.trim() === toUnit.trim()) return qty;

  const fromCat = getUnitCategory(fromUnit);
  const toCat = getUnitCategory(toUnit);

  if (fromCat === toCat && fromCat !== 'count') {
    return convertQuantity(qty, fromUnit, toUnit);
  }

  // Check if pieceWeight conversion is configured
  if (pieceConfig && pieceConfig.pieceWeight && pieceConfig.pieceWeight > 0) {
    const pWeight = pieceConfig.pieceWeight;
    const pWeightUnit = pieceConfig.pieceWeightUnit || 'غرام (غ)';

    // From count/piece to weight/volume (e.g. 10 رؤوس -> grams or kg)
    if (fromCat === 'count' && toCat !== 'count') {
      const totalWeightInPieceUnit = qty * pWeight;
      return convertQuantity(totalWeightInPieceUnit, pWeightUnit, toUnit);
    }

    // From weight/volume to count/piece (e.g. 80 grams -> رؤوس/قطع)
    if (fromCat !== 'count' && toCat === 'count') {
      const qtyInPieceWeightUnit = convertQuantity(qty, fromUnit, pWeightUnit);
      return qtyInPieceWeightUnit / pWeight;
    }
  }

  return convertQuantity(qty, fromUnit, toUnit);
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
