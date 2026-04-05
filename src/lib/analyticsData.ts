export function buildAnalyticsData() {
  return {
    wasteTrend: [
      { month: 'Nov', value: 58 },
      { month: 'Dec', value: 54 },
      { month: 'Jan', value: 49 },
      { month: 'Feb', value: 42 },
      { month: 'Mar', value: 36 },
      { month: 'Apr', value: 28 }
    ],
    accuracyTrend: [
      { month: 'Nov', value: 83 },
      { month: 'Dec', value: 84 },
      { month: 'Jan', value: 86 },
      { month: 'Feb', value: 88 },
      { month: 'Mar', value: 90 },
      { month: 'Apr', value: 91 }
    ],
    spendByCategory: [
      { name: 'Produce', value: 1320 },
      { name: 'Dairy', value: 980 },
      { name: 'Meat', value: 1680 },
      { name: 'Dry goods', value: 1100 },
      { name: 'Beverages', value: 790 }
    ],
    grossMargin: [
      { category: 'Produce', before: 29, after: 34 },
      { category: 'Dairy', before: 24, after: 31 },
      { category: 'Meat', before: 31, after: 37 },
      { category: 'Dry goods', before: 36, after: 41 },
      { category: 'Beverages', before: 41, after: 45 }
    ]
  };
}
