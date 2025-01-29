const fileExtensions = {
  // Images
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  
  // Documents
  document: ['doc', 'docx', 'pdf', 'txt', 'rtf', 'odt'],
  
  // Spreadsheets
  spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
  
  // Presentations
  presentation: ['ppt', 'pptx', 'odp'],
  
  // Archives
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  
  // Audio
  audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a'],
  
  // Video
  video: ['mp4', 'avi', 'mkv', 'mov', 'wmv'],
  
  // Code
  code: [
    'js', 'jsx', 'ts', 'tsx',
    'html', 'css', 'scss', 'less',
    'py', 'java', 'cpp', 'c', 'cs',
    'php', 'rb', 'go', 'rs',
    'json', 'xml', 'yaml', 'yml',
    'md', 'sql'
  ],
};

const getContentType = (filename) => {
  if (!filename) return 'application/octet-stream';
  
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return 'application/octet-stream';
  
  const contentTypes = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    rtf: 'application/rtf',
    
    // Spreadsheets
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    
    // Presentations
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    
    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    
    // Code
    js: 'text/javascript',
    jsx: 'text/javascript',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    html: 'text/html',
    css: 'text/css',
    json: 'application/json',
    xml: 'application/xml',
    md: 'text/markdown',
  };
  
  return contentTypes[extension] || 'application/octet-stream';
};

module.exports = {
  fileExtensions,
  getContentType,
}; 