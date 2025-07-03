import { LogisticsOrder, LogisticsStats } from '../types';

export const calculateLogisticsStats = (orders: LogisticsOrder[]): LogisticsStats => {
  const stats: LogisticsStats = {
    totalOrders: orders.length,
    supplierBreakdown: {},
    cityBreakdown: {},
    departmentBreakdown: {},
  };

  orders.forEach(order => {
    // Подсчет по поставщикам
    if (order.supplier) {
      stats.supplierBreakdown[order.supplier] = (stats.supplierBreakdown[order.supplier] || 0) + 1;
    }

    // Подсчет по городам
    if (order.city) {
      stats.cityBreakdown[order.city] = (stats.cityBreakdown[order.city] || 0) + 1;
    }

    // Подсчет по подразделениям
    if (order.department) {
      stats.departmentBreakdown[order.department] = (stats.departmentBreakdown[order.department] || 0) + 1;
    }
  });

  return stats;
}; 