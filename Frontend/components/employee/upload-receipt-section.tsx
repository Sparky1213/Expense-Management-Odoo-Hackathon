"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, CheckCircle } from "lucide-react"
import { useOCR } from "@/hooks/use-ocr"
import Image from "next/image"

interface UploadReceiptSectionProps {
  onParsedData: (data: { merchant: string; amount: number | null; date: string; category: string; currency: string | null } | null) => void
  onFileSelected?: (file: File | null) => void
}

export function UploadReceiptSection({ onParsedData, onFileSelected }: UploadReceiptSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { runOCR, isProcessing, parsedData } = useOCR()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    if (onFileSelected) onFileSelected(file)

    if (file.type === 'application/pdf') {
      onParsedData(null)
      return
    }

    if (file.type.startsWith('image/')) {
      const result = await runOCR(file)
      if (result) {
        const normalized = {
          merchant: result.merchant ?? '',
          amount: result.amount != null ? Number(result.amount) : null,
          date: result.date ?? '',
          category: result.category ?? 'Other',
          currency: result.currency ?? null,
        }
        onParsedData(normalized)
      } else {
        onParsedData(null)
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Receipt</CardTitle>
        <CardDescription>Upload a receipt image or PDF. Images will be processed with OCR.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload receipt"
        />

        {!previewUrl ? (
          <div
            onClick={handleUploadClick}
            className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, PDF up to 10MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-border">
              {selectedFile?.type === 'application/pdf' ? (
                <object data={previewUrl} type="application/pdf" width="100%" height="480">
                  <p className="text-sm text-muted-foreground">PDF preview is not available. <a href={previewUrl} target="_blank" rel="noreferrer" className="underline">Open PDF</a></p>
                </object>
              ) : (
                <div className="aspect-[3/4] relative w-full h-96">
                  <Image src={previewUrl || "/placeholder.svg"} alt="Receipt preview" fill className="object-contain" />
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing receipt with AI...</span>
              </div>
            )}

            {parsedData && !isProcessing && selectedFile?.type !== 'application/pdf' && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">Receipt Processed Successfully</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merchant:</span>
                    <span className="font-medium">{parsedData.merchant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{parsedData.amount != null ? `$${parsedData.amount.toFixed(2)}` : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{parsedData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{parsedData.category}</span>
                  </div>
                </div>
              </div>
            )}

            <Button variant="outline" onClick={handleUploadClick} className="w-full bg-transparent">
              Upload Different Receipt
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
