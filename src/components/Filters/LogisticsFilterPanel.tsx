import React from 'react';
import { LogisticsFilterOptions } from '../../types';

interface LogisticsFilterPanelProps {
  filters: LogisticsFilterOptions;
  suppliers: string[];
  cities: string[];
  departments: string[];
  onFilterChange: (filterName: keyof LogisticsFilterOptions, value: string | string[] | null) => void;
}

const LogisticsFilterPanel: React.FC<LogisticsFilterPanelProps> = ({
  filters,
  suppliers,
  cities,
  departments,
  onFilterChange
}) => {
  const handleClearFilters = () => {
    onFilterChange('supplier', null);
    onFilterChange('city', null);
    onFilterChange('department', null);
    onFilterChange('startDate', null);
    onFilterChange('endDate', null);
    onFilterChange('searchText', null);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Поиск
        </label>
        <input
          type="text"
          value={filters.searchText || ''}
          onChange={(e) => onFilterChange('searchText', e.target.value || null)}
          placeholder="Поиск по номеру заказа, поставщику, подразделению..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Фильтр по поставщику */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Поставщик
          </label>
          <select
            value={filters.supplier || ''}
            onChange={(e) => onFilterChange('supplier', e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все поставщики</option>
            {suppliers.map(supplier => (
              <option key={supplier} value={supplier}>{supplier}</option>
            ))}
          </select>
        </div>

        {/* Фильтр по городу */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Город
          </label>
          <select
            value={filters.city || ''}
            onChange={(e) => onFilterChange('city', e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все города</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Фильтр по подразделению */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Подразделение
          </label>
          <select
            value={filters.department || ''}
            onChange={(e) => onFilterChange('department', e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все подразделения</option>
            {departments.map(department => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
        </div>

        {/* Фильтр по дате начала */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата с
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Фильтр по дате окончания */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата до
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {filters.searchText && <span className="mr-4">Поиск: "{filters.searchText}"</span>}
          {filters.supplier && <span className="mr-4">Поставщик: {filters.supplier}</span>}
          {filters.city && <span className="mr-4">Город: {filters.city}</span>}
          {filters.department && (
            <span className="mr-4">Подразделение: {filters.department}</span>
          )}
          {(filters.startDate || filters.endDate) && (
            <span className="mr-4">
              Период: {filters.startDate || '...'} — {filters.endDate || '...'}
            </span>
          )}
        </div>
        
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Очистить фильтры
        </button>
      </div>
    </div>
  );
};

export default LogisticsFilterPanel; 