"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, Camera, FileText, Maximize2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ImageMetadataDisplayProps {
  metadata: any
}

export default function ImageMetadataDisplay({ metadata }: ImageMetadataDisplayProps) {
  const [showAllMetadata, setShowAllMetadata] = useState(false)

  if (!metadata) return null

  const hasLocation = metadata.location && metadata.location.latitude && metadata.location.longitude

  // Format basic metadata for display
  const basicMetadata = [
    { icon: <FileText className="h-4 w-4" />, label: "File Name", value: metadata.fileName },
    { icon: <FileText className="h-4 w-4" />, label: "File Size", value: metadata.fileSize },
    { icon: <FileText className="h-4 w-4" />, label: "File Type", value: metadata.fileType },
    { icon: <Maximize2 className="h-4 w-4" />, label: "Resolution", value: metadata.resolution || metadata.dimensions },
    { icon: <Calendar className="h-4 w-4" />, label: "Last Modified", value: metadata.lastModified },
  ]

  // Add creation date to basic metadata if available
  if (metadata.creationDate) {
    basicMetadata.push({
      icon: <Calendar className="h-4 w-4" />,
      label: "Creation Date",
      value: metadata.creationDate,
    })
  }

  // Format camera metadata for display if available
  const cameraMetadata = []
  if (metadata.Make)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "Camera Make", value: metadata.Make })
  if (metadata.Model)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "Camera Model", value: metadata.Model })
  if (metadata.iso)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "ISO Speed", value: metadata.iso })
  if (metadata.exposureTime)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "Exposure Time", value: metadata.exposureTime })
  if (metadata.aperture)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "Aperture (F-Stop)", value: metadata.aperture })
  if (metadata.focalLength)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "Focal Length", value: metadata.focalLength })
  if (metadata.exposureProgram)
    cameraMetadata.push({
      icon: <Camera className="h-4 w-4" />,
      label: "Exposure Program",
      value: metadata.exposureProgram,
    })
  if (metadata.meteringMode)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "Metering Mode", value: metadata.meteringMode })
  if (metadata.flash)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "Flash", value: metadata.flash })
  if (metadata.whiteBalance)
    cameraMetadata.push({ icon: <Camera className="h-4 w-4" />, label: "White Balance", value: metadata.whiteBalance })

  // Get all other metadata for advanced view
  const advancedMetadata = Object.entries(metadata)
    .filter(([key]) => {
      // Filter out already displayed metadata and complex objects
      const basicKeys = [
        "fileName",
        "fileSize",
        "fileType",
        "dimensions",
        "resolution",
        "lastModified",
        "creationDate",
        "location",
        "Make",
        "Model",
        "iso",
        "exposureTime",
        "aperture",
        "focalLength",
        "exposureProgram",
        "meteringMode",
        "flash",
        "whiteBalance",
      ]
      return !basicKeys.includes(key) && typeof metadata[key] !== "object"
    })
    .map(([key, value]) => ({ label: key, value }))

  return (
    <div className="space-y-4">
      {/* Basic Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {basicMetadata.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {item.icon}
            <span className="text-sm font-medium">{item.label}:</span>
            <span className="text-sm">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Location Information */}
      {hasLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-destructive" />
              <span className="font-medium">Location Information</span>
              <Badge variant="outline" className="ml-auto">
                GPS Data Found
              </Badge>
            </div>
            <p className="text-sm mb-2">Coordinates: {metadata.location.formattedCoords}</p>
            <div className="aspect-video relative rounded-md overflow-hidden border">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${metadata.location.longitude - 0.01},${metadata.location.latitude - 0.01},${metadata.location.longitude + 0.01},${metadata.location.latitude + 0.01}&layer=mapnik&marker=${metadata.location.latitude},${metadata.location.longitude}`}
                allowFullScreen
              ></iframe>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <a
                href={`https://www.openstreetmap.org/?mlat=${metadata.location.latitude}&mlon=${metadata.location.longitude}#map=15/${metadata.location.latitude}/${metadata.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View larger map
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Information */}
      {cameraMetadata.length > 0 && (
        <>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cameraMetadata.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}:</span>
                  <span className="text-sm">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Advanced Metadata Toggle */}
      {advancedMetadata.length > 0 && (
        <>
          <Separator />
          <div>
            <Button variant="outline" size="sm" onClick={() => setShowAllMetadata(!showAllMetadata)} className="mb-2">
              {showAllMetadata ? "Hide Advanced Metadata" : "Show Advanced Metadata"}
            </Button>

            {showAllMetadata && (
              <div className="grid grid-cols-1 gap-1 mt-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                {advancedMetadata.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <span className="font-medium">{item.label}:</span>
                    <span className="break-all">{String(item.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

