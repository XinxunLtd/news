'use client'

import { useMemo, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onImageAdded?: (base64: string, file: File) => void // Callback untuk mengirim base64 dan File ke parent
}

export default function RichTextEditor({ value, onChange, placeholder, onImageAdded }: RichTextEditorProps) {
  // Store onImageAdded in ref to avoid recreating modules
  const onImageAddedRef = useRef(onImageAdded)
  
  useEffect(() => {
    onImageAddedRef.current = onImageAdded
  }, [onImageAdded])
  
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: [] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ['clean'],
        ],
        handlers: {
          image: function(this: any) {
            const input = document.createElement('input')
            input.setAttribute('type', 'file')
            input.setAttribute('accept', 'image/*')
            input.click()

            input.onchange = async () => {
              const file = input.files?.[0]
              if (!file) return

              // Validate file type
              const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/heic', 'image/heif', 'image/webp', 'image/gif']
              const allowedExtensions = ['.png', '.jpg', '.jpeg', '.heic', '.heif', '.webp', '.gif']
              const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

              if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
                toast.error('Format file tidak didukung. Gunakan PNG, JPG, JPEG, HEIC, WEBP, atau GIF')
                return
              }

              // Validate file size (max 10MB)
              if (file.size > 10 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 10MB')
                return
              }

              // Convert to base64 for preview
              const reader = new FileReader()
              reader.onload = () => {
                const base64 = reader.result as string
                // Use 'this' context which refers to the quill instance
                const quill = this.quill
                if (quill) {
                  const range = quill.getSelection()
                  const index = range ? range.index : quill.getLength()
                  
                  // Insert image with base64 placeholder
                  quill.insertEmbed(index, 'image', base64)
                  
                  // Notify parent about new image (base64 and file)
                  if (onImageAddedRef.current) {
                    onImageAddedRef.current(base64, file)
                  }
                }
              }
              reader.readAsDataURL(file)
            }
          },
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [] // Empty deps - modules should be stable
  )

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'align',
    'color',
    'background',
  ]

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Tulis konten artikel di sini...'}
        className="bg-white"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 400px;
          font-size: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .rich-text-editor .ql-editor {
          min-height: 400px;
          line-height: 1.8;
        }
        .rich-text-editor .ql-editor p {
          margin-bottom: 1em;
        }
        .rich-text-editor .ql-editor h1,
        .rich-text-editor .ql-editor h2,
        .rich-text-editor .ql-editor h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 700;
        }
        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
        }
        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
        }
        .rich-text-editor .ql-editor h3 {
          font-size: 1.25em;
        }
        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
        }
        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #fe7d17;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #666;
        }
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        .rich-text-editor .ql-editor a {
          color: #fe7d17;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

