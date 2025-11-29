'use client'

import { useState, Fragment } from 'react'
import { FiX } from 'react-icons/fi'

interface RewardModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number) => void
  newsTitle?: string
}

export default function RewardModal({ isOpen, onClose, onConfirm, newsTitle }: RewardModalProps) {
  const [amount, setAmount] = useState('0')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    
    if (isNaN(numAmount) || numAmount < 0) {
      setError('Jumlah reward tidak valid')
      return
    }

    onConfirm(numAmount)
    setAmount('0')
    setError('')
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Set Reward</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {newsTitle && (
              <p className="text-sm text-gray-600 mb-4">
                Artikel: <span className="font-semibold text-gray-900">{newsTitle}</span>
              </p>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah Reward (Rupiah)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError('')
                }}
                min="0"
                step="0.01"
                className="input-field w-full"
                placeholder="0"
                required
              />
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Masukkan 0 jika tidak ada reward
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-[#fe7d17] text-white rounded-lg hover:bg-[#e66d0f] transition-colors"
              >
                Set Reward
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

