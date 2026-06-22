// import { describe, expect, it } from "bun:test";

// // Pure business logic tests for weight range rules

// describe("Weight Range Overlap Detection", () => {
//   it("should detect no overlap between [0-5] and [5-10]", () => {
//     const ranges = [
//       { minWeight: 0, maxWeight: 5 },
//       { minWeight: 5, maxWeight: 10 },
//     ];

//     const hasOverlap = ranges.some((r1, i) =>
//       ranges.slice(i + 1).some(
//         (r2) => Number(r1.minWeight) < Number(r2.maxWeight) && Number(r1.maxWeight) > Number(r2.minWeight)
//       )
//     );

//     expect(hasOverlap).toBe(false);
//   });

//   it("should detect overlap between [0-5] and [4-10]", () => {
//     const ranges = [
//       { minWeight: 0, maxWeight: 5 },
//       { minWeight: 4, maxWeight: 10 },
//     ];

//     const hasOverlap = ranges.some((r1, i) =>
//       ranges.slice(i + 1).some(
//         (r2) => Number(r1.minWeight) < Number(r2.maxWeight) && Number(r1.maxWeight) > Number(r2.minWeight)
//       )
//     );

//     expect(hasOverlap).toBe(true);
//   });

//   it("should detect overlap between [0-10] and [5-7] (contained)", () => {
//     const ranges = [
//       { minWeight: 0, maxWeight: 10 },
//       { minWeight: 5, maxWeight: 7 },
//     ];

//     const hasOverlap = ranges.some((r1, i) =>
//       ranges.slice(i + 1).some(
//         (r2) => Number(r1.minWeight) < Number(r2.maxWeight) && Number(r1.maxWeight) > Number(r2.minWeight)
//       )
//     );

//     expect(hasOverlap).toBe(true);
//   });

//   it("should detect no overlap between [0-5] and [10-15]", () => {
//     const ranges = [
//       { minWeight: 0, maxWeight: 5 },
//       { minWeight: 10, maxWeight: 15 },
//     ];

//     const hasOverlap = ranges.some((r1, i) =>
//       ranges.slice(i + 1).some(
//         (r2) => Number(r1.minWeight) < Number(r2.maxWeight) && Number(r1.maxWeight) > Number(r2.minWeight)
//       )
//     );

//     expect(hasOverlap).toBe(false);
//   });

//   it("should detect overlap between identical ranges [5-10] and [5-10]", () => {
//     const ranges = [
//       { minWeight: 5, maxWeight: 10 },
//       { minWeight: 5, maxWeight: 10 },
//     ];

//     const hasOverlap = ranges.some((r1, i) =>
//       ranges.slice(i + 1).some(
//         (r2) => Number(r1.minWeight) < Number(r2.maxWeight) && Number(r1.maxWeight) > Number(r2.minWeight)
//       )
//     );

//     expect(hasOverlap).toBe(true);
//   });
// });

// describe("Effective Weight Calculation", () => {
//   it("should use maxWeight as effective weight", () => {
//     const range = { minWeight: 5, maxWeight: 10 };
//     const effectiveWeight = Number(range.maxWeight);
//     expect(effectiveWeight).toBe(10);
//   });

//   it("should use upper bound of [0-5] kg as 5", () => {
//     const range = { minWeight: 0, maxWeight: 5 };
//     const effectiveWeight = Number(range.maxWeight);
//     expect(effectiveWeight).toBe(5);
//   });

//   it("should use upper bound of [10-15] kg as 15", () => {
//     const range = { minWeight: 10, maxWeight: 15 };
//     const effectiveWeight = Number(range.maxWeight);
//     expect(effectiveWeight).toBe(15);
//   });
// });

// describe("Minimum Quantity Calculation", () => {
//   it("should calculate minimum quantity: Math.ceil(10/7) = 2", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 7;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     expect(minQty).toBe(2);
//   });

//   it("should calculate minimum quantity: Math.ceil(10/10) = 1", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 10;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     expect(minQty).toBe(1);
//   });

//   it("should calculate minimum quantity: Math.ceil(10/3) = 4", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 3;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     expect(minQty).toBe(4);
//   });

//   it("should calculate minimum quantity: Math.ceil(15/7) = 3", () => {
//     const effectiveWeight = 15;
//     const itemMaxWeight = 7;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     expect(minQty).toBe(3);
//   });

//   it("should handle exact division: Math.ceil(10/5) = 2", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 5;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     expect(minQty).toBe(2);
//   });
// });

// describe("Weight Validation", () => {
//   it("should accept weight at exact lower bound", () => {
//     const minWeight = 5;
//     const maxWeight = 10;
//     const weight = 5;
//     expect(weight >= minWeight && weight <= maxWeight).toBe(true);
//   });

//   it("should accept weight at exact upper bound", () => {
//     const minWeight = 5;
//     const maxWeight = 10;
//     const weight = 10;
//     expect(weight >= minWeight && weight <= maxWeight).toBe(true);
//   });

//   it("should accept weight within range", () => {
//     const minWeight = 5;
//     const maxWeight = 10;
//     const weight = 7;
//     expect(weight >= minWeight && weight <= maxWeight).toBe(true);
//   });

//   it("should reject weight below minimum", () => {
//     const minWeight = 5;
//     const maxWeight = 10;
//     const weight = 4;
//     expect(weight >= minWeight && weight <= maxWeight).toBe(false);
//   });

//   it("should reject weight above maximum", () => {
//     const minWeight = 5;
//     const maxWeight = 10;
//     const weight = 11;
//     expect(weight >= minWeight && weight <= maxWeight).toBe(false);
//   });
// });

// describe("Quantity Enforcement", () => {
//   it("should auto-assign quantity to minimum when not provided", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 7;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     const quantity = undefined;
//     const resolvedQty = quantity ?? minQty;
//     expect(resolvedQty).toBe(2);
//   });

//   it("should accept quantity equal to minimum", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 7;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     const quantity = 2;
//     expect(quantity >= minQty).toBe(true);
//   });

//   it("should accept quantity greater than minimum", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 7;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     const quantity = 5;
//     expect(quantity >= minQty).toBe(true);
//   });

//   it("should reject quantity less than minimum", () => {
//     const effectiveWeight = 10;
//     const itemMaxWeight = 7;
//     const minQty = Math.ceil(effectiveWeight / itemMaxWeight);
//     const quantity = 1;
//     expect(quantity >= minQty).toBe(false);
//   });

//   it("should require quantity for non-capacity items", () => {
//     const maxWeight = null;
//     const quantity = undefined;
//     const isRequired = maxWeight === null;
//     expect(isRequired).toBe(true);
//     expect(quantity === undefined || quantity === null).toBe(true);
//   });
// });
