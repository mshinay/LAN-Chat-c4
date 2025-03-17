import { fileTypeFromBlob } from 'file-type'
export function encodeMessage(fileId: string, chunk: Uint8Array) {
    const encoder = new TextEncoder()
    const fileIdBytes = encoder.encode(fileId) // 将 fileId 转为 Uint8Array
    const fileIdLength = fileIdBytes.length

    const buffer = new ArrayBuffer(4 + fileIdLength + chunk.length)
    const view = new DataView(buffer)

    // 存储 fileId 长度（4字节整数）
    view.setUint32(0, fileIdLength, true)

    // 存储 fileId
    new Uint8Array(buffer, 4, fileIdLength).set(fileIdBytes)

    // 存储 chunk 数据
    new Uint8Array(buffer, 4 + fileIdLength).set(chunk)

    return buffer
}


export function decodeMessage(buffer: ArrayBuffer) {
    const view = new DataView(buffer)
    const fileIdLength = view.getUint32(0, true) // 读取 fileId 长度
    const fileIdBytes = new Uint8Array(buffer, 4, fileIdLength) // 读取 fileId
    const fileId = new TextDecoder().decode(fileIdBytes)

    const chunk = new Uint8Array(buffer, 4 + fileIdLength) // 读取 chunk 数据

    return { fileId, chunk }
}

// 根据文件名猜测MIME类型
export function guessFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime',
        'webm': 'video/webm'
    }

    return extension && extension in mimeTypes
        ? mimeTypes[extension]
        : 'application/octet-stream'
}

export async function getMimeType(blob: Blob) {
    const type = await fileTypeFromBlob(blob)
    return type?.mime || blob.type || 'application/octet-stream'
}

export async function generateBlobURL(chunks: BlobPart[], fileName: string) {
    const blob = new Blob(chunks)
    const mimeType = await getMimeType(blob) // 用 file-type 获取 MIME
    const blobUrl = URL.createObjectURL(blob)

    console.log(`生成的 Blob URL: ${blobUrl}`)
    return { blobUrl, mimeType }
}



// 格式化文件大小
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}