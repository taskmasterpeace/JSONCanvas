'use client'

import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { JsonNode } from './json-node'
import type { JsonValue, JsonPath, EditableJsonNodeProps } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface VirtualizedJsonListProps {
  data: JsonValue[]
  onUpdate: (path: JsonPath, newValue: JsonValue) => void
  onDelete: (path: JsonPath, keyOrIndex?: string | number) => void
  onAddItem?: (path: JsonPath, value: JsonValue) => void
  getApiKey: () => string | null
  basePath: JsonPath
  maxHeight?: number
  itemHeight?: number
}

interface ListItemProps {
  index: number
  style: React.CSSProperties
  data: {
    items: JsonValue[]
    onUpdate: (path: JsonPath, newValue: JsonValue) => void
    onDelete: (path: JsonPath, keyOrIndex?: string | number) => void
    onAddItem?: (path: JsonPath, value: JsonValue) => void
    getApiKey: () => string | null
    basePath: JsonPath
  }
}

const ListItem = React.memo(({ index, style, data }: ListItemProps) => {
  const { items, onUpdate, onDelete, onAddItem, getApiKey, basePath } = data
  const path = [...basePath, index]
  
  return (
    <div style={style}>
      <div className="p-2 border-b border-border/30">
        <JsonNode
          path={path}
          value={items[index]}
          nodeKey={index.toString()}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onAddItem={onAddItem}
          depth={basePath.length + 1}
          getApiKey={getApiKey}
        />
      </div>
    </div>
  )
})

ListItem.displayName = 'VirtualizedListItem'

export const VirtualizedJsonList = React.memo(function VirtualizedJsonList({
  data,
  onUpdate,
  onDelete,
  onAddItem,
  getApiKey,
  basePath,
  maxHeight = 400,
  itemHeight = 80
}: VirtualizedJsonListProps) {
  const listData = useMemo(() => ({
    items: data,
    onUpdate,
    onDelete,
    onAddItem,
    getApiKey,
    basePath
  }), [data, onUpdate, onDelete, onAddItem, getApiKey, basePath])

  // Don't virtualize if the list is small
  if (data.length < 50) {
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="p-2 border-b border-border/30">
            <JsonNode
              path={[...basePath, index]}
              value={item}
              nodeKey={index.toString()}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddItem={onAddItem}
              depth={basePath.length + 1}
              getApiKey={getApiKey}
            />
          </div>
        ))}
      </div>
    )
  }

  const height = Math.min(maxHeight, data.length * itemHeight)

  return (
    <Card className="w-full">
      <CardHeader className="py-3">
        <CardTitle className="text-sm text-muted-foreground">
          Array with {data.length} items (Virtualized)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <List
          height={height}
          width="100%"
          itemCount={data.length}
          itemSize={itemHeight}
          itemData={listData}
          className="scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
        >
          {ListItem}
        </List>
      </CardContent>
    </Card>
  )
})

export default VirtualizedJsonList