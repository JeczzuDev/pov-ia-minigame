// Expresión regular para validar la estructura básica de una URL
const URL_PATTERN = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/;

// Lista de dominios de nivel superior genéricos (TLDs) válidos
const VALID_TLDS = [
  // Dominios genéricos
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  // Dominios de países
  'ar', 'br', 'cl', 'co', 'es', 'mx', 'pe', 'us', 'uk', 'de', 'fr', 'it', 'jp',
  // Otros TLDs comunes
  'io', 'dev', 'app', 'ai', 'co.uk', 'com.mx', 'org.uk', 'net.au'
];

export const isValidUrl = (url: string): boolean => {
  // Verificar estructura básica de la URL
  if (!URL_PATTERN.test(url)) {
    return false;
  }

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Verificar que el hostname tenga al menos un punto (excepto localhost)
    const hostname = urlObj.hostname;
    if (!hostname.includes('.') && hostname !== 'localhost') {
      return false;
    }

    // Verificar que el dominio tenga una extensión válida
    const domainParts = hostname.split('.');
    const tld = domainParts[domainParts.length - 1].toLowerCase();
    
    // Si no es localhost, verificar que el TLD sea válido
    if (hostname !== 'localhost' && !VALID_TLDS.includes(tld)) {
      // Si el TLD no está en la lista, verificar si es un dominio de nivel superior genérico (gTLD) válido
      // Esto es una verificación básica, podrías querer usar una lista más completa
      if (tld.length < 2 || tld.length > 10) {
        return false;
      }
    }

    // Verificar que el protocolo sea http o https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }

    // Verificar que no sea una IP (opcional, dependiendo de tus requisitos)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

export const normalizeUrl = (url: string): string => {
  if (!url.trim()) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Forzar HTTPS
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }
    
    // Eliminar credenciales
    urlObj.username = '';
    urlObj.password = '';
    
    // Eliminar fragmento
    urlObj.hash = '';
    
    // Normalizar path
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '') || '/';
    
    return urlObj.toString().replace(/([^:]\/)\/+/g, '$1');
  } catch {
    return url;
  }
};

export const checkForDuplicateUrls = (
  urls: string[],
  currentIndex: number
): boolean => {
  const currentUrl = urls[currentIndex]?.trim();
  if (!currentUrl) return false;
  
  const normalizedCurrent = normalizeUrl(currentUrl);
  
  return urls.some((url, index) => {
    if (index === currentIndex || !url.trim()) return false;
    return normalizeUrl(url) === normalizedCurrent;
  });
};
