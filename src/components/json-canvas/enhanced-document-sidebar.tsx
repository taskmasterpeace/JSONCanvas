'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Document } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  FilePlus, 
  FileUp, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  FileText,
  GripVertical,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface EnhancedDocumentSidebarProps {
  isOpen: boolean
  documents: Document[]
  activeDocumentId: string | null
  onSelectDocument: (docId: string) => void
  onAddDocument: () => void
  onImportDocument: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRenameDocument: (docId: string, newName: string) => void
  onDeleteDocument: (docId: string) => void
  onReorderDocuments?: (newOrder: Document[]) => void
}

type SortOption = 'name' | 'modified' | 'created' | 'size' | 'manual'
type FilterOption = 'all' | 'recent' | 'large' | 'empty'

interface SortableDocumentItemProps {
  document: Document
  isActive: boolean
  onSelect: () => void
  onRename: (newName: string) => void
  onDelete: () => void
}

const SortableDocumentItem = React.memo(({ document, isActive, onSelect, onRename, onDelete }: SortableDocumentItemProps) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(document.name)
  const renameInputRef = useRef<HTMLInputElement>(null)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: document.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== document.name) {
      onRename(renameValue.trim())
    }
    setIsRenaming(false)
    setRenameValue(document.name)
  }

  const handleRenameCancel = () => {
    setIsRenaming(false)
    setRenameValue(document.name)
  }

  const getDocumentSize = (data: any): string => {
    const str = JSON.stringify(data)
    const bytes = new Blob([str]).size
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getLastModified = (): string => {
    // In a real app, you'd have a lastModified timestamp
    // For now, we'll use the current time as a placeholder
    return formatDistanceToNow(new Date(), { addSuffix: true })
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative transition-colors duration-200',
        isDragging && 'opacity-50',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 p-3 m-1 rounded-lg border transition-all duration-200 cursor-pointer hover:bg-accent/50',
          isActive ? 'bg-primary/10 border-primary/30 shadow-sm' : 'bg-card border-border/50',
          isDragging && 'shadow-lg scale-105'
        )}
        onClick={onSelect}
      >
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameSubmit()
                  if (e.key === 'Escape') handleRenameCancel()
                }}
                className="h-7 text-sm"
              />
              <Button size="sm" variant="ghost" onClick={handleRenameSubmit} className="h-7 w-7 p-0">
                <Check className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRenameCancel} className="h-7 w-7 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{document.name}</span>
                {document.history.length > 1 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {document.history.length} versions
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {getDocumentSize(document.data)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {getLastModified()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenaming(true)
                }}
                className="h-7 w-7 p-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rename Document</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Delete "${document.name}"?`)) {
                    onDelete()
                  }
                }}
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Document</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </li>
  )
})

SortableDocumentItem.displayName = 'SortableDocumentItem'

export const EnhancedDocumentSidebar = React.memo(function EnhancedDocumentSidebar({
  isOpen,
  documents,
  activeDocumentId,
  onSelectDocument,
  onAddDocument,
  onImportDocument,
  onRenameDocument,
  onDeleteDocument,
  onReorderDocuments,
}: EnhancedDocumentSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('modified')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const importInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      switch (filterBy) {
        case 'recent':
          // In a real app, you'd check actual timestamps
          return true
        case 'large':
          const size = new Blob([JSON.stringify(doc.data)]).size
          return size > 10240 // > 10KB
        case 'empty':
          const isEmpty = !doc.data || 
            (typeof doc.data === 'object' && Object.keys(doc.data).length === 0) ||
            (typeof doc.data === 'string' && doc.data.trim() === '')
          return isEmpty
        default:
          return true
      }
    })

    if (sortBy !== 'manual') {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name)
          case 'size':
            const sizeA = new Blob([JSON.stringify(a.data)]).size
            const sizeB = new Blob([JSON.stringify(b.data)]).size
            return sizeB - sizeA
          case 'modified':
          case 'created':
          default:
            // In a real app, you'd sort by actual timestamps
            return a.name.localeCompare(b.name)
        }
      })
    }

    return filtered
  }, [documents, searchTerm, sortBy, filterBy])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = documents.findIndex(doc => doc.id === active.id)
      const newIndex = documents.findIndex(doc => doc.id === over.id)
      
      const newOrder = arrayMove(documents, oldIndex, newIndex)
      onReorderDocuments?.(newOrder)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <TooltipProvider>
      <aside className="w-80 bg-card border-r border-border flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Documents</h2>
            <Badge variant="secondary" className="text-xs">
              {documents.length}
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="h-8 text-xs w-20">
                <Filter className="h-3 w-3" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="empty">Empty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" onClick={onAddDocument} className="flex-1">
              <FilePlus className="h-4 w-4 mr-2" />
              New
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => importInputRef.current?.click()}
              className="flex-1"
            >
              <FileUp className="h-4 w-4 mr-2" />
              Import
              <input
                type="file"
                accept=".json,application/json"
                ref={importInputRef}
                onChange={onImportDocument}
                className="hidden"
              />
            </Button>
          </div>
        </div>

        {/* Document List */}
        <ScrollArea className="flex-1">
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents found</p>
              {searchTerm && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredAndSortedDocuments.map(doc => doc.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="p-2 space-y-1">
                  {filteredAndSortedDocuments.map(document => (
                    <SortableDocumentItem
                      key={document.id}
                      document={document}
                      isActive={document.id === activeDocumentId}
                      onSelect={() => onSelectDocument(document.id)}
                      onRename={(newName) => onRenameDocument(document.id, newName)}
                      onDelete={() => onDeleteDocument(document.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Documents auto-saved locally • Drag to reorder
          </p>
        </div>
      </aside>
    </TooltipProvider>
  )
})