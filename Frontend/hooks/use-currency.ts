"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

interface Currency {
  code: string
  name: string
  symbol?: string
}

interface Country {
  name: string
  currencies: string[]
}

interface CurrencyResponse {
  success: boolean
  data: {
    currencies: string[]
  }
}

interface CountriesResponse {
  success: boolean
  data: {
    countries: Country[]
  }
}

export function useCurrency() {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchCurrencies = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getSupportedCurrencies() as CurrencyResponse
      if (response.success && response.data) {
        // Create a Map to ensure unique currency codes
        const uniqueCurrencies = new Map()
        response.data.currencies.forEach((code: string) => {
          if (!uniqueCurrencies.has(code)) {
            uniqueCurrencies.set(code, {
              code,
              name: getCurrencyName(code),
              symbol: getCurrencySymbol(code)
            })
          }
        })
        setCurrencies(Array.from(uniqueCurrencies.values()))
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error)
      // Fallback to common currencies if API fails
      const commonCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CNY'].map(code => ({
        code,
        name: getCurrencyName(code),
        symbol: getCurrencySymbol(code)
      }))
      setCurrencies(commonCurrencies)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCountries = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getCountriesAndCurrencies() as CountriesResponse
      if (response.success && response.data) {
        setCountries(response.data.countries)
      }
    } catch (error) {
      console.error('Failed to fetch countries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrencySymbol = (code: string): string => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'AED': 'د.إ',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NZD': 'NZ$',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RUB': '₽',
      'BRL': 'R$',
      'MXN': '$',
      'ZAR': 'R',
      'KRW': '₩',
      'THB': '฿',
      'MYR': 'RM',
      'IDR': 'Rp',
      'PHP': '₱',
      'VND': '₫',
      'TRY': '₺',
      'ILS': '₪',
      'SAR': 'ر.س',
      'QAR': 'ر.ق',
      'KWD': 'د.ك',
      'BHD': 'د.ب',
      'OMR': 'ر.ع.',
      'JOD': 'د.ا',
      'LBP': 'ل.ل',
      'EGP': '£',
      'MAD': 'د.م.',
      'TND': 'د.ت',
      'DZD': 'د.ج',
      'LYD': 'ل.د',
      'SDG': 'ج.س.',
      'ETB': 'Br',
      'KES': 'KSh',
      'UGX': 'USh',
      'TZS': 'TSh',
      'ZMW': 'ZK',
      'BWP': 'P',
      'SZL': 'L',
      'LSL': 'L',
      'NAD': 'N$',
      'MZN': 'MT',
      'AOA': 'Kz',
      'GHS': '₵',
      'NGN': '₦',
      'XOF': 'CFA',
      'XAF': 'FCFA',
      'CDF': 'FC',
      'RWF': 'RF',
      'BIF': 'FBu',
      'KMF': 'CF',
      'DJF': 'Fdj',
      'SOS': 'S',
      'ERN': 'Nfk',
      'MUR': '₨',
      'SCR': '₨',
      'SLL': 'Le',
      'GMD': 'D',
      'GNF': 'FG',
      'LRD': 'L$',
      'CVE': '$',
      'STN': 'Db',
    }
    return symbols[code] || code
  }

  const formatCurrency = (amount: number, currency: string, locale: string = 'en-US'): string => {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch (error) {
      return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`
    }
  }

  const getCurrencyName = (code: string): string => {
    const names: { [key: string]: string } = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound',
      'INR': 'Indian Rupee',
      'JPY': 'Japanese Yen',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'AED': 'UAE Dirham',
      'SGD': 'Singapore Dollar',
      'HKD': 'Hong Kong Dollar',
      'NZD': 'New Zealand Dollar',
      'SEK': 'Swedish Krona',
      'NOK': 'Norwegian Krone',
      'DKK': 'Danish Krone',
      'PLN': 'Polish Zloty',
      'CZK': 'Czech Koruna',
      'HUF': 'Hungarian Forint',
      'RUB': 'Russian Ruble',
      'BRL': 'Brazilian Real',
      'MXN': 'Mexican Peso',
      'ZAR': 'South African Rand',
      'KRW': 'South Korean Won',
      'THB': 'Thai Baht',
      'MYR': 'Malaysian Ringgit',
      'IDR': 'Indonesian Rupiah',
      'PHP': 'Philippine Peso',
      'VND': 'Vietnamese Dong',
      'TRY': 'Turkish Lira',
      'ILS': 'Israeli Shekel',
      'SAR': 'Saudi Riyal',
      'QAR': 'Qatari Riyal',
      'KWD': 'Kuwaiti Dinar',
      'BHD': 'Bahraini Dinar',
      'OMR': 'Omani Rial',
      'JOD': 'Jordanian Dinar',
      'LBP': 'Lebanese Pound',
      'EGP': 'Egyptian Pound',
      'MAD': 'Moroccan Dirham',
      'TND': 'Tunisian Dinar',
      'DZD': 'Algerian Dinar',
      'LYD': 'Libyan Dinar',
      'SDG': 'Sudanese Pound',
      'ETB': 'Ethiopian Birr',
      'KES': 'Kenyan Shilling',
      'UGX': 'Ugandan Shilling',
      'TZS': 'Tanzanian Shilling',
      'ZMW': 'Zambian Kwacha',
      'BWP': 'Botswana Pula',
      'SZL': 'Swazi Lilangeni',
      'LSL': 'Lesotho Loti',
      'NAD': 'Namibian Dollar',
      'MZN': 'Mozambican Metical',
      'AOA': 'Angolan Kwanza',
      'GHS': 'Ghanaian Cedi',
      'NGN': 'Nigerian Naira',
      'XOF': 'West African CFA Franc',
      'XAF': 'Central African CFA Franc',
      'CDF': 'Congolese Franc',
      'RWF': 'Rwandan Franc',
      'BIF': 'Burundian Franc',
      'KMF': 'Comorian Franc',
      'DJF': 'Djiboutian Franc',
      'SOS': 'Somali Shilling',
      'ERN': 'Eritrean Nakfa',
      'MUR': 'Mauritian Rupee',
      'SCR': 'Seychellois Rupee',
      'SLL': 'Sierra Leonean Leone',
      'GMD': 'Gambian Dalasi',
      'GNF': 'Guinean Franc',
      'LRD': 'Liberian Dollar',
      'CVE': 'Cape Verdean Escudo',
      'STN': 'São Tomé and Príncipe Dobra',
    }
    return names[code] || code
  }

  useEffect(() => {
    fetchCurrencies()
    fetchCountries()
  }, [])

  return {
    currencies,
    countries,
    isLoading,
    fetchCurrencies,
    fetchCountries,
    getCurrencySymbol,
    getCurrencyName,
    formatCurrency,
  }
}
