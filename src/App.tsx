import React, { useEffect, useState, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DeliveryEvent, FilterOptions, GoogleSheetsConfig, AuthState, LogisticsOrder, LogisticsFilterOptions } from './types';
import { calculateDeliveryStats } from './utils/statsCalculator';
import { calculateLogisticsStats } from './utils/logisticsStatsCalculator';
import { 
  fetchDeliveryData, 
  fetchDeliveryDataFromMultipleConfigs,
  getAccessToken, 
  isTokenExpired, 
  clearToken,
  startAutoRefresh,
  stopAutoRefresh,
  isAutoRefreshActive
} from './utils/googleSheetsService';
import { 
  fetchLogisticsData, 
  fetchLogisticsDataFromMultipleConfigs 
} from './utils/logisticsService';
import { getAllConfigs } from './utils/sheetsConfigService';
import DeliveryCalendar from './components/Calendar/DeliveryCalendar';
import FilterPanel from './components/Filters/FilterPanel';
import DeliveryStats from './components/Stats/DeliveryStats';
import LogisticsCalendar from './components/Calendar/LogisticsCalendar';
import LogisticsFilterPanel from './components/Filters/LogisticsFilterPanel';
import LogisticsStats from './components/Stats/LogisticsStats';
import Header from './components/Layout/Header';
import LoadingSpinner from './components/Layout/LoadingSpinner';
import AuthSelector from './components/Auth/AuthSelector';
import ConfigPage, { AuthProvider } from './components/Config/ConfigPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  // Состояние для заказов логиста
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  // Старое состояние для обратной совместимости
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'calendar' | 'config'>('calendar');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [activeConfigIds, setActiveConfigIds] = useState<string[]>([]);
  
  // Состояние аутентификации
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    authProvider: null
  });
  
  // Инициализация состояния на основе существующих токенов/сессий
  useEffect(() => {
    // Проверяем наличие токена Google OAuth
    const hasGoogleToken = !!getAccessToken();
    if (hasGoogleToken && !isTokenExpired()) {
      const token = getAccessToken();
      if (token) {
        setAuthState({
          isLoggedIn: true,
          user: { access_token: token },
          authProvider: 'google'
        });
      }
    }
  }, []);
  
  // Фильтры для логистики
  const [logisticsFilters, setLogisticsFilters] = useState<LogisticsFilterOptions>({
    supplier: null,
    city: null,
    department: null,
    startDate: null,
    endDate: null,
    searchText: null,
  });
  
  // Старые фильтры для обратной совместимости
  const [filters, setFilters] = useState<FilterOptions>({
    marketplace: null,
    warehouse: null,
    department: null,
    startDate: null,
    endDate: null,
  });
  
  // Состояние для хранения конфигураций
  const [sheetsConfigs, setSheetsConfigs] = useState<GoogleSheetsConfig[]>([]);
  
  // Хелпер-функция для нормализации названий подразделений
  const normalizeDepartment = (dept: string): string => {
    if (!dept) return ''; // Возвращаем пустую строку, если исходная пуста
    let normalized = dept.toLowerCase();

    // Стандартизация названий маркетплейсов
    normalized = normalized.replace(/\bвайлдбериз\b/g, 'вайлдберриз');
    normalized = normalized.replace(/\bwildberries\b/g, 'вайлдберриз');
    normalized = normalized.replace(/\bwb\b/g, 'вайлдберриз'); 
    normalized = normalized.replace(/\bozon\b/g, 'озон');
    // Добавьте сюда другие варианты, которые вы встречаете

    const marketplaceRegex = /\(([^)]+)\)/; // Ищет текст в скобках (любой)
    const match = normalized.match(marketplaceRegex);
    
    let coreName = normalized.replace(marketplaceRegex, '').trim();
    let marketplace = '';

    if (match && match[1]) {
      // Если в скобках было название маркетплейса, используем его
      const bracketContent = match[1].trim();
      if (bracketContent === 'вайлдберриз' || bracketContent === 'озон') {
        marketplace = bracketContent;
      }
      // Если в скобках было что-то другое, оно останется в coreName, а marketplace пока пуст
    }
    
    // Убираем слова "вайлдберриз", "озон" из coreName, если они там есть, и лишние пробелы
    coreName = coreName.replace(/\bвайлдберриз\b/g, '').replace(/\bозон\b/g, '').replace(/\s+/g, ' ').trim();

    // Если маркетплейс еще не определен (не был в скобках или в скобках было не то)
    // пытаемся найти его в исходной строке (которая уже normalized)
    if (!marketplace) {
      if (normalized.includes('вайлдберриз')) {
        marketplace = 'вайлдберриз';
      } else if (normalized.includes('озон')) {
        marketplace = 'озон';
      }
    }
    
    coreName = coreName.replace(/\s+/g, ' ').trim(); // Финальная чистка coreName

    if (coreName && marketplace) {
      return `${coreName} (${marketplace})`;
    } else if (coreName) {
      return coreName; // Если есть только основное имя
    } else if (marketplace) {
      // Если было только что-то типа "(Вайлдберриз)" или просто "вайлдберриз" без основного имени
      return marketplace; // Возвращаем просто маркетплейс (можно обернуть в скобки, если хотите)
    }
    // Если совсем ничего не вышло (например, пустая строка или только знаки препинания), 
    // возвращаем исходную строку, приведенную к нижнему регистру и очищенную от лишних пробелов.
    return dept.toLowerCase().trim(); 
  };
  
  // Уникальные значения для фильтров логистики
  const suppliers = [...new Set(orders.map(order => order.supplier))].sort((a, b) => a.localeCompare(b));
  const cities = [...new Set(orders
    .filter(order => !logisticsFilters.supplier || order.supplier === logisticsFilters.supplier)
    .map(order => order.city)
  )];
  // Применяем нормализацию и сортировку к подразделениям
  const logisticsDepartments = [...new Set(orders.map(order => normalizeDepartment(order.department)))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  
  // Старые значения для обратной совместимости
  const marketplaces = [...new Set(events.map(event => event.marketplace))];
  const warehouses = [...new Set(events
    .filter(event => !filters.marketplace || event.marketplace === filters.marketplace)
    .map(event => event.warehouse)
  )];
  const departments = [...new Set(events.map(event => event.department))];
  
  // Фильтрация заказов логиста
  const filteredOrders = orders.filter(order => {
    if (logisticsFilters.supplier && order.supplier !== logisticsFilters.supplier) return false;
    if (logisticsFilters.city && order.city !== logisticsFilters.city) return false;
    
    // Фильтрация по подразделению (одиночный выбор, с нормализацией)
    // Сравниваем выбранное в фильтре значение (оно уже нормализовано при создании списка logisticsDepartments)
    // с нормализованным значением из текущего заказа.
    if (logisticsFilters.department && normalizeDepartment(order.department) !== logisticsFilters.department) return false;
    
    // Фильтрация по поисковому запросу
    if (logisticsFilters.searchText) {
      const searchText = logisticsFilters.searchText.toLowerCase();
      const searchableText = [
        order.order1C,
        order.supplierOrderNumber,
        order.supplier,
        order.department,
        order.city
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchText)) return false;
    }
    
    // Фильтрация по периоду дат
    if (logisticsFilters.startDate || logisticsFilters.endDate) {
      const orderDate = new Date(order.date);
      
      if (logisticsFilters.startDate) {
        const startDate = new Date(logisticsFilters.startDate);
        if (orderDate < startDate) return false;
      }
      
      if (logisticsFilters.endDate) {
        const endDate = new Date(logisticsFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (orderDate > endDate) return false;
      }
    }
    
    return true;
  });
  
  const logisticsStats = calculateLogisticsStats(filteredOrders);
  
  // Старая фильтрация для обратной совместимости
  const filteredEvents = events.filter(event => {
    if (filters.marketplace && event.marketplace !== filters.marketplace) return false;
    if (filters.warehouse && event.warehouse !== filters.warehouse) return false;
    
    if (filters.department && filters.department.length > 0) {
      if (!filters.department.includes(event.department)) return false;
    }
    
    if (filters.startDate || filters.endDate) {
      const eventDate = new Date(event.date);
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (eventDate < startDate) return false;
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (eventDate > endDate) return false;
      }
    }
    
    return true;
  });
  
  const stats = calculateDeliveryStats(filteredEvents);
  
  // Загрузка конфигураций в зависимости от провайдера аутентификации
  useEffect(() => {
    const loadConfigs = async () => {
      if (!authState.isLoggedIn) return;
      
      try {
        let configs: GoogleSheetsConfig[] = [];
        
        // Загружаем конфигурации только из localStorage
        configs = getAllConfigs();
        
        setSheetsConfigs(configs);
      } catch (error) {
        console.error('Ошибка при загрузке конфигураций:', error);
      }
    };
    
    loadConfigs();
  }, [authState.isLoggedIn]);
  
  // Функция обновления данных логиста
  const refreshLogisticsData = useCallback(async () => {
    if (!authState.isLoggedIn) return;
    
    setIsLoading(true);
    try {
      let data;
      if (activeConfigIds.length > 0) {
        data = await fetchLogisticsDataFromMultipleConfigs(activeConfigIds);
        console.log(`Данные логиста обновлены из ${activeConfigIds.length} активных конфигураций:`, data);
      } else {
        data = await fetchLogisticsData();
        console.log('Данные логиста обновлены из всех доступных конфигураций:', data);
      }
      setOrders(data);
    } catch (error) {
      console.error('Ошибка при обновлении данных логиста:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authState.isLoggedIn, activeConfigIds]);
  
  // Старая функция для обратной совместимости
  const refreshData = useCallback(async () => {
    if (!authState.isLoggedIn) return;
    
    setIsLoading(true);
    try {
      let data;
      if (activeConfigIds.length > 0) {
        data = await fetchDeliveryDataFromMultipleConfigs(activeConfigIds);
        console.log(`Данные обновлены из ${activeConfigIds.length} активных конфигураций:`, data);
      } else {
        data = await fetchDeliveryData();
        console.log('Данные обновлены из всех доступных конфигураций:', data);
      }
      setEvents(data);
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authState.isLoggedIn, activeConfigIds]);
  
  // Функция для загрузки данных логиста из выбранных конфигураций
  const fetchLogisticsFromConfigs = useCallback(async (configIds: string[]) => {
    if (!authState.isLoggedIn || configIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const data = await fetchLogisticsDataFromMultipleConfigs(configIds);
      console.log(`Данные логиста загружены из ${configIds.length} конфигураций:`, data);
      setOrders(data);
      
      setActiveConfigIds(configIds);
      setCurrentPage('calendar');
    } catch (error) {
      console.error('Ошибка при загрузке данных логиста из конфигураций:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authState.isLoggedIn]);
  
  // Старая функция для обратной совместимости
  const fetchFromConfigs = useCallback(async (configIds: string[]) => {
    if (!authState.isLoggedIn || configIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const data = await fetchDeliveryDataFromMultipleConfigs(configIds);
      console.log(`Данные загружены из ${configIds.length} конфигураций:`, data);
      setEvents(data);
      
      setActiveConfigIds(configIds);
      setCurrentPage('calendar');
    } catch (error) {
      console.error('Ошибка при загрузке данных из конфигураций:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authState.isLoggedIn]);
  
  // Функция для включения/отключения автообновления
  const toggleAutoRefresh = useCallback(() => {
    if (isAutoRefreshActive()) {
      stopAutoRefresh();
      setAutoRefreshEnabled(false);
      console.log('Автообновление отключено пользователем');
    } else {
      startAutoRefresh((updatedData) => {
        console.log('Получены обновленные данные:', updatedData);
        setEvents(updatedData);
        // TODO: Добавить автообновление для логистики
      }, 60000, activeConfigIds);
      setAutoRefreshEnabled(true);
      console.log('Автообновление включено пользователем');
    }
  }, [activeConfigIds]);
  
  // Запускаем автообновление данных при успешной авторизации
  useEffect(() => {
    if (authState.isLoggedIn) {
      // Запускаем начальную загрузку данных логиста
      refreshLogisticsData();
      
      setAutoRefreshEnabled(isAutoRefreshActive());
    } else {
      stopAutoRefresh();
      setAutoRefreshEnabled(false);
      setIsLoading(false);
    }
    
    return () => {
      stopAutoRefresh();
    };
  }, [authState.isLoggedIn, refreshLogisticsData]);
  
  // Обработчик фильтров логистики
  const handleLogisticsFilterChange = (filterName: keyof LogisticsFilterOptions, value: string | string[] | null) => {
    if (filterName === 'supplier') {
      setLogisticsFilters(prev => ({
        ...prev,
        supplier: value as string | null,
        city: null, // Сбрасываем город при изменении поставщика
      }));
    } else if (filterName === 'city') {
      setLogisticsFilters(prev => ({
        ...prev,
        city: value as string | null,
      }));
    } else if (filterName === 'department') {
      setLogisticsFilters(prev => ({
        ...prev,
        department: value as string | null,
      }));
    } else if (filterName === 'searchText') {
      setLogisticsFilters(prev => ({
        ...prev,
        searchText: value as string | null,
      }));
    } else {
      setLogisticsFilters(prev => ({
        ...prev,
        [filterName]: value as string | null,
      }));
    }
  };
  
  // Старый обработчик для обратной совместимости
  const handleFilterChange = (filterName: keyof FilterOptions, value: string | null) => {
    if (filterName === 'marketplace') {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
        warehouse: null,
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterName]: value,
      }));
    }
  };
  
  const handleEventsUpdate = (updatedEvents: DeliveryEvent[]) => {
    setEvents(updatedEvents);
  };
  
  const handleLoginSuccess = (user: any) => {
    // Определяем провайдера по наличию access_token
    if (user.access_token) { // Это Google Provider
      setAuthState({
        isLoggedIn: true,
        user: { access_token: user.access_token },
        authProvider: 'google'
      });
      // Сохраняем токен и метку времени
      localStorage.setItem('google_access_token', user.access_token);
      localStorage.setItem('google_auth_timestamp', new Date().getTime().toString());
      if (user.refresh_token) {
        localStorage.setItem('google_refresh_token', user.refresh_token);
      }
    } 
    // Ветка Firebase удалена, так как Firebase полностью удален из проекта
    setCurrentPage('calendar'); // Перенаправляем на календарь после входа
  };
  
  const handleLoginFailure = (error: any) => {
    console.error('Login failed:', error);
    alert('Ошибка авторизации. Пожалуйста, попробуйте снова.');
  };
  
  const handleLogout = () => {
    // Останавливаем автообновление при выходе из системы
    stopAutoRefresh();
    setAutoRefreshEnabled(false);
    
    // Очищаем активные конфигурации
    setActiveConfigIds([]);
    
    // Сбрасываем состояние аутентификации
    if (authState.authProvider === 'google') {
      clearToken();
    }
    
    // Устанавливаем состояние не аутентифицирован
    setAuthState({
      isLoggedIn: false,
      user: null,
      authProvider: null
    });
    
    // Очищаем данные событий при выходе из системы
    setEvents([]);
  };
  
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white shadow-card rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold mb-6">Configuration Error</h2>
          <p className="text-neutral-600">
            Google Client ID is not configured. Please set the VITE_GOOGLE_CLIENT_ID environment variable.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Header 
          isLoggedIn={authState.isLoggedIn} 
          onLogout={handleLogout}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={authState.isLoggedIn ? toggleAutoRefresh : undefined}
        />
        
        <main className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-8">
          {isLoading && <LoadingSpinner />}
          
          {!authState.isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <AuthSelector
                onLoginSuccess={handleLoginSuccess}
                onLoginFailure={handleLoginFailure}
              />
            </div>
          ) : (
            <>
              <div className="flex justify-between mb-3 sm:mb-4">
                <div className="flex-grow">
                  <nav className="inline-flex rounded-md shadow-sm">
                    <button
                      type="button"
                      onClick={() => setCurrentPage('calendar')}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
                        currentPage === 'calendar'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-neutral-600 hover:bg-neutral-50'
                      } border border-neutral-300 rounded-l-md focus:outline-none`}
                    >
                      Календарь
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage('config')}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${
                        currentPage === 'config'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-neutral-600 hover:bg-neutral-50'
                      } border border-neutral-300 rounded-r-md focus:outline-none`}
                    >
                      Настройка таблиц
                    </button>
                  </nav>
                </div>
              </div>
              
              {!isLoading && (
                <>
                  {currentPage === 'calendar' ? (
                    <>
                      <div className="mb-3 sm:mb-4">
                        <LogisticsFilterPanel
                          suppliers={suppliers}
                          cities={cities}
                          departments={logisticsDepartments}
                          filters={logisticsFilters}
                          onFilterChange={handleLogisticsFilterChange}
                        />
                      </div>
                      
                      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                        <div className="w-full lg:w-4/5">
                          <LogisticsCalendar
                            orders={filteredOrders}
                            onOrdersUpdate={setOrders}
                            filters={logisticsFilters}
                          />
                        </div>
                        
                        <div className="w-full lg:w-1/5 mt-3 lg:mt-0">
                          <LogisticsStats stats={logisticsStats} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <AuthProvider value={authState}>
                      <ConfigPage
                        onLoadFromConfigs={fetchLogisticsFromConfigs}
                        onBack={() => setCurrentPage('calendar')}
                      />
                    </AuthProvider>
                  )}
                </>
              )}
            </>
          )}
        </main>
        
        <footer className="bg-white border-t border-neutral-200 py-3 sm:py-4 mt-4 sm:mt-6">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <p className="text-center text-neutral-500 text-xs sm:text-sm">
              &copy; {new Date().getFullYear()} Календарь заказов логиста
            </p>
          </div>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;