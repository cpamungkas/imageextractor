"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import ImageMetadataDisplay from "@/components/image-metadata-display"

export default function Home() {
  const [metadata, setMetadata] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      // Create a basic metadata object with file information
      const basicMetadata: any = {
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`,
        fileType: file.type,
        lastModified: new Date(file.lastModified).toLocaleString(),
      }

      // Create an image to get dimensions
      const imageUrl = URL.createObjectURL(file)
      const img = new Image()

      img.onload = () => {
        // Add image dimensions
        basicMetadata.dimensions = `${img.width} × ${img.height}`
        basicMetadata.resolution = `${img.width} × ${img.height} pixels`

        // Extract EXIF data using FileReader
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const result = e.target?.result as ArrayBuffer
            const exifData = extractExifData(result)

            // Merge the EXIF data with basic metadata
            const fullMetadata = { ...basicMetadata, ...exifData }
            setMetadata(fullMetadata)
          } catch (error) {
            console.error("Error extracting EXIF data:", error)
            // Still return basic metadata even if EXIF extraction fails
            setMetadata(basicMetadata)
          } finally {
            setIsLoading(false)
            URL.revokeObjectURL(imageUrl) // Clean up the object URL
          }
        }

        reader.readAsArrayBuffer(file)
      }

      img.onerror = () => {
        setMetadata(basicMetadata)
        setIsLoading(false)
        URL.revokeObjectURL(imageUrl)
      }

      img.src = imageUrl
    } catch (error) {
      console.error("Error processing image:", error)
      setIsLoading(false)
    }
  }

  // Safe read function to prevent out-of-bounds access
  const safeRead = (dataView: DataView, offset: number, length: number, callback: () => any): any => {
    try {
      if (offset < 0 || offset + length > dataView.byteLength) {
        return null // Out of bounds
      }
      return callback()
    } catch (e) {
      console.warn("Error reading data at offset", offset, e)
      return null
    }
  }

  // Manual EXIF data extraction function with improved bounds checking
  const extractExifData = (arrayBuffer: ArrayBuffer) => {
    const exifData: any = {}

    try {
      const dataView = new DataView(arrayBuffer)
      const byteLength = dataView.byteLength

      // Check if file is too small to be a valid image with EXIF
      if (byteLength < 12) {
        return exifData
      }

      // Try to determine the image format
      let imageFormat = "unknown"
      if (safeRead(dataView, 0, 2, () => dataView.getUint16(0)) === 0xffd8) {
        imageFormat = "jpeg"
      } else {
        // Not a JPEG, can't extract EXIF data with this method
        return exifData
      }

      let offset = 2
      let marker

      // Find the APP1 marker (0xFFE1) which contains EXIF data
      while (offset < byteLength - 1) {
        marker = safeRead(dataView, offset, 2, () => dataView.getUint16(offset))
        if (marker === null) break

        offset += 2

        // Check if we've reached the end of markers
        if (offset >= byteLength) break

        // APP1 marker found
        if (marker === 0xffe1) {
          // Get segment length
          const segmentLength = safeRead(dataView, offset, 2, () => dataView.getUint16(offset))
          if (segmentLength === null || segmentLength < 8) break

          // Check for "Exif" string
          if (offset + 2 + 4 > byteLength) break

          const exifHeader = getStringFromDataView(dataView, offset + 2, 4)
          if (exifHeader === "Exif") {
            // Parse EXIF data
            const tiffOffset = offset + 8 // Skip segment size and Exif\0\0

            // Check if TIFF header is within bounds
            if (tiffOffset + 8 > byteLength) break

            // Check byte order
            const byteOrder = safeRead(dataView, tiffOffset, 2, () => dataView.getUint16(tiffOffset))
            if (byteOrder === null) break

            const littleEndian = byteOrder === 0x4949 // "II" for Intel byte order

            // Read IFD offset
            const ifdOffsetValue = safeRead(dataView, tiffOffset + 4, 4, () =>
              dataView.getUint32(tiffOffset + 4, littleEndian),
            )
            if (ifdOffsetValue === null) break

            const ifdOffset = tiffOffset + ifdOffsetValue

            // Check if IFD is within bounds
            if (ifdOffset + 2 > byteLength) break

            // Parse IFD entries
            const entriesCount = safeRead(dataView, ifdOffset, 2, () => dataView.getUint16(ifdOffset, littleEndian))
            if (entriesCount === null || entriesCount > 200) break // Sanity check

            // Process IFD entries
            for (let i = 0; i < entriesCount; i++) {
              const entryOffset = ifdOffset + 2 + i * 12

              // Check if entry is within bounds
              if (entryOffset + 12 > byteLength) break

              const tag = safeRead(dataView, entryOffset, 2, () => dataView.getUint16(entryOffset, littleEndian))
              if (tag === null) continue

              const type = safeRead(dataView, entryOffset + 2, 2, () =>
                dataView.getUint16(entryOffset + 2, littleEndian),
              )
              if (type === null) continue

              const count = safeRead(dataView, entryOffset + 4, 4, () =>
                dataView.getUint32(entryOffset + 4, littleEndian),
              )
              if (count === null) continue

              const valueOffset = safeRead(dataView, entryOffset + 8, 4, () =>
                dataView.getUint32(entryOffset + 8, littleEndian),
              )
              if (valueOffset === null) continue

              // Calculate the actual data offset
              const dataOffset =
                (type === 3 && count <= 2) || (type === 4 && count === 1)
                  ? entryOffset + 8 // Value is stored directly in the offset field
                  : tiffOffset + valueOffset

              // Check if data offset is within bounds
              if (dataOffset >= byteLength) continue

              // Extract common tags
              switch (tag) {
                case 0x010f: // Make
                  if (type === 2) {
                    // ASCII string
                    exifData.Make = getStringFromDataView(dataView, dataOffset, Math.min(count, 100))
                  }
                  break
                case 0x0110: // Model
                  if (type === 2) {
                    // ASCII string
                    exifData.Model = getStringFromDataView(dataView, dataOffset, Math.min(count, 100))
                  }
                  break
                case 0x9003: // DateTimeOriginal
                  if (type === 2) {
                    // ASCII string
                    exifData.creationDate = getStringFromDataView(dataView, dataOffset, Math.min(count, 20))
                  }
                  break
                case 0x8827: // ISO
                  if (type === 3 && dataOffset + 2 <= byteLength) {
                    // Short
                    exifData.iso = safeRead(dataView, dataOffset, 2, () => dataView.getUint16(dataOffset, littleEndian))
                  }
                  break
                case 0x829a: // ExposureTime
                  if (type === 5 && dataOffset + 8 <= byteLength) {
                    // Rational
                    const numerator = safeRead(dataView, dataOffset, 4, () =>
                      dataView.getUint32(dataOffset, littleEndian),
                    )
                    const denominator = safeRead(dataView, dataOffset + 4, 4, () =>
                      dataView.getUint32(dataOffset + 4, littleEndian),
                    )

                    if (numerator !== null && denominator !== null && denominator !== 0) {
                      const exposureValue = numerator / denominator
                      if (exposureValue >= 1) {
                        exifData.exposureTime = `${exposureValue} sec`
                      } else if (exposureValue > 0) {
                        exifData.exposureTime = `1/${Math.round(1 / exposureValue)} sec`
                      }
                    }
                  }
                  break
                case 0x829d: // FNumber (Aperture)
                  if (type === 5 && dataOffset + 8 <= byteLength) {
                    // Rational
                    const numerator = safeRead(dataView, dataOffset, 4, () =>
                      dataView.getUint32(dataOffset, littleEndian),
                    )
                    const denominator = safeRead(dataView, dataOffset + 4, 4, () =>
                      dataView.getUint32(dataOffset + 4, littleEndian),
                    )

                    if (numerator !== null && denominator !== null && denominator !== 0) {
                      exifData.aperture = `f/${(numerator / denominator).toFixed(1)}`
                    }
                  }
                  break
                case 0x920a: // FocalLength
                  if (type === 5 && dataOffset + 8 <= byteLength) {
                    // Rational
                    const numerator = safeRead(dataView, dataOffset, 4, () =>
                      dataView.getUint32(dataOffset, littleEndian),
                    )
                    const denominator = safeRead(dataView, dataOffset + 4, 4, () =>
                      dataView.getUint32(dataOffset + 4, littleEndian),
                    )

                    if (numerator !== null && denominator !== null && denominator !== 0) {
                      exifData.focalLength = `${(numerator / denominator).toFixed(1)} mm`
                    }
                  }
                  break
                case 0x8769: // ExifIFD pointer
                  if (dataOffset + 2 <= byteLength) {
                    // Process Exif SubIFD
                    processExifSubIFD(dataView, tiffOffset, valueOffset, littleEndian, exifData)
                  }
                  break
              }
            }
          }
          break
        } else if ((marker & 0xff00) !== 0xff00) {
          break // Not a valid marker
        } else {
          // Skip this segment
          const segmentLength = safeRead(dataView, offset, 2, () => dataView.getUint16(offset))
          if (segmentLength === null || segmentLength < 2) break
          offset += segmentLength
        }
      }
    } catch (error) {
      console.error("Error parsing EXIF data:", error)
    }

    return exifData
  }

  // Process Exif SubIFD with bounds checking
  const processExifSubIFD = (
    dataView: DataView,
    tiffOffset: number,
    exifIfdPointer: number,
    littleEndian: boolean,
    exifData: any,
  ) => {
    try {
      const exifSubIFDOffset = tiffOffset + exifIfdPointer

      // Check if SubIFD is within bounds
      if (exifSubIFDOffset + 2 > dataView.byteLength) return

      const entriesCount = safeRead(dataView, exifSubIFDOffset, 2, () =>
        dataView.getUint16(exifSubIFDOffset, littleEndian),
      )
      if (entriesCount === null || entriesCount > 200) return // Sanity check

      // Process Exif SubIFD entries
      for (let j = 0; j < entriesCount; j++) {
        const entryOffset = exifSubIFDOffset + 2 + j * 12

        // Check if entry is within bounds
        if (entryOffset + 12 > dataView.byteLength) break

        const tag = safeRead(dataView, entryOffset, 2, () => dataView.getUint16(entryOffset, littleEndian))
        if (tag === null) continue

        const type = safeRead(dataView, entryOffset + 2, 2, () => dataView.getUint16(entryOffset + 2, littleEndian))
        if (type === null) continue

        const count = safeRead(dataView, entryOffset + 4, 4, () => dataView.getUint32(entryOffset + 4, littleEndian))
        if (count === null) continue

        const valueOffset = safeRead(dataView, entryOffset + 8, 4, () =>
          dataView.getUint32(entryOffset + 8, littleEndian),
        )
        if (valueOffset === null) continue

        // Calculate the actual data offset
        const dataOffset =
          (type === 3 && count <= 2) || (type === 4 && count === 1)
            ? entryOffset + 8 // Value is stored directly in the offset field
            : tiffOffset + valueOffset

        // Check if data offset is within bounds
        if (dataOffset >= dataView.byteLength) continue

        // Extract common Exif SubIFD tags
        switch (tag) {
          case 0x8827: // ISO
            if (type === 3 && dataOffset + 2 <= dataView.byteLength) {
              // Short
              exifData.iso = safeRead(dataView, dataOffset, 2, () => dataView.getUint16(dataOffset, littleEndian))
            }
            break
          case 0x829a: // ExposureTime
            if (type === 5 && dataOffset + 8 <= dataView.byteLength) {
              // Rational
              const numerator = safeRead(dataView, dataOffset, 4, () => dataView.getUint32(dataOffset, littleEndian))
              const denominator = safeRead(dataView, dataOffset + 4, 4, () =>
                dataView.getUint32(dataOffset + 4, littleEndian),
              )

              if (numerator !== null && denominator !== null && denominator !== 0) {
                const exposureValue = numerator / denominator
                if (exposureValue >= 1) {
                  exifData.exposureTime = `${exposureValue} sec`
                } else if (exposureValue > 0) {
                  exifData.exposureTime = `1/${Math.round(1 / exposureValue)} sec`
                }
              }
            }
            break
          case 0x829d: // FNumber (Aperture)
            if (type === 5 && dataOffset + 8 <= dataView.byteLength) {
              // Rational
              const numerator = safeRead(dataView, dataOffset, 4, () => dataView.getUint32(dataOffset, littleEndian))
              const denominator = safeRead(dataView, dataOffset + 4, 4, () =>
                dataView.getUint32(dataOffset + 4, littleEndian),
              )

              if (numerator !== null && denominator !== null && denominator !== 0) {
                exifData.aperture = `f/${(numerator / denominator).toFixed(1)}`
              }
            }
            break
          case 0x920a: // FocalLength
            if (type === 5 && dataOffset + 8 <= dataView.byteLength) {
              // Rational
              const numerator = safeRead(dataView, dataOffset, 4, () => dataView.getUint32(dataOffset, littleEndian))
              const denominator = safeRead(dataView, dataOffset + 4, 4, () =>
                dataView.getUint32(dataOffset + 4, littleEndian),
              )

              if (numerator !== null && denominator !== null && denominator !== 0) {
                exifData.focalLength = `${(numerator / denominator).toFixed(1)} mm`
              }
            }
            break
        }
      }
    } catch (error) {
      console.warn("Error processing Exif SubIFD:", error)
    }
  }

  // Helper function to extract strings from DataView with bounds checking
  const getStringFromDataView = (dataView: DataView, offset: number, maxLength: number) => {
    let str = ""
    try {
      // Make sure we don't read beyond the end of the buffer
      const safeMaxLength = Math.min(maxLength, dataView.byteLength - offset)
      if (safeMaxLength <= 0) return str

      for (let i = 0; i < safeMaxLength; i++) {
        const char = dataView.getUint8(offset + i)
        if (char === 0) break // Null terminator
        str += String.fromCharCode(char)
      }
    } catch (e) {
      console.warn("Error reading string at offset", offset, e)
    }
    return str.trim()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const input = document.createElement("input")
      input.type = "file"
      input.files = e.dataTransfer.files
      handleFileChange({ target: input } as any)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl">Image Metadata Extractor</CardTitle>
          <CardDescription>
            Upload an image to extract its metadata. The image will not be stored on the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Drag and drop your image here</h3>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <Button variant="outline" disabled={isLoading}>
              {isLoading ? "Processing..." : "Select Image"}
            </Button>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
          </div>

          {metadata && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Image Metadata</h3>
                </div>

                <ImageMetadataDisplay metadata={metadata} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

