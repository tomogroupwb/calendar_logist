// Интерфейс для заказов логиста
export interface LogisticsOrder {
  id: string;
  title: string;
  date: string; // Заявленная дата готовности заказа
  desiredDate?: string; // Желаемая дата поступления
  order1C: string; // Заказ 1С
  supplierOrderNumber: string; // № Заказа (Поставщик)
  supplier: string; // Поставщик
  department: string; // Подразделение
  city: string; // Город
  supplierOrderLink?: string; // Ссылка (Заказ Поставщика)
  quantity?: string; // Количество мест
  weight?: string; // Вес (кг)
  volume?: string; // Объем
  configId?: string;
}

// Для обратной совместимости (можно удалить позже)
export interface DeliveryEvent {
  id: string;
  title: string;
  date: string;
  marketplace: Marketplace;
  warehouse: string;
  department: string;
  itemCount: number;
  realizationNumber?: string;
  configId?: string;
  deliveryNumber?: string;
  transitWarehouse?: string;
}

export type Marketplace = 'Ozon' | 'Wildberries' | 'Яндекс.Маркет';

// Обновленные фильтры для логистики
export interface LogisticsFilterOptions {
  supplier: string | null;
  city: string | null;
  department: string | null;
  startDate: string | null;
  endDate: string | null;
  searchText: string | null;
}

// Старые фильтры для обратной совместимости
export interface FilterOptions {
  marketplace: string | null;
  warehouse: string | null;
  department: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CalendarViewState {
  activeView: 'dayGridMonth' | 'timeGridWeek' | 'listWeek';
}

export interface SheetsData {
  values: string[][];
}

// Статистика для логистики
export interface LogisticsStats {
  totalOrders: number;
  supplierBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
}

// Старая статистика для обратной совместимости
export interface DeliveryStats {
  totalDeliveries: number;
  totalItems: number;
  marketplaceBreakdown: Record<string, number>;
  departmentBreakdown: Record<string, number>;
}

// Обновленная конфигурация для логистики
export interface LogisticsGoogleSheetsConfig {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  userId?: string;
  columnMappings: {
    order1CColumn: string; // Заказ 1С
    supplierOrderNumberColumn: string; // № Заказа (Поставщик)
    supplierColumn: string; // Поставщик
    departmentColumn: string; // Подразделение
    cityColumn: string; // Город
    supplierOrderLinkColumn: string; // Ссылка (Заказ Поставщика)
    declaredReadyDateColumn: string; // Заявленная дата готовности заказа
    desiredDeliveryDateColumn: string; // Желаемая дата поступления
    quantityColumn: string; // Количество мест
    weightColumn: string; // Вес (кг)
    volumeColumn: string; // Объем
  };
}

// Старая конфигурация для обратной совместимости
export interface GoogleSheetsConfig {
  id: string;
  name: string;
  spreadsheetId: string;
  sheetName: string;
  userId?: string;
  columnMappings: {
    dateColumn: string;
    marketplaceColumn: string;
    warehouseColumn: string;
    departmentColumn: string;
    itemCountColumn: string;
    realizationNumberColumn: string;
    deliveryNumberColumn: string;
    transitWarehouseColumn: string;
  };
}

export interface AuthState {
  isLoggedIn: boolean;
  user: GoogleUser | null;
  authProvider: 'google' | null;
}

export interface GoogleUser {
  id?: string;
  email?: string;
  name?: string;
  access_token: string;
  uid?: never; // Для защиты от ошибок типизации
}