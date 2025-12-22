import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'ro' | 'en' | 'hu' | 'de';

type TranslationKey = keyof typeof translations.ro;

const translations = {
  ro: {
    // General
    'app.title': 'Restaurant Management',
    'app.logout': 'Deconectare',
    'app.save': 'Salvează',
    'app.cancel': 'Anulează',
    'app.add': 'Adaugă',
    'app.edit': 'Editează',
    'app.delete': 'Șterge',
    'app.search': 'Căutare...',
    'app.confirm': 'Confirmă',
    'app.close': 'Închide',
    'app.back': 'Înapoi',
    'app.loading': 'Se încarcă...',
    'app.noData': 'Nu există date',
    'app.yes': 'Da',
    'app.no': 'Nu',
    
    // Login
    'login.title': 'Selectează contul',
    'login.pin': 'Introdu PIN-ul',
    'login.submit': 'Conectare',
    'login.error': 'PIN incorect',
    
    // Navigation
    'nav.tables': 'Mese',
    'nav.tableMap': 'Hartă Mese',
    'nav.orders': 'Comenzi',
    'nav.menu': 'Meniu',
    'nav.kds': 'KDS',
    'nav.reservations': 'Rezervări',
    'nav.delivery': 'Livrări',
    'nav.waiters': 'Ospătari',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Setări',
    
    // Tables
    'tables.title': 'Gestionare Mese',
    'tables.add': 'Adaugă masă',
    'tables.number': 'Număr masă',
    'tables.seats': 'Locuri',
    'tables.shape': 'Formă',
    'tables.position': 'Poziție',
    'tables.status': 'Status',
    'tables.free': 'Liberă',
    'tables.occupied': 'Ocupată',
    'tables.reserved': 'Rezervată',
    'tables.round': 'Rotundă',
    'tables.square': 'Pătrată',
    'tables.rectangle': 'Dreptunghiulară',
    
    // Menu
    'menu.title': 'Gestionare Meniu',
    'menu.add': 'Adaugă produs',
    'menu.name': 'Nume',
    'menu.description': 'Descriere',
    'menu.price': 'Preț (RON)',
    'menu.category': 'Categorie',
    'menu.prepTime': 'Timp preparare (min)',
    'menu.ingredients': 'Ingrediente',
    'menu.kdsStation': 'Stație KDS',
    'menu.platformPricing': 'Prețuri platforme',
    
    // Orders
    'orders.title': 'Comenzi',
    'orders.active': 'Active',
    'orders.completed': 'Finalizate',
    'orders.table': 'Masa',
    'orders.waiter': 'Ospătar',
    'orders.total': 'Total',
    'orders.status': 'Status',
    'orders.items': 'Produse',
    'orders.restaurant': 'Restaurant',
    'orders.delivery': 'Livrare',
    'orders.phone': 'Telefonic',
    
    // KDS
    'kds.title': 'Configurare KDS',
    'kds.station': 'Stație',
    'kds.products': 'produse',
    'kds.noOrders': 'Nu sunt comenzi active',
    'kds.start': 'Începe',
    'kds.ready': 'GATA',
    'kds.startAt': 'Începe la:',
    'kds.attention': 'ATENȚIE! Începe prepararea!',
    
    // Reservations
    'reservations.title': 'Gestionare Rezervări',
    'reservations.add': 'Adaugă rezervare',
    'reservations.customer': 'Client',
    'reservations.phone': 'Telefon',
    'reservations.date': 'Data',
    'reservations.time': 'Ora',
    'reservations.partySize': 'Persoane',
    'reservations.tables': 'Mese',
    'reservations.notes': 'Notițe',
    'reservations.pending': 'În așteptare',
    'reservations.confirmed': 'Confirmată',
    'reservations.arrived': 'Sosit',
    'reservations.cancelled': 'Anulată',
    
    // Delivery
    'delivery.title': 'Comenzi Livrare',
    'delivery.platforms': 'Platforme',
    'delivery.apiStatus': 'Status API',
    'delivery.connected': 'Conectat',
    'delivery.disconnected': 'Deconectat',
    'delivery.address': 'Adresă',
    'delivery.customer': 'Client',
    
    // Waiters
    'waiters.title': 'Gestionare Ospătari',
    'waiters.name': 'Nume',
    'waiters.pin': 'PIN',
    'waiters.ordersToday': 'Comenzi azi',
    'waiters.totalSales': 'Vânzări total',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.todaySales': 'Vânzări azi',
    'dashboard.ordersToday': 'Comenzi azi',
    'dashboard.avgOrder': 'Comandă medie',
    'dashboard.topProducts': 'Top produse',
    'dashboard.topWaiters': 'Top ospătari',
    
    // Waiter palmares
    'palmares.myOrders': 'Comenzile mele',
    'palmares.allTables': 'Toate mesele',
    'palmares.activeOrders': 'comenzi active',
    
    // Receipt
    'receipt.title': 'Bon fiscal',
    'receipt.print': 'Printează bon',
    'receipt.subtotal': 'Subtotal',
    'receipt.tip': 'Bacșiș',
    'receipt.total': 'TOTAL',
    'receipt.cui': 'CUI Client',
    'receipt.thankYou': 'Vă mulțumim!',
    
    // Notifications
    'notifications.title': 'Notificări',
    'notifications.markRead': 'Marchează citite',
    'notifications.clear': 'Șterge tot',
    'notifications.noNew': 'Nu sunt notificări noi',
  },
  en: {
    // General
    'app.title': 'Restaurant Management',
    'app.logout': 'Logout',
    'app.save': 'Save',
    'app.cancel': 'Cancel',
    'app.add': 'Add',
    'app.edit': 'Edit',
    'app.delete': 'Delete',
    'app.search': 'Search...',
    'app.confirm': 'Confirm',
    'app.close': 'Close',
    'app.back': 'Back',
    'app.loading': 'Loading...',
    'app.noData': 'No data available',
    'app.yes': 'Yes',
    'app.no': 'No',
    
    // Login
    'login.title': 'Select account',
    'login.pin': 'Enter PIN',
    'login.submit': 'Login',
    'login.error': 'Incorrect PIN',
    
    // Navigation
    'nav.tables': 'Tables',
    'nav.tableMap': 'Table Map',
    'nav.orders': 'Orders',
    'nav.menu': 'Menu',
    'nav.kds': 'KDS',
    'nav.reservations': 'Reservations',
    'nav.delivery': 'Delivery',
    'nav.waiters': 'Waiters',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Settings',
    
    // Tables
    'tables.title': 'Table Management',
    'tables.add': 'Add table',
    'tables.number': 'Table number',
    'tables.seats': 'Seats',
    'tables.shape': 'Shape',
    'tables.position': 'Position',
    'tables.status': 'Status',
    'tables.free': 'Free',
    'tables.occupied': 'Occupied',
    'tables.reserved': 'Reserved',
    'tables.round': 'Round',
    'tables.square': 'Square',
    'tables.rectangle': 'Rectangle',
    
    // Menu
    'menu.title': 'Menu Management',
    'menu.add': 'Add product',
    'menu.name': 'Name',
    'menu.description': 'Description',
    'menu.price': 'Price (RON)',
    'menu.category': 'Category',
    'menu.prepTime': 'Prep time (min)',
    'menu.ingredients': 'Ingredients',
    'menu.kdsStation': 'KDS Station',
    'menu.platformPricing': 'Platform pricing',
    
    // Orders
    'orders.title': 'Orders',
    'orders.active': 'Active',
    'orders.completed': 'Completed',
    'orders.table': 'Table',
    'orders.waiter': 'Waiter',
    'orders.total': 'Total',
    'orders.status': 'Status',
    'orders.items': 'Items',
    'orders.restaurant': 'Restaurant',
    'orders.delivery': 'Delivery',
    'orders.phone': 'Phone',
    
    // KDS
    'kds.title': 'KDS Configuration',
    'kds.station': 'Station',
    'kds.products': 'products',
    'kds.noOrders': 'No active orders',
    'kds.start': 'Start',
    'kds.ready': 'DONE',
    'kds.startAt': 'Start at:',
    'kds.attention': 'ATTENTION! Start cooking!',
    
    // Reservations
    'reservations.title': 'Reservation Management',
    'reservations.add': 'Add reservation',
    'reservations.customer': 'Customer',
    'reservations.phone': 'Phone',
    'reservations.date': 'Date',
    'reservations.time': 'Time',
    'reservations.partySize': 'Party size',
    'reservations.tables': 'Tables',
    'reservations.notes': 'Notes',
    'reservations.pending': 'Pending',
    'reservations.confirmed': 'Confirmed',
    'reservations.arrived': 'Arrived',
    'reservations.cancelled': 'Cancelled',
    
    // Delivery
    'delivery.title': 'Delivery Orders',
    'delivery.platforms': 'Platforms',
    'delivery.apiStatus': 'API Status',
    'delivery.connected': 'Connected',
    'delivery.disconnected': 'Disconnected',
    'delivery.address': 'Address',
    'delivery.customer': 'Customer',
    
    // Waiters
    'waiters.title': 'Waiter Management',
    'waiters.name': 'Name',
    'waiters.pin': 'PIN',
    'waiters.ordersToday': 'Orders today',
    'waiters.totalSales': 'Total sales',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.todaySales': 'Today\'s sales',
    'dashboard.ordersToday': 'Orders today',
    'dashboard.avgOrder': 'Average order',
    'dashboard.topProducts': 'Top products',
    'dashboard.topWaiters': 'Top waiters',
    
    // Waiter palmares
    'palmares.myOrders': 'My orders',
    'palmares.allTables': 'All tables',
    'palmares.activeOrders': 'active orders',
    
    // Receipt
    'receipt.title': 'Receipt',
    'receipt.print': 'Print receipt',
    'receipt.subtotal': 'Subtotal',
    'receipt.tip': 'Tip',
    'receipt.total': 'TOTAL',
    'receipt.cui': 'Client Tax ID',
    'receipt.thankYou': 'Thank you!',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markRead': 'Mark as read',
    'notifications.clear': 'Clear all',
    'notifications.noNew': 'No new notifications',
  },
  hu: {
    // General
    'app.title': 'Étterem Menedzsment',
    'app.logout': 'Kijelentkezés',
    'app.save': 'Mentés',
    'app.cancel': 'Mégse',
    'app.add': 'Hozzáadás',
    'app.edit': 'Szerkesztés',
    'app.delete': 'Törlés',
    'app.search': 'Keresés...',
    'app.confirm': 'Megerősítés',
    'app.close': 'Bezárás',
    'app.back': 'Vissza',
    'app.loading': 'Betöltés...',
    'app.noData': 'Nincs adat',
    'app.yes': 'Igen',
    'app.no': 'Nem',
    
    // Login
    'login.title': 'Válassz fiókot',
    'login.pin': 'Add meg a PIN-t',
    'login.submit': 'Bejelentkezés',
    'login.error': 'Hibás PIN',
    
    // Navigation
    'nav.tables': 'Asztalok',
    'nav.tableMap': 'Asztaltérkép',
    'nav.orders': 'Rendelések',
    'nav.menu': 'Menü',
    'nav.kds': 'KDS',
    'nav.reservations': 'Foglalások',
    'nav.delivery': 'Kiszállítás',
    'nav.waiters': 'Pincérek',
    'nav.dashboard': 'Irányítópult',
    'nav.settings': 'Beállítások',
    
    // Tables
    'tables.title': 'Asztalkezelés',
    'tables.add': 'Asztal hozzáadása',
    'tables.number': 'Asztal száma',
    'tables.seats': 'Székek',
    'tables.shape': 'Forma',
    'tables.position': 'Pozíció',
    'tables.status': 'Státusz',
    'tables.free': 'Szabad',
    'tables.occupied': 'Foglalt',
    'tables.reserved': 'Lefoglalt',
    'tables.round': 'Kerek',
    'tables.square': 'Négyzet',
    'tables.rectangle': 'Téglalap',
    
    // Menu
    'menu.title': 'Menükezelés',
    'menu.add': 'Termék hozzáadása',
    'menu.name': 'Név',
    'menu.description': 'Leírás',
    'menu.price': 'Ár (RON)',
    'menu.category': 'Kategória',
    'menu.prepTime': 'Elkészítési idő (perc)',
    'menu.ingredients': 'Összetevők',
    'menu.kdsStation': 'KDS állomás',
    'menu.platformPricing': 'Platform árak',
    
    // Orders
    'orders.title': 'Rendelések',
    'orders.active': 'Aktív',
    'orders.completed': 'Befejezett',
    'orders.table': 'Asztal',
    'orders.waiter': 'Pincér',
    'orders.total': 'Összesen',
    'orders.status': 'Státusz',
    'orders.items': 'Tételek',
    'orders.restaurant': 'Étterem',
    'orders.delivery': 'Kiszállítás',
    'orders.phone': 'Telefon',
    
    // KDS
    'kds.title': 'KDS beállítások',
    'kds.station': 'Állomás',
    'kds.products': 'termék',
    'kds.noOrders': 'Nincs aktív rendelés',
    'kds.start': 'Indítás',
    'kds.ready': 'KÉSZ',
    'kds.startAt': 'Indítás:',
    'kds.attention': 'FIGYELEM! Kezdd el a főzést!',
    
    // Reservations
    'reservations.title': 'Foglaláskezelés',
    'reservations.add': 'Foglalás hozzáadása',
    'reservations.customer': 'Vendég',
    'reservations.phone': 'Telefon',
    'reservations.date': 'Dátum',
    'reservations.time': 'Időpont',
    'reservations.partySize': 'Személyek',
    'reservations.tables': 'Asztalok',
    'reservations.notes': 'Megjegyzések',
    'reservations.pending': 'Függőben',
    'reservations.confirmed': 'Megerősített',
    'reservations.arrived': 'Megérkezett',
    'reservations.cancelled': 'Lemondott',
    
    // Delivery
    'delivery.title': 'Kiszállítási rendelések',
    'delivery.platforms': 'Platformok',
    'delivery.apiStatus': 'API státusz',
    'delivery.connected': 'Kapcsolódva',
    'delivery.disconnected': 'Leválasztva',
    'delivery.address': 'Cím',
    'delivery.customer': 'Vendég',
    
    // Waiters
    'waiters.title': 'Pincérek kezelése',
    'waiters.name': 'Név',
    'waiters.pin': 'PIN',
    'waiters.ordersToday': 'Mai rendelések',
    'waiters.totalSales': 'Összes eladás',
    
    // Dashboard
    'dashboard.title': 'Irányítópult',
    'dashboard.todaySales': 'Mai eladások',
    'dashboard.ordersToday': 'Mai rendelések',
    'dashboard.avgOrder': 'Átlag rendelés',
    'dashboard.topProducts': 'Top termékek',
    'dashboard.topWaiters': 'Top pincérek',
    
    // Waiter palmares
    'palmares.myOrders': 'Rendeléseim',
    'palmares.allTables': 'Összes asztal',
    'palmares.activeOrders': 'aktív rendelés',
    
    // Receipt
    'receipt.title': 'Nyugta',
    'receipt.print': 'Nyugta nyomtatása',
    'receipt.subtotal': 'Részösszeg',
    'receipt.tip': 'Borravaló',
    'receipt.total': 'ÖSSZESEN',
    'receipt.cui': 'Adószám',
    'receipt.thankYou': 'Köszönjük!',
    
    // Notifications
    'notifications.title': 'Értesítések',
    'notifications.markRead': 'Olvasottnak jelöl',
    'notifications.clear': 'Összes törlése',
    'notifications.noNew': 'Nincs új értesítés',
  },
  de: {
    // General
    'app.title': 'Restaurant Management',
    'app.logout': 'Abmelden',
    'app.save': 'Speichern',
    'app.cancel': 'Abbrechen',
    'app.add': 'Hinzufügen',
    'app.edit': 'Bearbeiten',
    'app.delete': 'Löschen',
    'app.search': 'Suchen...',
    'app.confirm': 'Bestätigen',
    'app.close': 'Schließen',
    'app.back': 'Zurück',
    'app.loading': 'Lädt...',
    'app.noData': 'Keine Daten',
    'app.yes': 'Ja',
    'app.no': 'Nein',
    
    // Login
    'login.title': 'Konto auswählen',
    'login.pin': 'PIN eingeben',
    'login.submit': 'Anmelden',
    'login.error': 'Falscher PIN',
    
    // Navigation
    'nav.tables': 'Tische',
    'nav.tableMap': 'Tischplan',
    'nav.orders': 'Bestellungen',
    'nav.menu': 'Menü',
    'nav.kds': 'KDS',
    'nav.reservations': 'Reservierungen',
    'nav.delivery': 'Lieferung',
    'nav.waiters': 'Kellner',
    'nav.dashboard': 'Dashboard',
    'nav.settings': 'Einstellungen',
    
    // Tables
    'tables.title': 'Tischverwaltung',
    'tables.add': 'Tisch hinzufügen',
    'tables.number': 'Tischnummer',
    'tables.seats': 'Plätze',
    'tables.shape': 'Form',
    'tables.position': 'Position',
    'tables.status': 'Status',
    'tables.free': 'Frei',
    'tables.occupied': 'Besetzt',
    'tables.reserved': 'Reserviert',
    'tables.round': 'Rund',
    'tables.square': 'Quadratisch',
    'tables.rectangle': 'Rechteckig',
    
    // Menu
    'menu.title': 'Menüverwaltung',
    'menu.add': 'Produkt hinzufügen',
    'menu.name': 'Name',
    'menu.description': 'Beschreibung',
    'menu.price': 'Preis (RON)',
    'menu.category': 'Kategorie',
    'menu.prepTime': 'Zubereitungszeit (Min)',
    'menu.ingredients': 'Zutaten',
    'menu.kdsStation': 'KDS Station',
    'menu.platformPricing': 'Plattform-Preise',
    
    // Orders
    'orders.title': 'Bestellungen',
    'orders.active': 'Aktiv',
    'orders.completed': 'Abgeschlossen',
    'orders.table': 'Tisch',
    'orders.waiter': 'Kellner',
    'orders.total': 'Gesamt',
    'orders.status': 'Status',
    'orders.items': 'Artikel',
    'orders.restaurant': 'Restaurant',
    'orders.delivery': 'Lieferung',
    'orders.phone': 'Telefon',
    
    // KDS
    'kds.title': 'KDS Konfiguration',
    'kds.station': 'Station',
    'kds.products': 'Produkte',
    'kds.noOrders': 'Keine aktiven Bestellungen',
    'kds.start': 'Starten',
    'kds.ready': 'FERTIG',
    'kds.startAt': 'Starten um:',
    'kds.attention': 'ACHTUNG! Zubereitung starten!',
    
    // Reservations
    'reservations.title': 'Reservierungsverwaltung',
    'reservations.add': 'Reservierung hinzufügen',
    'reservations.customer': 'Kunde',
    'reservations.phone': 'Telefon',
    'reservations.date': 'Datum',
    'reservations.time': 'Uhrzeit',
    'reservations.partySize': 'Personenzahl',
    'reservations.tables': 'Tische',
    'reservations.notes': 'Notizen',
    'reservations.pending': 'Ausstehend',
    'reservations.confirmed': 'Bestätigt',
    'reservations.arrived': 'Angekommen',
    'reservations.cancelled': 'Storniert',
    
    // Delivery
    'delivery.title': 'Lieferbestellungen',
    'delivery.platforms': 'Plattformen',
    'delivery.apiStatus': 'API Status',
    'delivery.connected': 'Verbunden',
    'delivery.disconnected': 'Getrennt',
    'delivery.address': 'Adresse',
    'delivery.customer': 'Kunde',
    
    // Waiters
    'waiters.title': 'Kellnerverwaltung',
    'waiters.name': 'Name',
    'waiters.pin': 'PIN',
    'waiters.ordersToday': 'Bestellungen heute',
    'waiters.totalSales': 'Gesamtumsatz',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.todaySales': 'Umsatz heute',
    'dashboard.ordersToday': 'Bestellungen heute',
    'dashboard.avgOrder': 'Durchschnitt',
    'dashboard.topProducts': 'Top Produkte',
    'dashboard.topWaiters': 'Top Kellner',
    
    // Waiter palmares
    'palmares.myOrders': 'Meine Bestellungen',
    'palmares.allTables': 'Alle Tische',
    'palmares.activeOrders': 'aktive Bestellungen',
    
    // Receipt
    'receipt.title': 'Quittung',
    'receipt.print': 'Quittung drucken',
    'receipt.subtotal': 'Zwischensumme',
    'receipt.tip': 'Trinkgeld',
    'receipt.total': 'GESAMT',
    'receipt.cui': 'Steuernummer',
    'receipt.thankYou': 'Danke!',
    
    // Notifications
    'notifications.title': 'Benachrichtigungen',
    'notifications.markRead': 'Als gelesen markieren',
    'notifications.clear': 'Alle löschen',
    'notifications.noNew': 'Keine neuen Benachrichtigungen',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  languages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ro');

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ro', name: 'Română', flag: '🇷🇴' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hu', name: 'Magyar', flag: '🇭🇺' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
