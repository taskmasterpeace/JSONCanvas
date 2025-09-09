'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { JsonSchemaValidator, ValidationResult } from '@/lib/json-schema-validator'
import type { JsonValue } from './types'
import { CheckCircle, XCircle, AlertCircle, Wand2, FileText, Upload } from 'lucide-react'

interface SchemaValidationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jsonData: JsonValue
  onSchemaChange?: (schema: any) => void
}

export function SchemaValidationDialog({
  open,
  onOpenChange,
  jsonData,
  onSchemaChange
}: SchemaValidationDialogProps) {
  const [validator] = useState(() => new JsonSchemaValidator())
  const [schemaText, setSchemaText] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const { toast } = useToast()

  // Validate whenever schema or data changes
  useEffect(() => {
    if (schemaText.trim()) {
      try {
        const schema = JSON.parse(schemaText)
        if (validator.setSchema(schema)) {
          const result = validator.validate(jsonData)
          setValidationResult(result)
          onSchemaChange?.(schema)
        }
      } catch (error) {
        setValidationResult({
          isValid: false,
          errors: [{ path: '', message: 'Invalid JSON Schema format' }]
        })
      }
    } else {
      setValidationResult(null)
    }
  }, [schemaText, jsonData, validator, onSchemaChange])

  const handleGenerateSchema = () => {
    try {
      const generatedSchema = JsonSchemaValidator.generateSchemaFromData(jsonData)
      setSchemaText(JSON.stringify(generatedSchema, null, 2))
      toast({
        title: 'Schema Generated',
        description: 'A basic schema has been generated from your current data.'
      })
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Could not generate schema from current data.',
        variant: 'destructive'
      })
    }
  }

  const handleLoadTemplate = (templateName: string) => {
    if (!templateName) return
    
    const templates = JsonSchemaValidator.getSchemaTemplates()
    const template = templates[templateName as keyof typeof templates]
    if (template) {
      setSchemaText(JSON.stringify(template, null, 2))
      setSelectedTemplate(templateName)
      toast({
        title: 'Template Loaded',
        description: `Loaded ${templateName} schema template.`
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const schema = JSON.parse(e.target?.result as string)
          setSchemaText(JSON.stringify(schema, null, 2))
          toast({
            title: 'Schema Loaded',
            description: `Schema loaded from ${file.name}`
          })
        } catch (error) {
          toast({
            title: 'Load Error',
            description: 'Invalid JSON schema file.',
            variant: 'destructive'
          })
        }
      }
      reader.readAsText(file)
      event.target.value = ''
    }
  }

  const handleSaveSchema = () => {
    try {
      const schema = JSON.parse(schemaText)
      const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'schema.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: 'Schema Saved',
        description: 'Schema has been saved to your downloads.'
      })
    } catch (error) {
      toast({
        title: 'Save Error',
        description: 'Could not save schema.',
        variant: 'destructive'
      })
    }
  }

  const getValidationIcon = () => {
    if (!validationResult) return null
    if (validationResult.isValid) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    return <XCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            JSON Schema Validation
            {getValidationIcon()}
          </DialogTitle>
          <DialogDescription>
            Validate your JSON data against a schema. Generate, load templates, or create custom schemas.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="editor" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor">Schema Editor</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="validation">Validation Results</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 flex flex-col space-y-4 min-h-0">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleGenerateSchema} size="sm" variant="outline">
                <Wand2 className="h-4 w-4 mr-2" />
                Generate from Data
              </Button>
              <Button onClick={handleSaveSchema} size="sm" variant="outline" disabled={!schemaText.trim()}>
                Save Schema
              </Button>
              <div className="relative">
                <Button size="sm" variant="outline" asChild>
                  <label>
                    <Upload className="h-4 w-4 mr-2" />
                    Load Schema
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <Label htmlFor="schema-editor">JSON Schema</Label>
              <Textarea
                id="schema-editor"
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                placeholder="Enter or generate a JSON schema..."
                className="font-mono text-sm h-full resize-none mt-2"
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-select">Choose a Template</Label>
              <Select value={selectedTemplate} onValueChange={handleLoadTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a schema template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="apiResponse">API Response</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Person Schema</CardTitle>
                  <CardDescription className="text-xs">
                    Schema for person objects with name, age, email, and address
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleLoadTemplate('person')}
                    className="w-full"
                  >
                    Load Person Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Product Schema</CardTitle>
                  <CardDescription className="text-xs">
                    Schema for product objects with id, name, price, and category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleLoadTemplate('product')}
                    className="w-full"
                  >
                    Load Product Template
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Response Schema</CardTitle>
                  <CardDescription className="text-xs">
                    Schema for API responses with success, message, and data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleLoadTemplate('apiResponse')}
                    className="w-full"
                  >
                    Load API Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {validationResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {validationResult.errors.length} Error{validationResult.errors.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {!validationResult.isValid && (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <Card key={index} className="border-red-200 dark:border-red-800">
                          <CardContent className="pt-3">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="space-y-1 min-w-0">
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                  Path: {error.path || 'root'}
                                </p>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                  {error.message}
                                </p>
                                {error.value !== undefined && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    Value: {JSON.stringify(error.value)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {validationResult.isValid && (
                  <Card className="border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Data is valid!</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Your JSON data conforms to the provided schema.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p>No schema provided</p>
                    <p className="text-sm">Add a schema to see validation results</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}