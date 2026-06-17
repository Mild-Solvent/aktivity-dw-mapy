/**
 * Compresses an image File using HTML Canvas and outputs a WebP image File.
 * Falls back to the original file if not supported, if size doesn't improve,
 * or if there's any error.
 *
 * @param {File} file - Original image file
 * @param {number} quality - Compression quality (0 to 1)
 * @param {number} maxDimension - Max width or height in pixels
 * @returns {Promise<File>} Compressed WebP file or original file
 */
export async function compressImageToWebp(file, quality = 0.85, maxDimension = 1920) {
  if (!file || !file.type.startsWith('image/')) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Rescale if exceeding max dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            // Fall back to original file if the WebP compressed size is actually larger
            if (blob.size >= file.size) {
              resolve(file)
            } else {
              const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image'
              const newName = `${baseName}.webp`
              const compressedFile = new File([blob], newName, {
                type: 'image/webp',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            }
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => {
        resolve(file)
      }

      img.src = e.target.result
    }

    reader.onerror = () => {
      resolve(file)
    }

    reader.readAsDataURL(file)
  })
}
