import { v4 as uuidv4 } from 'uuid';

const normalizePath = (path) => {
  if (!path) return '/';
  // Remove leading and trailing slashes, then add leading slash
  return '/' + path.split('/').filter(Boolean).join('/');
};

export const convertToFileManagerFormat = (files, currentPath = '') => {
  console.log('Converting files to FileManager format:', { files, currentPath });
  
  // Normalize current path for display
  currentPath = normalizePath(currentPath);
  console.log('Normalized current path:', currentPath);
  
  const fileSystem = [
    // Root directory is always present
    { 
      id: '0', 
      name: '/', 
      path: '/', 
      isDir: true,
      parentId: null,
      modDate: new Date().toISOString()
    }
  ];

  // Create a map to store parent-child relationships
  const pathToIdMap = new Map([['/','0']]);

  files.forEach(file => {
    const isDir = file.type === 'folder' || file.isDir === true;
    const fileName = file.originalName || file.name;
    
    // Use the path from the server if available, otherwise build it
    const fullPath = file.path 
      ? normalizePath(file.path)
      : currentPath === '/' 
        ? `/${fileName}`
        : `${currentPath}/${fileName}`;
    
    console.log('Processing file:', { 
      fileName, 
      fullPath, 
      isDir, 
      type: file.type,
      originalPath: file.path 
    });
    
    // Generate unique ID for the file/folder
    const id = uuidv4();
    
    // Find parent ID
    const parentPath = normalizePath(fullPath.split('/').slice(0, -1).join('/'));
    const parentId = pathToIdMap.get(parentPath) || '0';
    
    console.log('Parent info:', { parentPath, parentId });
    
    // Add to path map if it's a directory
    if (isDir) {
      pathToIdMap.set(fullPath, id);
    }
    
    const fileItem = {
      id,
      name: fileName,
      isDir,
      parentId,
      path: fullPath,
      modDate: file.lastModified || new Date().toISOString(),
      size: file.size || 0,
      url: file.url,
      // Store the original path for accurate navigation
      originalPath: file.path,
      // Additional metadata
      type: file.type,
      contentType: file.contentType,
      originalName: file.originalName
    };
    
    console.log('Created file item:', fileItem);
    fileSystem.push(fileItem);
  });

  console.log('Final file system:', fileSystem);
  return fileSystem;
};

export const convertFromFileManagerFormat = (file) => {
  console.log('Converting from FileManager format:', file);
  
  // Use the original path if available, otherwise normalize the current path
  const path = file.originalPath || (file.path.startsWith('/') ? file.path.slice(1) : file.path);
  
  const converted = {
    name: path,
    type: file.isDir ? 'folder' : 'file',
    path: path,
    isDir: file.isDir,
    // Preserve additional metadata
    size: file.size || 0,
    lastModified: file.modDate,
    url: file.url,
    originalName: file.name,
    contentType: file.contentType
  };
  
  console.log('Converted to app format:', converted);
  return converted;
}; 