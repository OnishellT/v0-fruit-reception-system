/**
 * Download a file from base64 encoded data
 */
export function downloadFile(
    base64: string,
    filename: string,
    mimeType: string
) {
    const blob = base64ToBlob(base64, mimeType);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mimeType });
}
