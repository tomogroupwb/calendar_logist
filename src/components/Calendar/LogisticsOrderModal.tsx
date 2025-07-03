import React from 'react';
import { LogisticsOrder } from '../../types';

interface LogisticsOrderModalProps {
  order: LogisticsOrder;
  onClose: () => void;
}

const LogisticsOrderModal: React.FC<LogisticsOrderModalProps> = ({
  order,
  onClose
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Детали заказа
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Закрыть
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заказ 1С
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.order1C}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              № Заказа (Поставщик)
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.supplierOrderNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поставщик
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.supplier}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подразделение
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.department}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Город
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.city}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заявленная дата готовности
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{formatDate(order.date)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Желаемая дата поступления
            </label>
            <p className="p-2 bg-gray-50 rounded-md">
              {order.desiredDate ? formatDate(order.desiredDate) : 'Не указана'}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка (Заказ Поставщика)
            </label>
            <div className="p-2 bg-gray-50 rounded-md">
              {order.supplierOrderLink ? (
                <a
                  href={order.supplierOrderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {order.supplierOrderLink}
                </a>
              ) : (
                'Не указана'
              )}
            </div>
          </div>

          {/* Новые поля */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество мест
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.quantity || 'Не указано'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вес (кг)
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.weight || 'Не указан'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Объем
            </label>
            <p className="p-2 bg-gray-50 rounded-md">{order.volume || 'Не указан'}</p>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            Дополнительная информация
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">ID заказа:</span>
              <span className="ml-2 text-gray-800">{order.id}</span>
            </div>
            {order.configId && (
              <div>
                <span className="font-medium text-gray-600">ID конфигурации:</span>
                <span className="ml-2 text-gray-800">{order.configId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsOrderModal; 