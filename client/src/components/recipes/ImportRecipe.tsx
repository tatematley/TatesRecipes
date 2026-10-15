import { useRef, useState } from 'react'
import { CameraIcon } from '../ui/Icons'
import styles from './ImportRecipe.module.css'

interface ParsedRecipe {
  title: string
  description: string
  category: string
  prepTime: number | null
  cookTime: number | null
  totalTime: number | null
  servings: number | null
  difficulty: string | null
  sourceUrl: string
  sourceName: string
  tatesTips: string
  tags: string[]
  ingredients: { quantity: string; measurement: string; name: string; preparation: string; order: number }[]
  instructions: { step: number; text: string }[]
}

interface PendingImage {
  id: string
  file: File
  preview: string
}

interface Props {
  onImport: (data: ParsedRecipe) => void
  bare?: boolean
}

export function ImportRecipe({ onImport, bare }: Props) {
  const [mode, setMode] = useState<'photo' | 'url'>('photo')
  const [url, setUrl] = useState('')
  const [images, setImages] = useState<PendingImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function addFiles(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        setImages((prev) => [...prev, { id: crypto.randomUUID(), file, preview: e.target?.result as string }])
      }
      reader.readAsDataURL(file)
    })
    setError(null)
    setSuccess(false)
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }

  async function handleImport() {
    setError(null)
    setLoading(true)
    try {
      let body: { images?: { data: string; mediaType: string }[]; url?: string }

      if (mode === 'photo') {
        if (images.length === 0) throw new Error('No photos selected')
        const encoded = await Promise.all(images.map((img) => toBase64(img.file).then((data) => ({ data, mediaType: img.file.type }))))
        body = { images: encoded }
      } else {
        if (!url.trim()) throw new Error('Enter a URL')
        body = { url: url.trim() }
      }

      const resp = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error ?? 'Parse failed')
      }

      const parsed: ParsedRecipe = await resp.json()
      onImport(parsed)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.wrap} ${bare ? styles.bare : ''}`}>
      {!bare && <div className={styles.header}>
        <span className={styles.label}>Import Recipe</span>
        <span className={styles.sub}>Let AI read a photo or URL and fill in the fields for you</span>
      </div>}

      <div className={styles.tabs}>
        <button type="button" className={`${styles.tab} ${mode === 'photo' ? styles.tabActive : ''}`} onClick={() => setMode('photo')}>
          Upload Photos
        </button>
        <button type="button" className={`${styles.tab} ${mode === 'url' ? styles.tabActive : ''}`} onClick={() => setMode('url')}>
          Paste URL
        </button>
      </div>

      {mode === 'photo' && (
        <>
          <div
            className={styles.dropzone}
            onClick={() => fileRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className={styles.dropPrompt}>
              <span className={styles.dropIcon}><CameraIcon size={28} /></span>
              <span>Drop photos here or click to browse</span>
              <span className={styles.dropHint}>Add multiple pages if the recipe spans more than one</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className={styles.hidden}
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }} />
          </div>

          {images.length > 0 && (
            <div className={styles.previewGrid}>
              {images.map((img, i) => (
                <div key={img.id} className={styles.previewThumb}>
                  <img src={img.preview} className={styles.thumbImg} alt={`Page ${i + 1}`} />
                  <span className={styles.pageLabel}>Page {i + 1}</span>
                  <button type="button" className={styles.removeThumb} onClick={() => removeImage(img.id)}>×</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === 'url' && (
        <input
          type="url"
          className="field-input"
          placeholder="https://www.allrecipes.com/recipe/..."
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); setSuccess(false) }}
        />
      )}

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.successMsg}>Imported! Review the fields below and save when ready.</p>}

      <button
        type="button"
        className={styles.importBtn}
        onClick={handleImport}
        disabled={loading || (mode === 'photo' ? images.length === 0 : !url.trim())}
      >
        {loading ? 'Reading recipe…' : 'Import'}
      </button>
    </div>
  )
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
