const axios = require('axios');

const CURRENCY_API_BASE = process.env.CURRENCY_API_BASE || 'https://api.exchangerate-api.com/v4/latest';
const COUNTRIES_API_BASE = process.env.COUNTRIES_API_BASE || 'https://restcountries.com/v3.1/all';

// Cache for exchange rates (in production, use Redis)
const exchangeRateCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Get all countries and their currencies
const getCountriesAndCurrencies = async () => {
  try {
    const response = await axios.get(`${COUNTRIES_API_BASE}?fields=name,currencies`);
    const countries = response.data.map(country => ({
      name: country.name.common,
      currencies: Object.keys(country.currencies || {})
    }));
    return countries;
  } catch (error) {
    console.error('Error fetching countries and currencies:', error);
    throw new Error('Failed to fetch countries and currencies');
  }
};

// Get exchange rates for a base currency
const getExchangeRates = async (baseCurrency) => {
  try {
    // Check cache first
    const cacheKey = baseCurrency;
    const cached = exchangeRateCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.rates;
    }

    const response = await axios.get(`${CURRENCY_API_BASE}/${baseCurrency}`);
    const rates = response.data.rates;
    
    // Cache the result
    exchangeRateCache.set(cacheKey, {
      rates,
      timestamp: Date.now()
    });
    
    return rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error(`Failed to fetch exchange rates for ${baseCurrency}`);
  }
};

// Convert currency amount
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return {
        amount,
        exchangeRate: 1,
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency
      };
    }

    const rates = await getExchangeRates(fromCurrency);
    
    if (!rates[toCurrency]) {
      throw new Error(`Currency ${toCurrency} not supported`);
    }

    const exchangeRate = rates[toCurrency];
    const convertedAmount = amount * exchangeRate;

    return {
      amount: convertedAmount,
      exchangeRate,
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      convertedCurrency: toCurrency
    };
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error(`Failed to convert ${amount} ${fromCurrency} to ${toCurrency}`);
  }
};

// Get supported currencies
const getSupportedCurrencies = async () => {
  try {
    const rates = await getExchangeRates('USD');
    return Object.keys(rates).concat(['USD']);
  } catch (error) {
    console.error('Error getting supported currencies:', error);
    // Fallback to common currencies
    return ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  }
};

// Validate currency code
const isValidCurrency = (currencyCode) => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'AED', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB', 'BRL', 'MXN', 'ZAR', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'TRY', 'ILS', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'ETB', 'KES', 'UGX', 'TZS', 'ZMW', 'BWP', 'SZL', 'LSL', 'NAD', 'MZN', 'AOA', 'GHS', 'NGN', 'XOF', 'XAF', 'CDF', 'RWF', 'BIF', 'KMF', 'DJF', 'SOS', 'ERN', 'ETB', 'MUR', 'SCR', 'SLL', 'GMD', 'GNF', 'LRD', 'CVE', 'STN', 'XOF', 'XAF'];
  return validCurrencies.includes(currencyCode?.toUpperCase());
};

module.exports = {
  getCountriesAndCurrencies,
  getExchangeRates,
  convertCurrency,
  getSupportedCurrencies,
  isValidCurrency
};
