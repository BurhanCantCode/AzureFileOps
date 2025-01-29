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

export const getFileTypeIcon = (filename) => {
  if (!filename) return 'file';
  
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return 'file';
  
  for (const [type, extensions] of Object.entries(fileExtensions)) {
    if (extensions.includes(extension)) {
      return type;
    }
  }
  
  return 'file';
};

export const isPreviewable = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  
  return [
    ...fileExtensions.image,
    ...fileExtensions.document.filter(ext => ext === 'pdf' || ext === 'txt'),
    ...fileExtensions.code,
  ].includes(extension);
};

export const getContentType = (filename) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
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
    txt: 'text/plain',
    
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