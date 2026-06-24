/**
 * Image validation and compression for production uploads.
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const TARGET_MAX_BYTES = 2 * 1024 * 1024

export function validateImageFile(file) {
    if (!file) return { valid: false, error: 'No file selected' }

    if (file.size > MAX_UPLOAD_BYTES) {
        return { valid: false, error: 'Image must be under 10MB' }
    }

    const type = file.type.toLowerCase()
    if (type && !ALLOWED_TYPES.includes(type) && !type.startsWith('image/')) {
        return { valid: false, error: 'Please upload a JPG, PNG, or WebP image' }
    }

    return { valid: true }
}

/**
 * Compress image before upload to reduce storage costs and load times.
 */
export async function compressImage(file, maxBytes = TARGET_MAX_BYTES) {
    if (!file.type.startsWith('image/') || file.size <= maxBytes) {
        return file
    }

    return new Promise((resolve) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)
            const canvas = document.createElement('canvas')
            let { width, height } = img
            const maxDim = 1920

            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height)
                width = Math.round(width * ratio)
                height = Math.round(height * ratio)
            }

            canvas.width = width
            canvas.height = height
            canvas.getContext('2d').drawImage(img, 0, 0, width, height)

            let quality = 0.85
            const tryCompress = () => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob || (blob.size > maxBytes && quality > 0.4)) {
                            quality -= 0.1
                            tryCompress()
                            return
                        }
                        resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file)
                    },
                    'image/jpeg',
                    quality
                )
            }
            tryCompress()
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(file)
        }
        img.src = url
    })
}
