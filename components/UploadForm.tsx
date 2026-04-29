'use client'

import { useState } from 'react'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { boolean, z } from 'zod'
import { Upload, FileUp, X, Volume2 } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { checkBookExists, createBook, saveBookSegments } from '@/lib/actions/book.actions'
import { useRouter } from 'next/navigation'
import { parsePDFFile } from '@/lib/utils'
import { upload } from '@vercel/blob/client'

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
  const { userId } = useAuth()
  const router = useRouter()

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookUploadFormData>({
    resolver: zodResolver(bookUploadSchema),
    defaultValues: {
      voice: 'dave',
    },
  })
 

  const onPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setPdfError('PDF must be less than 50MB')
        setPdfFile(null)
      } else if (file.type !== 'application/pdf') {
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
    // Ensure user is authenticated
    if (!userId) {
      toast.error('You must be signed in to upload a book')
      return
    }
    
    // Validate PDF file is selected
    if (!pdfFile) {
      setPdfError('PDF file is required')
      toast.error('Please select a PDF file to upload')
      return
    }

    setIsSubmitting(true)
    try {
      // Check book exist
      const existsCheckResponse = await checkBookExists(data.title)
      if (existsCheckResponse.exists) {
        toast.error('A book with this title already exists')
        router.push(`/books/${existsCheckResponse.data.slug}`)
        setIsSubmitting(false)
        return
      }

      const pdfTitle = data.title.trim().toLowerCase().replace(/\s+/g, '-')
      const parsedPdf = await parsePDFFile(pdfFile)

      if (!parsedPdf || parsedPdf.content.length === 0) {
        toast.error("Failed to extract content from PDF. Please ensure the file is a valid PDF and try again.")
        setIsSubmitting(false)
        return
      }

      const uploadedPdfBlob = await upload(pdfTitle, pdfFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        contentType: 'application/pdf'
      });

      let coverUrl: string | undefined = undefined
      if(coverFile && coverFile.size > 0){
        const uploadedCoverBlob = await upload(`${pdfTitle}-cover`, coverFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          contentType: coverFile.type
        });
        coverUrl = uploadedCoverBlob.url
      }
      else{
        const response = await fetch(parsedPdf.cover)
        coverUrl = response.url
        const blob = await response.blob()

        const uploadedCoverBlob = await upload(`${pdfTitle}-cover`, blob, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          contentType: blob.type
        });
        coverUrl = uploadedCoverBlob.url
      }

      const book = await createBook({
        clerkId: userId,
        title: data.title,
        author: data.author,
        persona: data.voice,
        fileURL: uploadedPdfBlob.url,
        fileBlobKey: uploadedPdfBlob.pathname,
        coverURL: coverUrl,
        fileSize: pdfFile.size,
      })

      if(!book || !book.success){
        toast.error('Failed to create book. Please try again.')
        setIsSubmitting(false)
        return
      }

      if(book.alreadyExists){
        toast.error('A book with this title already exists')
        router.push(`/books/${book.data.slug}`)
        setIsSubmitting(false)
        return
      }

      const segments = await saveBookSegments(book.data._id, userId, parsedPdf.content)

      if(!segments.success){
        toast.error("Failed to save book segments.")
        setIsSubmitting(false)
        return
      }

      toast.success('Book uploaded and processed successfully!')
      router.push(`/books/${book.data.slug}`)
    } 
    catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to upload book')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="loading-wrapper">
          <div className="loading-shadow-wrapper bg-(--bg-card)">
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
              className="form-input border border-(--border-subtle)"
              {...register('title')}
            />
            {errors.title && (
              <span className="text-red-500 text-sm">{errors.title.message}</span>
            )}
          </div>

          {/* Author Input */}
          <div className="space-y-2">
            <label className="form-label">Author Name</label>
            <input
              type="text"
              placeholder="ex: Robert Kiyosaki"
              className="form-input border border-(--border-subtle)"
              {...register('author')}
            />
            {errors.author && (
              <span className="text-red-500 text-sm">{errors.author.message}</span>
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
            className="form-btn"
          >
            Begin Synthesis
          </button>
        </form>
      </div>
    </>
  )
}
