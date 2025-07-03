import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import { LogisticsOrder, LogisticsFilterOptions } from '../../types';
import LogisticsOrderModal from './LogisticsOrderModal';
import { getDepartmentColor } from '../../utils/colorMap';

interface LogisticsCalendarProps {
  orders: LogisticsOrder[];
  onOrdersUpdate: (orders: LogisticsOrder[]) => void;
  filters: LogisticsFilterOptions;
}

const LogisticsCalendar: React.FC<LogisticsCalendarProps> = ({
  orders,
  onOrdersUpdate,
  filters
}) => {
  const [selectedOrder, setSelectedOrder] = useState<LogisticsOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<'dayGridMonth' | 'timeGridWeek' | 'listWeek'>('dayGridMonth');
  const calendarRef = useRef<FullCalendar>(null);

  // Эффект для автоматического переключения на месяц первого найденного заказа
  useEffect(() => {
    if (filters.searchText && orders.length > 0 && calendarRef.current) {
      // Получаем все заказы с желаемой датой поступления
      const ordersWithDesiredDate = orders.filter(order => order.desiredDate);
      
      if (ordersWithDesiredDate.length > 0) {
        // Получаем уникальные месяцы из найденных заказов
        const uniqueMonths = new Set(
          ordersWithDesiredDate.map(order => {
            const date = new Date(order.desiredDate!);
            return `${date.getFullYear()}-${date.getMonth()}`;
          })
        );
        
        // Переключаем календарь только если все найденные заказы в одном месяце
        if (uniqueMonths.size === 1) {
          const targetDate = new Date(ordersWithDesiredDate[0].desiredDate!);
          const calendarApi = calendarRef.current.getApi();
          calendarApi.gotoDate(targetDate);
        }
        // Если заказы в разных месяцах, оставляем календарь на текущем месяце
      }
    }
  }, [filters.searchText, orders]);

  const calendarEvents = orders
    .filter(order => order.desiredDate)
    .map(order => ({
      id: order.id,
      title: `${order.supplierOrderNumber || ''} - ${order.order1C || ''}`,
      date: order.desiredDate,
      extendedProps: {
        order: order,
        supplier: order.supplier,
        city: order.city,
        department: order.department,
        order1C: order.order1C,
        supplierOrderNumber: order.supplierOrderNumber,
        desiredDate: order.desiredDate,
        supplierOrderLink: order.supplierOrderLink
      },
      className: `logistics-order supplier-${order.supplier.replace(/\s+/g, '-').toLowerCase()}`
    }));

  const handleEventClick = (clickInfo: any) => {
    const order = clickInfo.event.extendedProps.order;
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleOrderUpdate = (updatedOrder: LogisticsOrder) => {
    const updatedOrders = orders.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    );
    onOrdersUpdate(updatedOrders);
    handleCloseModal();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Календарь заказов логиста
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          <span>Всего заказов: {orders.length}</span>
          {filters.supplier && <span>• Поставщик: {filters.supplier}</span>}
          {filters.city && <span>• Город: {filters.city}</span>}
          {filters.department && (
            <span>• Подразделение: {filters.department}</span>
          )}
        </div>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
        initialView={activeView}
        locale={ruLocale}
        ref={calendarRef}
        events={calendarEvents}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listWeek'
        }}
        height="auto"
        eventDisplay="block"
        dayMaxEvents={true}
        moreLinkClick="popover"
        eventContent={(eventInfo) => {
          const { order } = eventInfo.event.extendedProps;
          const departmentColor = getDepartmentColor(order.department);
          
          return (
            <div style={{ 
              lineHeight: '1.2', 
              fontSize: '0.8em', 
              padding: '4px 6px',
              backgroundColor: `${departmentColor}10`, 
              borderRadius: '4px',
              margin: '1px 0',
              border: `1px solid ${departmentColor}30`,
              borderLeft: `3px solid ${departmentColor}`,
              minHeight: '45px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{ 
                fontWeight: '700', 
                color: '#1f2937', 
                fontSize: '0.85em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {order.supplierOrderNumber || 'Без номера'}
              </div>
              <div style={{ 
                color: '#4b5563', 
                fontSize: '0.8em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {order.order1C || 'Без заказа 1С'}
              </div>
              <div style={{ 
                color: departmentColor, 
                fontSize: '0.75em', 
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {order.department || 'Без подразделения'}
              </div>
            </div>
          );
        }}
        eventDidMount={(info) => {
          const order = info.event.extendedProps.order;
          info.el.title = `
Желаемая дата поступления: ${order.desiredDate}
Заявленная дата готовности: ${order.date}
Заказ 1С: ${order.order1C}
Поставщик: ${order.supplier}
Город: ${order.city}
Подразделение: ${order.department}
${order.supplierOrderNumber ? `№ заказа поставщика: ${order.supplierOrderNumber}` : ''}
          `.trim();
        }}
        viewDidMount={(info) => {
          setActiveView(info.view.type as 'dayGridMonth' | 'timeGridWeek' | 'listWeek');
        }}
      />

      {isModalOpen && selectedOrder && (
        <LogisticsOrderModal
          order={selectedOrder}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default LogisticsCalendar; 