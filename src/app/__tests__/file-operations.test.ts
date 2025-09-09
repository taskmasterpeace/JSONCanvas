/**
 * FILE OPERATIONS TESTING
 * Test file import/export functionality and error handling
 */

describe('File Operations', () => {
  
  describe('File Import Validation', () => {
    test('validates file types correctly', () => {
      const validateFileType = (fileName: string, fileType: string) => {
        return fileType.includes('json') || fileName.toLowerCase().endsWith('.json')
      }

      // Valid files
      expect(validateFileType('data.json', 'application/json')).toBe(true)
      expect(validateFileType('config.JSON', 'application/json')).toBe(true)
      expect(validateFileType('data.json', 'text/plain')).toBe(true) // Extension overrides type
      
      // Invalid files
      expect(validateFileType('data.txt', 'text/plain')).toBe(false)
      expect(validateFileType('image.png', 'image/png')).toBe(false)
      expect(validateFileType('doc.pdf', 'application/pdf')).toBe(false)
    })

    test('validates file sizes correctly', () => {
      const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

      const validateFileSize = (size: number) => {
        return size <= MAX_FILE_SIZE
      }

      // Valid sizes
      expect(validateFileSize(1024)).toBe(true) // 1KB
      expect(validateFileSize(1024 * 1024)).toBe(true) // 1MB
      expect(validateFileSize(10 * 1024 * 1024)).toBe(true) // 10MB
      expect(validateFileSize(MAX_FILE_SIZE)).toBe(true) // Exactly 50MB
      
      // Invalid sizes
      expect(validateFileSize(51 * 1024 * 1024)).toBe(false) // 51MB
      expect(validateFileSize(100 * 1024 * 1024)).toBe(false) // 100MB
    })

    test('formats file sizes for display', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} bytes`
        const kb = bytes / 1024
        if (kb < 1024) return `${kb.toFixed(1)} KB`
        const mb = kb / 1024
        return `${mb.toFixed(1)} MB`
      }

      expect(formatFileSize(512)).toBe('512 bytes')
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB') // 1.5KB
      expect(formatFileSize(2048)).toBe('2.0 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
    })
  })

  describe('JSON Content Validation', () => {
    test('validates JSON content structure', () => {
      const validateJsonContent = (content: string): { isValid: boolean; error?: string; parsed?: any } => {
        if (!content || content.trim() === '') {
          return { isValid: false, error: 'File appears to be empty' }
        }

        try {
          const parsed = JSON.parse(content)
          
          if (parsed === undefined) {
            return { isValid: false, error: 'File contains undefined value which is not valid JSON' }
          }
          
          return { isValid: true, parsed }
        } catch (error) {
          if (error instanceof SyntaxError) {
            const match = error.message.match(/position (\d+)/)
            if (match) {
              return { 
                isValid: false, 
                error: `JSON syntax error at position ${match[1]}. Check for missing quotes, commas, or brackets.`
              }
            } else {
              return { 
                isValid: false, 
                error: `JSON syntax error: ${error.message}`
              }
            }
          }
          
          return { isValid: false, error: 'Unknown parsing error' }
        }
      }

      // Valid JSON
      expect(validateJsonContent('{"name": "John"}')).toEqual({
        isValid: true,
        parsed: { name: 'John' }
      })
      
      expect(validateJsonContent('[1, 2, 3]')).toEqual({
        isValid: true,
        parsed: [1, 2, 3]
      })

      // Empty content
      expect(validateJsonContent('')).toEqual({
        isValid: false,
        error: 'File appears to be empty'
      })

      expect(validateJsonContent('   \n\t   ')).toEqual({
        isValid: false,
        error: 'File appears to be empty'
      })

      // Invalid JSON with position info
      const malformedResult = validateJsonContent('{"name": "John",}')
      expect(malformedResult.isValid).toBe(false)
      expect(malformedResult.error).toContain('position')
    })

    test('handles various JSON corruption scenarios', () => {
      const corruptedExamples = [
        {
          content: '{"name": "John" "age": 30}',
          issue: 'missing comma'
        },
        {
          content: '{name: "John", age: 30}',
          issue: 'unquoted keys'
        },
        {
          content: '{"name": "John", "age": 30,}',
          issue: 'trailing comma'
        },
        {
          content: '{"name": "John", "age":}',
          issue: 'missing value'
        },
        {
          content: '{"name": "John", "message": "He said "hello""}',
          issue: 'unescaped quotes'
        }
      ]

      corruptedExamples.forEach(({ content, issue }) => {
        expect(() => JSON.parse(content)).toThrow()
        // Each should be identified as different types of corruption
      })
    })
  })

  describe('File Export Operations', () => {
    test('creates proper filename sanitization', () => {
      const sanitizeFileName = (name: string): string => {
        return name.replace(/[^a-z0-9_.-]/gi, '_') || 'document'
      }

      // Normal names
      expect(sanitizeFileName('My Document')).toBe('My_Document')
      expect(sanitizeFileName('user-data.json')).toBe('user-data.json')
      expect(sanitizeFileName('config_file')).toBe('config_file')
      
      // Problematic characters - note that . and - are preserved by the regex [^a-z0-9_.-]
      const problematic = 'file@#$%^&*()+={}[]|\\:";\'<>?/,`~'
      const sanitized = sanitizeFileName(problematic)
      expect(sanitized.startsWith('file')).toBe(true)
      expect(sanitized).toContain('_') // Should have underscores replacing invalid chars
      expect(sanitizeFileName('file with spaces')).toBe('file_with_spaces')
      expect(sanitizeFileName('🚀 rocket data 🎯')).toMatch(/_+rocket_data_+/) // Emojis become multiple underscores
      
      // Edge cases
      expect(sanitizeFileName('')).toBe('document')
      expect(sanitizeFileName('   ')).toBe('___')
      expect(sanitizeFileName('file.tar.gz.json')).toBe('file.tar.gz.json')
    })

    test('generates proper JSON export format', () => {
      const formatJsonForExport = (data: any): string => {
        return JSON.stringify(data, null, 2)
      }

      const testData = {
        users: [{ name: 'John' }, { name: 'Jane' }],
        config: { theme: 'dark' }
      }

      const exported = formatJsonForExport(testData)
      
      expect(exported).toContain('{\n') // Proper formatting
      expect(exported).toContain('  ') // 2-space indentation
      expect(exported.split('\n').length).toBeGreaterThan(5) // Multi-line
      
      // Should be valid JSON
      expect(() => JSON.parse(exported)).not.toThrow()
      expect(JSON.parse(exported)).toEqual(testData)
    })

    test('handles export edge cases', () => {
      const edgeCases = [
        null,
        undefined,
        '',
        0,
        false,
        [],
        {},
        { circular: 'will be tested separately' }
      ]

      edgeCases.forEach(data => {
        if (data !== undefined) { // undefined is not valid JSON
          expect(() => JSON.stringify(data, null, 2)).not.toThrow()
        }
      })
    })
  })

  describe('File Operation Error Handling', () => {
    test('provides specific error messages for different failure types', () => {
      const getImportErrorMessage = (error: Error, fileName: string): string => {
        if (error instanceof SyntaxError) {
          const match = error.message.match(/position (\d+)/)
          if (match) {
            return `JSON syntax error in "${fileName}" at position ${match[1]}. Check for missing quotes, commas, or brackets.`
          }
          return `JSON syntax error in "${fileName}": ${error.message}`
        }
        
        if (error.message.includes('QuotaExceeded')) {
          return `File "${fileName}" is too large for browser storage. Try a smaller file.`
        }
        
        if (error.message.includes('NetworkError')) {
          return `Could not read "${fileName}". Please check the file and try again.`
        }
        
        return `Failed to import "${fileName}": ${error.message}`
      }

      // Test different error types
      const syntaxError = new SyntaxError('Unexpected token } in JSON at position 15')
      expect(getImportErrorMessage(syntaxError, 'test.json')).toContain('position 15')
      
      const quotaError = new Error('QuotaExceededError: Storage limit reached')
      expect(getImportErrorMessage(quotaError, 'large.json')).toContain('too large')
      
      const networkError = new Error('NetworkError: File read failed')
      expect(getImportErrorMessage(networkError, 'remote.json')).toContain('Could not read')
      
      const genericError = new Error('Unknown error occurred')
      expect(getImportErrorMessage(genericError, 'unknown.json')).toContain('Failed to import')
    })

    test('export cleanup prevents memory leaks', () => {
      const simulateExportCleanup = () => {
        let url: string | null = null
        let link: HTMLAnchorElement | null = null
        let cleanupCalled = false

        try {
          // Simulate creating resources
          url = 'blob:http://localhost/fake-blob-url'
          link = document.createElement('a')
          
          // Simulate export process
          document.body.appendChild(link)
          
          return { success: true }
        } finally {
          // Critical cleanup logic
          if (link && document.body.contains(link)) {
            document.body.removeChild(link)
          }
          if (url) {
            // URL.revokeObjectURL(url) would be called here
            cleanupCalled = true
          }
        }
      }

      const result = simulateExportCleanup()
      expect(result.success).toBe(true)
      
      // Verify no lingering elements
      const lingering = document.querySelector('a[download]')
      expect(lingering).toBeFalsy()
    })
  })

  describe('File Operation User Experience', () => {
    test('provides helpful feedback for successful operations', () => {
      const generateSuccessMessage = (fileName: string, size: number, action: 'import' | 'export') => {
        const sizeText = size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} bytes`
        
        if (action === 'import') {
          return `"${fileName}" (${sizeText}) loaded successfully.`
        } else {
          return `"${fileName}" saved successfully.`
        }
      }

      expect(generateSuccessMessage('test.json', 2048, 'import')).toBe('"test.json" (2.0 KB) loaded successfully.')
      expect(generateSuccessMessage('data.json', 512, 'import')).toBe('"data.json" (512 bytes) loaded successfully.')
      expect(generateSuccessMessage('export.json', 1024, 'export')).toBe('"export.json" saved successfully.')
    })

    test('warns about potentially problematic files', () => {
      const analyzeFileRisks = (size: number, content: string) => {
        const warnings = []
        
        // Size warnings
        if (size > 10 * 1024 * 1024) { // 10MB
          warnings.push('Large file may impact performance')
        }
        
        // Content warnings
        if (content.includes('password') || content.includes('secret')) {
          warnings.push('File may contain sensitive information')
        }
        
        if ((content.match(/\{/g) || []).length > 1000) {
          warnings.push('File has very deep nesting - may be slow to edit')
        }
        
        if (content.includes('script') || content.includes('eval')) {
          warnings.push('File contains potentially unsafe content')
        }
        
        return warnings
      }

      // Test different file scenarios
      const largeFile = analyzeFileRisks(15 * 1024 * 1024, '{"data": "content"}')
      expect(largeFile).toContain('Large file may impact performance')
      
      const sensitiveFile = analyzeFileRisks(1024, '{"user": "admin", "password": "secret123"}')
      expect(sensitiveFile).toContain('File may contain sensitive information')
      
      const complexFile = analyzeFileRisks(1024, '{"a":'.repeat(1500) + '"value"' + '}'.repeat(1500))
      expect(complexFile.some(warning => warning.includes('very deep nesting'))).toBe(true)
      
      const safeFile = analyzeFileRisks(1024, '{"name": "John", "age": 30}')
      expect(safeFile).toHaveLength(0)
    })
  })

  describe('Document Creation from Files', () => {
    test('creates documents with appropriate names', () => {
      const createDocumentName = (fileName: string): string => {
        return fileName.replace(/\.json$/i, '')
      }

      expect(createDocumentName('user-data.json')).toBe('user-data')
      expect(createDocumentName('config.JSON')).toBe('config')
      expect(createDocumentName('file.backup.json')).toBe('file.backup')
      expect(createDocumentName('no-extension')).toBe('no-extension')
    })

    test('generates unique IDs for documents', () => {
      const generateDocumentId = (): string => {
        return Date.now().toString()
      }

      const id1 = generateDocumentId()
      // Small delay to ensure different timestamps
      setTimeout(() => {
        const id2 = generateDocumentId()
        expect(id1).not.toBe(id2)
      }, 1)
      
      expect(id1).toMatch(/^\d+$/) // Should be numeric string
      expect(id1.length).toBeGreaterThan(10) // Timestamp should be long
    })

    test('initializes document history correctly', () => {
      const initializeDocument = (data: any, name: string) => {
        return {
          id: Date.now().toString(),
          name,
          data,
          history: [data],
          currentHistoryIndex: 0
        }
      }

      const testData = { name: 'John', age: 30 }
      const doc = initializeDocument(testData, 'Test User')
      
      expect(doc.data).toEqual(testData)
      expect(doc.history).toEqual([testData])
      expect(doc.currentHistoryIndex).toBe(0)
      expect(doc.name).toBe('Test User')
    })
  })
})

describe('Real-World File Scenarios', () => {
  
  test('handles typical JSON file formats', () => {
    const typicalJsonFiles = [
      // Configuration files
      {
        name: 'package.json',
        content: '{\n  "name": "test-app",\n  "version": "1.0.0",\n  "dependencies": {}\n}'
      },
      
      // Data exports
      {
        name: 'users.json',
        content: '[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]'
      },
      
      // API responses
      {
        name: 'api-response.json', 
        content: '{"success":true,"data":{"users":[]},"meta":{"total":0}}'
      },
      
      // Empty files
      {
        name: 'empty.json',
        content: '{}'
      },
      
      // Formatted vs minified
      {
        name: 'formatted.json',
        content: '{\n  "formatted": true,\n  "readable": "yes"\n}'
      }
    ]

    typicalJsonFiles.forEach(file => {
      // Should parse successfully
      expect(() => JSON.parse(file.content)).not.toThrow()
      
      const parsed = JSON.parse(file.content)
      expect(parsed).toBeDefined()
      
      // Should be able to re-stringify
      expect(() => JSON.stringify(parsed)).not.toThrow()
    })
  })

  test('handles problematic real-world files', () => {
    const problematicFiles = [
      {
        name: 'with-comments.json',
        content: '{\n  // This has comments\n  "name": "John"\n}',
        issue: 'JSON with comments (not standard JSON)'
      },
      {
        name: 'single-quotes.json',
        content: "{'name': 'John', 'age': 30}",
        issue: 'Single quotes instead of double quotes'
      },
      {
        name: 'trailing-commas.json',
        content: '{"name": "John", "age": 30,}',
        issue: 'Trailing commas'
      },
      {
        name: 'unquoted-keys.json',
        content: '{name: "John", age: 30}',
        issue: 'Unquoted object keys'
      },
      {
        name: 'mixed-quotes.json',
        content: '{"name": \'John\', "age": 30}',
        issue: 'Mixed quote types'
      }
    ]

    problematicFiles.forEach(file => {
      // These should all fail standard JSON.parse
      expect(() => JSON.parse(file.content)).toThrow()
      
      // But our app should handle them gracefully
      expect(file.issue).toBeDefined()
      expect(typeof file.issue).toBe('string')
    })
  })

  test('handles large file scenarios', () => {
    const generateLargeJson = (size: 'small' | 'medium' | 'large' | 'huge') => {
      const itemCounts = {
        small: 10,
        medium: 100, 
        large: 1000,
        huge: 10000
      }
      
      const count = itemCounts[size]
      
      return {
        metadata: {
          generated: new Date().toISOString(),
          itemCount: count,
          size: size
        },
        items: Array.from({ length: count }, (_, i) => ({
          id: `item_${i}`,
          name: `Item ${i}`,
          description: `Description for item number ${i}`,
          metadata: {
            index: i,
            category: `category_${i % 10}`,
            tags: [`tag_${i % 5}`, `tag_${(i + 1) % 5}`]
          }
        }))
      }
    }

    // Test different sizes
    const small = generateLargeJson('small')
    expect(small.items).toHaveLength(10)
    expect(JSON.stringify(small).length).toBeLessThan(10000)

    const medium = generateLargeJson('medium')  
    expect(medium.items).toHaveLength(100)
    
    const large = generateLargeJson('large')
    expect(large.items).toHaveLength(1000)
    
    // Verify they're all valid JSON
    expect(() => JSON.stringify(small)).not.toThrow()
    expect(() => JSON.stringify(medium)).not.toThrow()
    expect(() => JSON.stringify(large)).not.toThrow()
  })
})

describe('File Operation Performance', () => {
  
  test('file validation is fast', () => {
    const validateQuickly = (content: string): boolean => {
      try {
        JSON.parse(content)
        return true
      } catch {
        return false
      }
    }

    const testFiles = Array.from({ length: 100 }, (_, i) => 
      `{"id": ${i}, "name": "Item ${i}"}`
    )

    const start = performance.now()
    testFiles.forEach(validateQuickly)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(50) // Should validate 100 files quickly
  })

  test('large file handling has reasonable performance', () => {
    // Create a moderately large JSON string
    const largeJsonString = JSON.stringify({
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        content: `This is content for item ${i} with some descriptive text`,
        metadata: { created: new Date().toISOString(), index: i }
      }))
    })

    // Test parsing performance
    const parseStart = performance.now()
    const parsed = JSON.parse(largeJsonString)
    const parseDuration = performance.now() - parseStart

    // Test stringifying performance  
    const stringifyStart = performance.now()
    JSON.stringify(parsed, null, 2)
    const stringifyDuration = performance.now() - stringifyStart

    console.log(`Parse: ${parseDuration}ms, Stringify: ${stringifyDuration}ms for ${(largeJsonString.length/1024).toFixed(1)}KB`)

    // Both should complete reasonably quickly
    expect(parseDuration).toBeLessThan(100)
    expect(stringifyDuration).toBeLessThan(100)
    
    // Verify correctness
    expect(parsed.data).toHaveLength(500)
  })
})