'use client'

import { useState } from 'react'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, FileUp, X, Volume2 } from 'lucide-react'

// Zod validation schema
const bookUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  author: z.string().min(1, 'Author name is required').max(100, 'Author name is too long'),
  voice: z.enum(['dave', 'daniel', 'chris', 'rachel', 'sarah']),
})

type BookUploadFormData = z.infer<typeof bookUploadSchema>

const maleVoices = [
  { id: 'dave', name: 'Dave', description: 'Warm and engaging' },
  { id: 'daniel', name: 'Daniel', description: 'Professional and clear' },
  { id: 'chris', name: 'Chris', description: 'Friendly and energetic' },
]

const femaleVoices = [
  { id: 'rachel', name: 'Rachel', description: 'Calm and serene' },
  { id: 'sarah', name: 'Sarah', description: 'Bright and dynamic' },
]

export default function UploadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const form = useForm<BookUploadFormData>({
    resolver: zodResolver(bookUploadSchema),
    defaultValues: {
      voice: 'dave',
    },
  })

  type UploadFormValues = z.infer<typeof bookUploadSchema>

  const {
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(bookUploadSchema),
    defaultValues: {
      voice: 'rachel',
    },
  })

  const onPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setPdfError('PDF must be less than 50MB')
        setPdfFile(null)
      } else if (!file.type.includes('pdf')) {
        setPdfError('Please upload a valid PDF file')
        setPdfFile(null)
      } else {
        setPdfError(null)
        setPdfFile(file)
      }
    }
  }

  const onCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
    }
  }

  const removePdf = () => {
    setPdfFile(null)
    setPdfError(null)
  }

  const removeCover = () => {
    setCoverFile(null)
  }

  const onSubmit: SubmitHandler<BookUploadFormData> = async (data) => {
    // Validate PDF file is selected
    if (!pdfFile) {
      setPdfError('PDF file is required')
      return
    }

    setIsSubmitting(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('pdf', pdfFile)
      if (coverFile) {
        formData.append('coverImage', coverFile)
      }
      formData.append('title', data.title)
      formData.append('author', data.author)
      formData.append('voice', data.voice)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log('Form submitted with files:', {
        ...data,
        pdf: pdfFile.name,
        coverImage: coverFile?.name || 'auto-generate',
      })
      // Handle form submission here
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="loading-wrapper">
          <div className="loading-shadow-wrapper bg-[var(--bg-card)]">
            <div className="loading-shadow">
              <div className="loading-animation">
                <Upload className="w-12 h-12 text-[#663820]" />
              </div>
              <h2 className="loading-title">Processing Your Book</h2>
              <div className="loading-progress">
                <div className="loading-progress-item">
                  <div className="loading-progress-status" />
                  <span>Uploading PDF...</span>
                </div>
                <div className="loading-progress-item">
                  <div className="loading-progress-status" />
                  <span>Generating synthesis...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="new-book-wrapper">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* PDF Upload */}
          <div className="space-y-2">
            <label className="form-label">PDF File Upload</label>
            <label className="upload-dropzone cursor-pointer" htmlFor="pdf-input">
              <FileUp className="upload-dropzone-icon" />
              {pdfFile ? (
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2 px-4">
                    <span className="upload-dropzone-text truncate">{pdfFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        removePdf()
                      }}
                      className="upload-dropzone-remove"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="upload-dropzone-text">Click to upload PDF</span>
                  <span className="upload-dropzone-hint">PDF file (max 50MB)</span>
                </>
              )}
            </label>
            <input
              id="pdf-input"
              type="file"
              accept=".pdf"
              onChange={onPdfChange}
              className="hidden"
            />
            {pdfError && <span className="text-red-500 text-sm">{pdfError}</span>}
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <label className="form-label">Cover Image</label>
            <label className="upload-dropzone cursor-pointer" htmlFor="cover-input">
              <Upload className="upload-dropzone-icon" />
              {coverFile ? (
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2 px-4">
                    <span className="upload-dropzone-text truncate">{coverFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        removeCover()
                      }}
                      className="upload-dropzone-remove"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="upload-dropzone-text">Click to upload cover image</span>
                  <span className="upload-dropzone-hint">Leave empty to auto-generate from PDF</span>
                </>
              )}
            </label>
            <input
              id="cover-input"
              type="file"
              accept="image/*"
              onChange={onCoverChange}
              className="hidden"
            />
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label className="form-label">Title</label>
            <input
              type="text"
              placeholder="ex: Rich Dad Poor Dad"
              className="form-input border border-[var(--border-subtle)]"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <span className="text-red-500 text-sm">{form.formState.errors.title.message}</span>
            )}
          </div>

          {/* Author Input */}
          <div className="space-y-2">
            <label className="form-label">Author Name</label>
            <input
              type="text"
              placeholder="ex: Robert Kiyosaki"
              className="form-input border border-[var(--border-subtle)]"
              {...form.register('author')}
            />
            {form.formState.errors.author && (
              <span className="text-red-500 text-sm">{form.formState.errors.author.message}</span>
            )}
          </div>

          {/* Voice Selector */}
          <div className="space-y-4">
            <label className="form-label">Choose Assistant Voice</label>
            {/* Voice Selector */}
            <div>
              {/* Male Voices */}
              <div>
                <p className="text-sm font-medium text-[#222c37] mb-3">Male Voices</p>
                <Controller
                  name="voice"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      {maleVoices.map((voice) => (
                        <label
                          key={voice.id}
                          className={`voice-selector-option cursor-pointer ${
                            field.value === voice.id
                              ? 'voice-selector-option-selected'
                              : 'voice-selector-option-default'
                          }`}
                        >
                          <input
                            type="radio"
                            name="voice"
                            value={voice.id}
                            checked={field.value === voice.id}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-5 h-5 cursor-pointer accent-[#663820]"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-[#212a3b]">{voice.name}</p>
                            <p className="text-sm text-[#3d485e]">{voice.description}</p>
                          </div>
                          <Volume2 className="volume" />
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Female Voices */}
              <div>
                <p className="text-sm font-medium text-[#222c37] mb-3">Female Voices</p>
                <Controller
                  name="voice"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-3">
                      {femaleVoices.map((voice) => (
                        <label
                          key={voice.id}
                          className={`voice-selector-option cursor-pointer ${
                            field.value === voice.id
                              ? 'voice-selector-option-selected'
                              : 'voice-selector-option-default'
                          }`}
                        >
                          <input
                            type="radio"
                            name="voice"
                            value={voice.id}
                            checked={field.value === voice.id}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-5 h-5 cursor-pointer accent-[#663820]"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-[#212a3b]">{voice.name}</p>
                            <p className="text-sm text-[#3d485e]">{voice.description}</p>
                          </div>
                          <Volume2 className="volume" />
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>
              {errors.voice && (
                <p className="text-red-500 text-sm mt-2">{errors.voice.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="form-btn disabled:opacity-75 disabled:cursor-not-allowed"
          >
            Begin Synthesis
          </button>
        </form>
      </div>
    </>
  )
}
