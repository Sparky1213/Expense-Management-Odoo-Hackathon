"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api"

interface ParsedReceiptData {
  merchant: string | null
  amount: number | null
  currency: string | null
  date: string | null
  category: string
  items?: Array<{
    name: string
    price: number
  }>
  rawText?: string
  error?: string
}

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runOCR = async (file: File): Promise<ParsedReceiptData | null> => {
    setIsProcessing(true)
    setParsedData(null)
    setError(null)

    try {
      const response = await apiClient.parseReceipt(file)
      
      if (response.success && response.data) {
        const data = response.data
        setParsedData(data)
        return data
      } else {
        throw new Error(response.message || 'OCR processing failed')
      }
    } catch (error) {
      console.error("OCR processing failed:", error)
      const errorMessage = error instanceof Error ? error.message : 'OCR processing failed'
      setError(errorMessage)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const extractText = async (file: File): Promise<string | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await apiClient.extractText(file)
      
      if (response.success && response.data) {
        return response.data.text
      } else {
        throw new Error(response.message || 'Text extraction failed')
      }
    } catch (error) {
      console.error("Text extraction failed:", error)
      const errorMessage = error instanceof Error ? error.message : 'Text extraction failed'
      setError(errorMessage)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const clearData = () => {
    setParsedData(null)
    setError(null)
  }

  return {
    runOCR,
    extractText,
    isProcessing,
    parsedData,
    error,
    clearData,
  }
}
