export type ErrorListener = (message: string) => void

let listener: ErrorListener | null = null

export const showError = (message: string) => {
    if (listener) {
        listener(message)
    } else {
        console.error('Error (no listener attached):', message)
        alert(message) // fallback
    }
}

export const setErrorListener = (l: ErrorListener | null) => {
    listener = l
}
