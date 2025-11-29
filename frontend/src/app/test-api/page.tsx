'use client'

import { useState } from 'react'
import axios from 'axios'

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testBackend = async () => {
    setLoading(true)
    setResult(null)
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1'
    console.log('Testing API URL:', apiUrl)
    
    try {
      // Test 1: Health check
      const healthResponse = await axios.get('http://localhost:8080/health', { timeout: 5000 })
      console.log('Health check:', healthResponse.data)
      
      // Test 2: Categories endpoint
      const categoriesResponse = await axios.get(`${apiUrl}/categories`, { timeout: 5000 })
      console.log('Categories:', categoriesResponse.data)
      
      setResult({
        success: true,
        health: healthResponse.data,
        categories: categoriesResponse.data,
        apiUrl,
      })
    } catch (error: any) {
      console.error('Test error:', error)
      setResult({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status,
        },
        apiUrl,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>
        
        <div className="mb-4">
          <p className="mb-2">API URL: <code className="bg-gray-100 px-2 py-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1'}</code></p>
          <button
            onClick={testBackend}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Testing...' : 'Test Backend Connection'}
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h2 className="font-bold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

