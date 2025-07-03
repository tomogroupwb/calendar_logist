import { LogisticsOrder, SheetsData, LogisticsGoogleSheetsConfig } from '../types';
import { getConfigById, getAllConfigs } from './sheetsConfigService';
import { getDepartmentColor } from './colorMap';
import { getAccessToken, isTokenExpired, clearToken, verifyAndRefreshToken } from './googleSheetsService';

const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

/**
 * Получение данных заказов логиста из Google Sheets
 */
export const fetchLogisticsData = async (): Promise<LogisticsOrder[]> => {
  const configs = getAllConfigs();
  
  if (configs.length === 0) {
    console.log('Нет сохраненных конфигураций Google таблиц');
    return import.meta.env.DEV ? getMockLogisticsData() : [];
  }
  
  const configIds = configs.map((config) => config.id);
  return fetchLogisticsDataFromMultipleConfigs(configIds);
};

/**
 * Получение данных из нескольких конфигураций
 */
export const fetchLogisticsDataFromMultipleConfigs = async (configIds: string[]): Promise<LogisticsOrder[]> => {
  console.log(`Загружаем данные из ${configIds.length} конфигураций:`, configIds);
  
  const allOrders: LogisticsOrder[] = [];
  
  for (const configId of configIds) {
    try {
      const orders = await fetchLogisticsDataFromConfig(configId);
      allOrders.push(...orders);
      console.log(`Загружено ${orders.length} заказов из конфигурации ${configId}`);
    } catch (error) {
      console.error(`Ошибка при загрузке данных из конфигурации ${configId}:`, error);
    }
  }
  
  console.log(`Всего загружено ${allOrders.length} заказов из всех конфигураций`);
  return allOrders;
};

/**
 * Получение данных из конкретной конфигурации
 */
export const fetchLogisticsDataFromConfig = async (configId: string): Promise<LogisticsOrder[]> => {
  console.log(`Начинаем загрузку данных для configId: ${configId}`);
  
  // Проверяем токен
  const accessToken = getAccessToken();
  if (accessToken && isTokenExpired()) {
    const refreshSuccess = await verifyAndRefreshToken();
    if (!refreshSuccess) {
      clearToken();
      throw new Error('Требуется повторная авторизация OAuth');
    }
  }
  
  const config = getConfigById(configId) as unknown as LogisticsGoogleSheetsConfig;
  
  if (!config) {
    console.error(`Конфигурация с ID ${configId} не найдена`);
    return [];
  }
  
  const { spreadsheetId, sheetName } = config;
  
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`);
  
  const params = new URLSearchParams({
    key: API_KEY,
    majorDimension: 'ROWS',
    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING'
  });
  
  url.search = params.toString();
  
  const headers: HeadersInit = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  try {
    const response = await fetch(url.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: SheetsData = await response.json();
    return transformLogisticsData(data, config);
  } catch (error) {
    console.error('Ошибка при получении данных из Google Sheets:', error);
    throw error;
  }
};

/**
 * Трансформация данных из Google Sheets в заказы логиста
 */
const transformLogisticsData = (data: SheetsData, config: LogisticsGoogleSheetsConfig): LogisticsOrder[] => {
  if (!data.values || data.values.length === 0) {
    console.log('Нет данных в таблице');
    return [];
  }
  
  const colToIndex = (col: string): number => col.charCodeAt(0) - 65;
  const orders: LogisticsOrder[] = [];
  
  const {
    order1CColumn,
    supplierOrderNumberColumn,
    supplierColumn,
    departmentColumn,
    cityColumn,
    supplierOrderLinkColumn,
    declaredReadyDateColumn,
    desiredDeliveryDateColumn,
    quantityColumn,
    weightColumn,
    volumeColumn
  } = config.columnMappings;
  
  data.values.forEach((row, index) => {
    try {
      const order1C = row[colToIndex(order1CColumn)];
      const supplierOrderNumber = row[colToIndex(supplierOrderNumberColumn)];
      const supplier = row[colToIndex(supplierColumn)];
      const department = row[colToIndex(departmentColumn)];
      const city = row[colToIndex(cityColumn)];
      const supplierOrderLink = row[colToIndex(supplierOrderLinkColumn)];
      const declaredReadyDate = row[colToIndex(declaredReadyDateColumn)];
      const desiredDeliveryDate = row[colToIndex(desiredDeliveryDateColumn)];
      const quantity = row[colToIndex(quantityColumn)];
      const weight = row[colToIndex(weightColumn)];
      const volume = row[colToIndex(volumeColumn)];
      
      // Пропускаем строки без основных данных
      if (!order1C || !supplier || !declaredReadyDate) {
        return;
      }
      
      // Форматируем дату
      let formattedDate = declaredReadyDate;
      if (declaredReadyDate && declaredReadyDate.includes('.')) {
        const [day, month, year] = declaredReadyDate.split('.');
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      let formattedDesiredDate = desiredDeliveryDate;
      if (desiredDeliveryDate && desiredDeliveryDate.includes('.')) {
        const [day, month, year] = desiredDeliveryDate.split('.');
        formattedDesiredDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      const orderData: LogisticsOrder = {
        id: `${config.name}-order-${index}`,
        title: `${supplier}: ${order1C}`,
        date: formattedDate,
        desiredDate: formattedDesiredDate,
        order1C: order1C || '',
        supplierOrderNumber: supplierOrderNumber || '',
        supplier: supplier || '',
        department: department || '',
        city: city || '',
        supplierOrderLink: supplierOrderLink || '',
        quantity: quantity || '',
        weight: weight || '',
        volume: volume || '',
        configId: config.id,
      };
      
      orders.push(orderData);
    } catch (error) {
      console.error(`Ошибка при обработке строки ${index}:`, error);
    }
  });
  
  return orders;
};

/**
 * Мок данные для разработки
 */
export const getMockLogisticsData = (): LogisticsOrder[] => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  return [
    {
      id: '1',
      title: 'ООО Поставщик 1: ЗАК-001',
      date: today.toISOString().split('T')[0],
      desiredDate: tomorrow.toISOString().split('T')[0],
      order1C: 'ЗАК-001',
      supplierOrderNumber: 'ПОС-12345',
      supplier: 'ООО Поставщик 1',
      department: 'Отдел закупок',
      city: 'Москва',
      supplierOrderLink: 'https://supplier1.com/order/12345',
      quantity: '5',
      weight: '25.5',
      volume: '0.8',
    },
    {
      id: '2',
      title: 'ИП Поставщик 2: ЗАК-002',
      date: tomorrow.toISOString().split('T')[0],
      order1C: 'ЗАК-002',
      supplierOrderNumber: 'ПОС-67890',
      supplier: 'ИП Поставщик 2',
      department: 'Отдел закупок',
      city: 'Санкт-Петербург',
      quantity: '3',
      weight: '12.0',
      volume: '0.4',
    },
    {
      id: '3',
      title: 'ООО Поставщик 3: ЗАК-003',
      date: nextWeek.toISOString().split('T')[0],
      order1C: 'ЗАК-003',
      supplierOrderNumber: 'ПОС-11111',
      supplier: 'ООО Поставщик 3',
      department: 'Отдел логистики',
      city: 'Екатеринбург',
      supplierOrderLink: 'https://supplier3.com/order/11111',
      quantity: '10',
      weight: '45.2',
      volume: '1.2',
    },
  ];
}; 