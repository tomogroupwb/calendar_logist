import React from 'react';
import { LogisticsStats as LogisticsStatsType } from '../../types';

interface LogisticsStatsProps {
  stats: LogisticsStatsType;
}

const LogisticsStats: React.FC<LogisticsStatsProps> = ({ stats }) => {
  const topSuppliers = Object.entries(stats.supplierBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topCities = Object.entries(stats.cityBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topDepartments = Object.entries(stats.departmentBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Статистика заказов
      </h3>
      
      {/* Общая статистика */}
      <div className="mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalOrders}
          </div>
          <div className="text-sm text-blue-800">
            Всего заказов
          </div>
        </div>
      </div>

      {/* Топ поставщиков */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">
          Топ поставщиков
        </h4>
        <div className="space-y-2">
          {topSuppliers.length > 0 ? (
            topSuppliers.map(([supplier, count]) => (
              <div key={supplier} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                  {supplier}
                </span>
                <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                  {count}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Нет данных</p>
          )}
        </div>
      </div>

      {/* Топ городов */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">
          Топ городов
        </h4>
        <div className="space-y-2">
          {topCities.length > 0 ? (
            topCities.map(([city, count]) => (
              <div key={city} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                  {city}
                </span>
                <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                  {count}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Нет данных</p>
          )}
        </div>
      </div>

      {/* Топ подразделений */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-3">
          Топ подразделений
        </h4>
        <div className="space-y-2">
          {topDepartments.length > 0 ? (
            topDepartments.map(([department, count]) => (
              <div key={department} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                  {department}
                </span>
                <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                  {count}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Нет данных</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogisticsStats; 