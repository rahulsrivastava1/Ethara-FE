export function parseApiError(text, status) {
  if (!text?.trim()) {
    return `Request failed (${status})`
  }

  try {
    const data = JSON.parse(text)

    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (typeof item === 'string') return item
          if (item?.msg) return item.msg
          if (item?.message) return item.message
          return String(item)
        })
        .join(', ')
    }

    if (typeof data.message === 'string') {
      return data.message
    }

    if (typeof data.error === 'string') {
      return data.error
    }
  } catch {
    // plain text response
  }

  return text
}
