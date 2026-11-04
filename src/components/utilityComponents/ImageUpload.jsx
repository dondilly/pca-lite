import { useRef, useState } from 'react'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024

export function ImageUpload({
  imageFile,
  setImageFile,
  imagePreview,
  setImagePreview,
  imageError,
  setImageError,
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  function chooseFile(file) {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Choose a valid image file.')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('The image must be no larger than 2 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageFile(file)
        setImagePreview(reader.result)
        setImageError('')
      } else {
        setImageError('Unable to preview the selected image.')
      }
    }
    reader.onerror = () => {
      setImageError('Unable to preview the selected image.')
    }
    reader.readAsDataURL(file)
  }

  function handleInputChange(event) {
    chooseFile(event.target.files?.[0])
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    if (!disabled) {
      chooseFile(event.dataTransfer.files?.[0])
    }
  }

  return (
    <div>
      <div
        className={`border border-2 border-dashed rounded p-4 text-center ${
          isDragging ? 'border-primary bg-primary-subtle' : 'border-secondary'
        }`}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        aria-label="Drop an image here or choose a file"
      >
        <p className="mb-2">Drag and drop an image here</p>
        <p className="text-muted small mb-3">Image files up to 2 MB</p>
        <input
          ref={inputRef}
          id="item-image"
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Choose image
        </button>
      </div>
      {imagePreview && (
        <div className="mt-2">
          <img
            src={imagePreview}
            alt="Item image preview"
            className="img-thumbnail"
            style={{ maxWidth: 160, maxHeight: 160 }}
          />
          <div className="small text-muted">{imageFile?.name}</div>
        </div>
      )}
      {imageError && (
        <p className="text-danger mt-2" role="alert">
          {imageError}
        </p>
      )}
    </div>
  )
}
