import { ProjectData, parseProjectJson } from './projectStorage';
import { getProjectMasonFileName } from './masonStorage';

const ONEDRIVE_TOKEN_KEY = 'mourne_onedrive_access_token';
const ONEDRIVE_USER_KEY = 'mourne_onedrive_user_info';
const ONEDRIVE_FOLDER_ID_KEY = 'mourne_onedrive_folder_id';
const ONEDRIVE_FOLDER_NAME_KEY = 'mourne_onedrive_folder_name';
const ONEDRIVE_TENANT_KEY = 'mourne_onedrive_tenant_endpoint';
const ACTIVE_CLOUD_PROVIDER_KEY = 'mourne_active_cloud_provider';

export type CloudProvider = 'gdrive' | 'onedrive';

export interface OneDriveItem {
  id: string;
  name: string;
  isFolder: boolean;
  modifiedTime: string;
  size?: number;
  downloadUrl?: string;
  isBackup?: boolean;
}

export interface OneDriveFileInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: number;
  downloadUrl?: string;
  isBackup?: boolean;
}

export interface OneDriveUser {
  displayName?: string;
  email?: string;
}

// Check if window is loaded as an OAuth popup callback
if (typeof window !== 'undefined' && window.opener) {
  const paramsStr = window.location.search || window.location.hash;
  if (paramsStr.includes('code=')) {
    const urlParams = new URLSearchParams(paramsStr.startsWith('?') || paramsStr.startsWith('#') ? paramsStr.substring(1) : paramsStr);
    const code = urlParams.get('code');
    if (code) {
      try {
        window.opener.postMessage({ type: 'ONEDRIVE_AUTH_CODE', code }, '*');
      } catch (e) {
        console.warn('Failed to postMessage to window.opener', e);
      }
      setTimeout(() => {
        try { window.close(); } catch {}
      }, 100);
    }
  } else if (paramsStr.includes('access_token=')) {
    const urlParams = new URLSearchParams(paramsStr.startsWith('?') || paramsStr.startsWith('#') ? paramsStr.substring(1) : paramsStr);
    const token = urlParams.get('access_token');
    if (token) {
      localStorage.setItem(ONEDRIVE_TOKEN_KEY, token);
      try {
        window.opener.postMessage({ type: 'ONEDRIVE_AUTH_SUCCESS', token }, '*');
      } catch (e) {
        console.warn('Failed to postMessage to window.opener', e);
      }
      setTimeout(() => {
        try { window.close(); } catch {}
      }, 100);
    }
  } else if (paramsStr.includes('error=')) {
    const urlParams = new URLSearchParams(paramsStr.startsWith('?') || paramsStr.startsWith('#') ? paramsStr.substring(1) : paramsStr);
    const errorDesc = urlParams.get('error_description') || urlParams.get('error') || 'OAuth authorization failed';
    try {
      window.opener.postMessage({ type: 'ONEDRIVE_AUTH_ERROR', error: errorDesc }, '*');
    } catch (e) {
      console.warn('Failed to postMessage error to window.opener', e);
    }
    setTimeout(() => {
      try { window.close(); } catch {}
    }, 100);
  }
}

export const getActiveCloudProvider = (): CloudProvider => {
  return (localStorage.getItem(ACTIVE_CLOUD_PROVIDER_KEY) as CloudProvider) || 'gdrive';
};

export const setActiveCloudProvider = (provider: CloudProvider) => {
  localStorage.setItem(ACTIVE_CLOUD_PROVIDER_KEY, provider);
};

const ONEDRIVE_REFRESH_TOKEN_KEY = 'mourne_onedrive_refresh_token';
const ONEDRIVE_TOKEN_EXPIRY_KEY = 'mourne_onedrive_token_expiry';
const ONEDRIVE_CLIENT_ID_KEY = 'mourne_onedrive_client_id';

export const getOneDriveClientId = (): string => {
  return localStorage.getItem(ONEDRIVE_CLIENT_ID_KEY) || (import.meta as any).env?.VITE_ONEDRIVE_CLIENT_ID || '';
};

export const setOneDriveClientId = (clientId: string) => {
  if (clientId && clientId.trim()) {
    localStorage.setItem(ONEDRIVE_CLIENT_ID_KEY, clientId.trim());
  } else {
    localStorage.removeItem(ONEDRIVE_CLIENT_ID_KEY);
  }
};

export const getOneDriveTenant = (): string => {
  return localStorage.getItem(ONEDRIVE_TENANT_KEY) || 'common';
};

export const setOneDriveTenant = (tenant: string) => {
  if (tenant && tenant.trim()) {
    localStorage.setItem(ONEDRIVE_TENANT_KEY, tenant.trim());
  } else {
    localStorage.setItem(ONEDRIVE_TENANT_KEY, 'common');
  }
};

export const getOneDriveToken = (): string | null => {
  return localStorage.getItem(ONEDRIVE_TOKEN_KEY);
};

export const setOneDriveToken = (token: string | null, expiresIn?: number) => {
  if (token) {
    localStorage.setItem(ONEDRIVE_TOKEN_KEY, token);
    if (expiresIn) {
      localStorage.setItem(ONEDRIVE_TOKEN_EXPIRY_KEY, (Date.now() + expiresIn * 1000).toString());
    }
  } else {
    localStorage.removeItem(ONEDRIVE_TOKEN_KEY);
    localStorage.removeItem(ONEDRIVE_TOKEN_EXPIRY_KEY);
    localStorage.removeItem(ONEDRIVE_REFRESH_TOKEN_KEY);
  }
};

export const setOneDriveRefreshToken = (refreshToken: string) => {
  localStorage.setItem(ONEDRIVE_REFRESH_TOKEN_KEY, refreshToken);
};

export const getOneDriveRefreshToken = (): string | null => {
  return localStorage.getItem(ONEDRIVE_REFRESH_TOKEN_KEY);
};

export const isOneDriveTokenExpired = (): boolean => {
  const expiry = localStorage.getItem(ONEDRIVE_TOKEN_EXPIRY_KEY);
  if (!expiry) return false; // Legacy fallback
  return Date.now() > parseInt(expiry, 10) - 5 * 60 * 1000; // 5 min buffer
};

export const isOneDriveBackupEnabled = (): boolean => {
  return true; // Cloud backup is always active when connected
};

export const getOneDriveSelectedFolder = () => {
  return {
    id: localStorage.getItem(ONEDRIVE_FOLDER_ID_KEY) || null,
    name: localStorage.getItem(ONEDRIVE_FOLDER_NAME_KEY) || 'App Root / MasonMapEditor'
  };
};

export const setOneDriveSelectedFolder = (id: string | null, name: string) => {
  if (id) {
    localStorage.setItem(ONEDRIVE_FOLDER_ID_KEY, id);
  } else {
    localStorage.removeItem(ONEDRIVE_FOLDER_ID_KEY);
  }
  localStorage.setItem(ONEDRIVE_FOLDER_NAME_KEY, name);
};

export const getOneDriveUser = (): OneDriveUser | null => {
  const data = localStorage.getItem(ONEDRIVE_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Formats Microsoft OAuth error messages into friendly guidance
 */
export const formatMicrosoftAuthError = (rawError: string): string => {
  const lower = rawError.toLowerCase();
  if (lower.includes('unauthorized_client') || lower.includes('does not exist or is not enabled for consumers')) {
    return 'Microsoft Login Error: The Azure App Registration is not enabled for Personal Microsoft accounts. In Azure Portal, set Supported Account Types to "Personal Microsoft accounts" or "Accounts in any organizational directory and personal Microsoft accounts" (signInAudience: AzureADandPersonalMicrosoftAccount).';
  }
  if (lower.includes('redirect_uri') || lower.includes('reply address')) {
    return `Microsoft Login Error: The current redirect URI (${window.location.origin}) is not registered in the Azure App Registration's Single-Page Application (SPA) redirect URIs.`;
  }
  return rawError;
};

/**
 * Generates a random PKCE code verifier
 */
const generateCodeVerifier = () => {
  const array = new Uint32Array(56 / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec => ('0' + dec.toString(16)).substring(-2)).join('') || '1234567890123456789012345678901234567890123';
};

/**
 * Computes SHA-256 code challenge for PKCE
 */
const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Refreshes the OneDrive token if possible
 */
export const refreshOneDriveTokenSilently = async (): Promise<string | null> => {
  const refreshToken = getOneDriveRefreshToken();
  const clientId = getOneDriveClientId() || 'c1001aef-9d0f-4875-8272-b8cfabcf3afd';
  const tenant = getOneDriveTenant() || 'common';
  
  if (!refreshToken) return null;

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (res.ok) {
      const data = await res.json();
      setOneDriveToken(data.access_token, data.expires_in);
      if (data.refresh_token) {
        setOneDriveRefreshToken(data.refresh_token);
      }
      return data.access_token;
    } else {
      console.warn('Failed to refresh OneDrive token silently', await res.text());
      setOneDriveToken(null);
      return null;
    }
  } catch (err) {
    console.warn('Network error refreshing OneDrive token', err);
    return null;
  }
};

/**
 * Gets a valid token, refreshing if necessary
 */
export const ensureOneDriveToken = async (): Promise<string> => {
  const token = getOneDriveToken();
  if (token && !isOneDriveTokenExpired()) {
    return token;
  }
  const newToken = await refreshOneDriveTokenSilently();
  if (newToken) return newToken;
  throw new Error('Microsoft OneDrive authorization expired. Please reconnect.');
};

/**
 * Connects to Microsoft OneDrive via standard OAuth Popup
 */
export const authenticateOneDrive = async (
  customTenant?: string,
  customClientId?: string
): Promise<string> => {
  // First, check if we can silently refresh instead of opening a popup
  if (getOneDriveRefreshToken()) {
    const refreshed = await refreshOneDriveTokenSilently();
    if (refreshed) {
      setActiveCloudProvider('onedrive');
      return refreshed;
    }
  }

  return new Promise(async (resolve, reject) => {
    const redirectUri = window.location.href.split('#')[0].split('?')[0];
    const scopes = encodeURIComponent('files.readwrite user.read offline_access');
    const tenant = customTenant?.trim() || getOneDriveTenant() || 'common';
    const clientId = customClientId?.trim() || getOneDriveClientId() || 'c1001aef-9d0f-4875-8272-b8cfabcf3afd';
    
    if (!clientId) {
      reject(new Error('Azure Application (Client ID) is missing.'));
      return;
    }

    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    const authUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&code_challenge=${challenge}&code_challenge_method=S256`;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(authUrl, 'OneDrive Authorization', `width=${width},height=${height},top=${top},left=${left}`);

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'));
      return;
    }

    let isHandled = false;

    const cleanup = () => {
      isHandled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener('message', handleMessage);
      if (popup && !popup.closed) {
        try { popup.close(); } catch {}
      }
    };

    const exchangeCodeForToken = async (code: string) => {
      try {
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        params.append('code_verifier', verifier);

        const res = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });

        if (res.ok) {
          const data = await res.json();
          setOneDriveToken(data.access_token, data.expires_in);
          if (data.refresh_token) {
            setOneDriveRefreshToken(data.refresh_token);
          }
          setActiveCloudProvider('onedrive');

          try {
            const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
              headers: { Authorization: `Bearer ${data.access_token}` }
            });
            if (meRes.ok) {
              const user = await meRes.json();
              localStorage.setItem(ONEDRIVE_USER_KEY, JSON.stringify({
                displayName: user.displayName || user.userPrincipalName,
                email: user.mail || user.userPrincipalName
              }));
            }
          } catch (e) {}
          
          resolve(data.access_token);
        } else {
          const errText = await res.text();
          reject(new Error(`Failed to exchange code for token: ${errText}`));
        }
      } catch (err: any) {
        reject(new Error(`Network error during token exchange: ${err.message}`));
      }
    };

    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'ONEDRIVE_AUTH_CODE' && event.data.code) {
        cleanup();
        await exchangeCodeForToken(event.data.code);
      } else if (event.data && event.data.type === 'ONEDRIVE_AUTH_SUCCESS' && event.data.token) {
        const token = event.data.token;
        setOneDriveToken(token);
        setActiveCloudProvider('onedrive');
        try {
          const res = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const user = await res.json();
            localStorage.setItem(ONEDRIVE_USER_KEY, JSON.stringify({
              displayName: user.displayName || user.userPrincipalName,
              email: user.mail || user.userPrincipalName
            }));
          }
        } catch (e) {}
        cleanup();
        resolve(token);
      } else if (event.data && event.data.type === 'ONEDRIVE_AUTH_ERROR') {
        cleanup();
        reject(new Error(formatMicrosoftAuthError(event.data.error || 'OneDrive authorization failed.')));
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setInterval(() => {
      if (isHandled) return;

      const currentToken = getOneDriveToken();
      if (currentToken && !isOneDriveTokenExpired()) {
        cleanup();
        setActiveCloudProvider('onedrive');
        resolve(currentToken);
        return;
      }

      try {
        if (popup.closed) {
          cleanup();
          const token = getOneDriveToken();
          if (token && !isOneDriveTokenExpired()) {
            setActiveCloudProvider('onedrive');
            resolve(token);
          } else {
            reject(new Error('OneDrive login window was closed before authorization was completed.'));
          }
          return;
        }

        if (popup.location.href.includes('code=')) {
          const paramsStr = popup.location.search || popup.location.hash;
          const urlParams = new URLSearchParams(paramsStr.startsWith('?') || paramsStr.startsWith('#') ? paramsStr.substring(1) : paramsStr);
          const code = urlParams.get('code');
          if (code) {
            cleanup();
            exchangeCodeForToken(code).then(resolve).catch(reject);
          }
        }
      } catch (err) {
        // Cross-origin restriction while popup is on microsoftonline.com
      }
    }, 500);
  });
};

export const disconnectOneDrive = () => {
  localStorage.removeItem(ONEDRIVE_TOKEN_KEY);
  localStorage.removeItem(ONEDRIVE_USER_KEY);
};

/**
 * Standard fetch wrapper with a default 10-second timeout to prevent stalling
 */
export const fetchWithTimeout = async (resource: RequestInfo | URL, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 10000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...rest,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your OneDrive connection.');
    }
    throw error;
  }
};


/**
 * Lists items (folders and files) inside a specific OneDrive directory for the virtual file browser
 */
export const listOneDriveFolderContents = async (folderId?: string | null): Promise<OneDriveItem[]> => {
  const token = await ensureOneDriveToken();
  if (!token) return [];

  let endpoint = `https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,folder,file,lastModifiedDateTime,size,@microsoft.graph.downloadUrl`;
  
  if (folderId && folderId !== 'root' && folderId !== 'approot') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$select=id,name,folder,file,lastModifiedDateTime,size,@microsoft.graph.downloadUrl`;
  } else if (folderId === 'approot') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor:/children?$select=id,name,folder,file,lastModifiedDateTime,size,@microsoft.graph.downloadUrl`;
  }

  const res = await fetchWithTimeout(endpoint, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      disconnectOneDrive();
      throw new Error('Microsoft OneDrive authorization expired. Please reconnect.');
    }
    // If approot failed, retry with root
    if (folderId === 'approot') {
      return listOneDriveFolderContents('root');
    }
    const errText = await res.text();
    let msg = `OneDrive error (${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error?.message) msg = parsed.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  return (data.value || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    isFolder: Boolean(item.folder),
    modifiedTime: item.lastModifiedDateTime,
    size: item.size,
    downloadUrl: item['@microsoft.graph.downloadUrl'],
    isBackup: item.name.startsWith('[BACKUP]')
  }));
};

/**
 * Creates a new folder inside OneDrive
 */
export const createOneDriveFolder = async (folderName: string, parentFolderId?: string | null): Promise<OneDriveItem> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to OneDrive.');

  let endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor:/children`;
  if (parentFolderId && parentFolderId !== 'approot' && parentFolderId !== 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`;
  } else if (parentFolderId === 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/root/children`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename'
    })
  });

  if (!res.ok) throw new Error(`Could not create folder on OneDrive (${res.status})`);
  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    isFolder: true,
    modifiedTime: data.lastModifiedDateTime || new Date().toISOString()
  };
};

/**
 * Saves the entire project (all levels, tilesets, settings) to OneDrive
 */
export const saveProjectToOneDrive = async (
  project: ProjectData,
  options: { 
    isBackup?: boolean; 
    customFileName?: string; 
    targetFolderId?: string | null;
    targetFolderName?: string;
  } = {}
): Promise<OneDriveFileInfo> => {
  let token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to Microsoft OneDrive.');

  let fileName = options.customFileName?.trim();
  if (!fileName) {
    const safeName = (project.name || 'mason_world').trim().replace(/[/\\?%*:|"<>]/g, '_');
    const extension = '.mason';
    const prefix = options.isBackup ? '[BACKUP]_' : '';
    fileName = `${prefix}${safeName}${extension}`;
  } else if (!fileName.endsWith('.mason') && !fileName.endsWith('.json')) {
    fileName = `${fileName}.mason`;
  }

  const body = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });

  const targetFolderId = options.targetFolderId !== undefined 
    ? options.targetFolderId 
    : getOneDriveSelectedFolder().id;

  let endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor/${encodeURIComponent(fileName)}:/content`;

  if (targetFolderId && targetFolderId !== 'approot' && targetFolderId !== 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${targetFolderId}:/${encodeURIComponent(fileName)}:/content`;
  } else if (targetFolderId === 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/content`;
  }

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body
  });

  if (!res.ok) {
    if (res.status === 401) {
      disconnectOneDrive();
      throw new Error('OneDrive token expired. Please reconnect.');
    }
    const errText = await res.text();
    throw new Error(`OneDrive upload failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    modifiedTime: data.lastModifiedDateTime || new Date().toISOString(),
    size: data.size,
    downloadUrl: data['@microsoft.graph.downloadUrl'],
    isBackup: options.isBackup
  };
};

/**
 * Deletes a file or folder from OneDrive
 */
export const deleteOneDriveFile = async (fileId: string): Promise<boolean> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to Microsoft OneDrive.');

  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    throw new Error(`Failed to delete OneDrive file (${res.status})`);
  }
  return true;
};

/**
 * Lists project files on OneDrive in current active folder
 */
export const listOneDriveProjects = async (folderId?: string | null): Promise<OneDriveFileInfo[]> => {
  const token = await ensureOneDriveToken();
  if (!token) return [];

  const targetId = folderId !== undefined ? folderId : getOneDriveSelectedFolder().id;
  const items = await listOneDriveFolderContents(targetId);
  return items
    .filter(i => !i.isFolder && (i.name.endsWith('.mason') || i.name.endsWith('.json')))
    .map(i => ({
      id: i.id,
      name: i.name,
      modifiedTime: i.modifiedTime,
      size: i.size,
      downloadUrl: i.downloadUrl,
      isBackup: i.isBackup
    }));
};

/**
 * Loads a full project from OneDrive
 */
export const loadProjectFromOneDrive = async (fileInfo: { id: string; downloadUrl?: string }): Promise<ProjectData> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to OneDrive.');

  let res: Response;
  if (fileInfo.downloadUrl) {
    res = await fetch(fileInfo.downloadUrl);
  } else {
    res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileInfo.id}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  if (!res.ok) throw new Error('Failed to download project content from OneDrive.');

  const text = await res.text();
  return parseProjectJson(text);
};

/**
 * Downloads any file from Microsoft OneDrive as a Base64 Data URL (e.g. images, spritesheets)
 */
export const downloadFileAsDataUrlFromOneDrive = async (fileInfo: { id: string; downloadUrl?: string }): Promise<string> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to Microsoft OneDrive. Please connect your account.');

  let res: Response;
  if (fileInfo.downloadUrl) {
    res = await fetch(fileInfo.downloadUrl);
  } else {
    res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileInfo.id}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  if (!res.ok) {
    if (res.status === 401) {
      disconnectOneDrive();
      throw new Error('Microsoft OneDrive session expired. Please reconnect.');
    }
    throw new Error(`Failed to download file from OneDrive (${res.status})`);
  }

  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert OneDrive image blob to Data URL'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Downloads any text or JSON file from Microsoft OneDrive
 */
export const downloadFileAsTextFromOneDrive = async (fileInfo: { id: string; downloadUrl?: string }): Promise<string> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to Microsoft OneDrive.');

  let res: Response;
  if (fileInfo.downloadUrl) {
    res = await fetch(fileInfo.downloadUrl);
  } else {
    res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileInfo.id}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  if (!res.ok) {
    if (res.status === 401) {
      disconnectOneDrive();
      throw new Error('Microsoft OneDrive session expired. Please reconnect.');
    }
    throw new Error(`Failed to download file from OneDrive (${res.status})`);
  }

  return await res.text();
};

/**
 * Saves an arbitrary string file content to Microsoft OneDrive
 */
export const saveFileToOneDrive = async (
  fileName: string,
  content: string,
  contentType: string,
  options: {
    targetFolderId?: string | null;
  } = {}
) => {
  let token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to Microsoft OneDrive.');

  const body = new Blob([content], { type: contentType });
  const targetFolderId = options.targetFolderId !== undefined 
    ? options.targetFolderId 
    : getOneDriveSelectedFolder().id;

  let endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor/${encodeURIComponent(fileName)}:/content`;

  if (targetFolderId && targetFolderId !== 'approot' && targetFolderId !== 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${targetFolderId}:/${encodeURIComponent(fileName)}:/content`;
  } else if (targetFolderId === 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(fileName)}:/content`;
  }

  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType
    },
    body
  });

  if (!res.ok) {
    if (res.status === 401) {
      disconnectOneDrive();
      throw new Error('OneDrive token expired. Please reconnect.');
    }
    const errText = await res.text();
    throw new Error(`OneDrive upload failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
    modifiedTime: data.lastModifiedDateTime || new Date().toISOString(),
    size: data.size,
    downloadUrl: data['@microsoft.graph.downloadUrl']
  };
};

/**
 * Ensures a subfolder exists inside a parent OneDrive folder
 */
export const ensureOneDriveSubfolder = async (parentFolderId: string, subfolderName: string): Promise<string> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to OneDrive.');

  const contents = await listOneDriveFolderContents(parentFolderId);
  const existingFolder = contents.find(item => item.isFolder && item.name.toLowerCase() === subfolderName.toLowerCase());
  if (existingFolder) {
    return existingFolder.id;
  }

  const created = await createOneDriveFolder(subfolderName, parentFolderId);
  return created.id;
};

/**
 * Checks if a OneDrive folder contains a modular Mason project manifest (project.mason)
 */
export const checkIfOneDriveFolderIsModularProject = async (folderId: string): Promise<boolean> => {
  try {
    const contents = await listOneDriveFolderContents(folderId);
    return contents.some(item => !item.isFolder && item.name.endsWith('.mason'));
  } catch (e) {
    return false;
  }
};

/**
 * Saves a project in modular multi-file format to a selected OneDrive folder workspace
 */
export const saveModularProjectToOneDrive = async (
  project: any,
  folderId: string,
  folderName?: string
): Promise<{ success: boolean; folderId: string; folderName: string }> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to OneDrive.');

  const parentFolderId = folderId || 'root';

  // 1. Write project manifest (e.g. mourne_edris.mason)
  const manifestData = {
    id: project.id,
    name: project.name,
    description: project.description,
    author: project.author,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt || new Date().toISOString(),
    engineVersion: project.engineVersion || '0.258',
    activeModule: project.activeModule,
    activeFiles: project.activeFiles,
    storageLocation: {
      type: 'onedrive',
      targetFolderId: parentFolderId,
      targetFolderName: folderName || 'OneDrive Folder',
      displayName: `OneDrive: ${folderName || 'Project Folder'}`,
      lastSyncedAt: new Date().toISOString(),
      isAutoSyncEnabled: true
    },
    lockInfo: project.lockInfo,
    taskBoard: project.taskBoard,
    fileIndex: {
      maps: (project.fileSystem?.maps || []).map((m: any) => m.fileName),
      biomes: (project.fileSystem?.biomes || []).map((b: any) => b.fileName),
      prefabs: (project.fileSystem?.prefabs || []).map((p: any) => p.fileName),
      ui: (project.fileSystem?.ui || []).map((u: any) => u.fileName),
      game: (project.fileSystem?.game || []).map((g: any) => g.fileName),
      particles: (project.fileSystem?.particles || []).map((p: any) => p.fileName),
      sprites: (project.fileSystem?.sprites || []).map((s: any) => s.fileName),
      behaviors: (project.fileSystem?.behaviors || []).map((b: any) => b.fileName),
      images: (project.fileSystem?.images || []).map((i: any) => i.fileName)
    }
  };

  const manifestFileName = getProjectMasonFileName(project.name);
  await saveFileToOneDrive(manifestFileName, JSON.stringify(manifestData, null, 2), 'application/json', {
    targetFolderId: parentFolderId
  });

  // Helper to write files into a category subfolder
  const writeSubdir = async (subfolderName: string, files: any[]) => {
    if (!files || files.length === 0) return;
    const subFolderId = await ensureOneDriveSubfolder(parentFolderId, subfolderName);
    for (const file of files) {
      const fileName = file.fileName || `${file.id || 'file'}.json`;
      await saveFileToOneDrive(fileName, JSON.stringify(file, null, 2), 'application/json', {
        targetFolderId: subFolderId
      });
    }
  };

  await Promise.all([
    writeSubdir('maps', project.fileSystem?.maps || []),
    writeSubdir('biomes', project.fileSystem?.biomes || []),
    writeSubdir('prefabs', project.fileSystem?.prefabs || []),
    writeSubdir('ui', project.fileSystem?.ui || []),
    writeSubdir('structure', project.fileSystem?.game || []),
    writeSubdir('particles', project.fileSystem?.particles || []),
    writeSubdir('sprites', project.fileSystem?.sprites || []),
    writeSubdir('behaviors', project.fileSystem?.behaviors || []),
    writeSubdir('assets', project.fileSystem?.images || [])
  ]);

  return {
    success: true,
    folderId: parentFolderId,
    folderName: folderName || 'OneDrive Folder'
  };
};

/**
 * Reads a modular project structure from a OneDrive workspace folder
 */
export const readModularProjectFromOneDrive = async (folderId: string, folderName?: string): Promise<any> => {
  const token = await ensureOneDriveToken();
  if (!token) throw new Error('Not connected to OneDrive.');

  const parentFolderId = folderId || 'root';
  const rootItems = await listOneDriveFolderContents(parentFolderId);
  const expectedName = getProjectMasonFileName(folderName);
  const manifestItem = 
    rootItems.find(item => !item.isFolder && item.name === expectedName) ||
    rootItems.find(item => !item.isFolder && item.name.endsWith('.mason')) ||
    rootItems.find(item => item.name === 'project.mason');

  if (!manifestItem) {
    throw new Error('No .mason project manifest found in this OneDrive folder. Please ensure this folder was initialized as a Mason project workspace.');
  }

  const manifestText = await downloadFileAsTextFromOneDrive(manifestItem);
  const manifestData = JSON.parse(manifestText);

  const readSubdirFiles = async (subfolderName: string): Promise<any[]> => {
    const subFolder = rootItems.find(item => item.isFolder && item.name.toLowerCase() === subfolderName.toLowerCase());
    if (!subFolder) return [];

    try {
      const subItems = await listOneDriveFolderContents(subFolder.id);
      const jsonFiles = subItems.filter(item => !item.isFolder && !item.name.startsWith('.'));

      const parsedFiles = await Promise.all(
        jsonFiles.map(async (f) => {
          try {
            const content = await downloadFileAsTextFromOneDrive(f);
            return JSON.parse(content);
          } catch (e) {
            console.warn(`Failed to parse file ${f.name} from OneDrive subfolder ${subfolderName}:`, e);
            return null;
          }
        })
      );

      return parsedFiles.filter(Boolean);
    } catch (e) {
      console.warn(`Failed to read subfolder ${subfolderName} from OneDrive:`, e);
      return [];
    }
  };

  const [maps, biomes, prefabs, ui, game, particles, sprites, behaviors, images] = await Promise.all([
    readSubdirFiles('maps'),
    readSubdirFiles('biomes'),
    readSubdirFiles('prefabs'),
    readSubdirFiles('ui'),
    readSubdirFiles('structure'),
    readSubdirFiles('particles'),
    readSubdirFiles('sprites'),
    readSubdirFiles('behaviors'),
    readSubdirFiles('assets')
  ]);

  return {
    ...manifestData,
    storageLocation: {
      type: 'onedrive',
      displayName: `OneDrive: ${folderName || manifestData.name || 'Project Folder'}`,
      targetFolderId: parentFolderId,
      targetFolderName: folderName || manifestData.name,
      lastSyncedAt: new Date().toISOString(),
      isAutoSyncEnabled: true
    },
    fileSystem: {
      maps,
      biomes,
      prefabs,
      ui,
      game,
      particles,
      sprites,
      behaviors,
      images,
      audio: manifestData.fileSystem?.audio || [],
      docs: manifestData.fileSystem?.docs || []
    }
  };
};

/**
 * Checks if a OneDrive folder already contains a valid Mason project
 */
export const checkExistingOneDriveDirProject = async (folderId: string, folderName?: string): Promise<any | null> => {
  if (!folderId) return null;
  try {
    const proj = await readModularProjectFromOneDrive(folderId, folderName);
    if (proj && (proj.name || proj.id)) return proj;
  } catch (err) {
    // If manifest reading failed, check if folder contains any files or sub-folders
    try {
      const items = await listOneDriveFolderContents(folderId);
      if (items && items.length > 0) {
        return {
          id: `existing_onedrive_${Date.now()}`,
          name: folderName || 'Existing OneDrive Folder Contents',
          description: 'Non-empty OneDrive folder containing existing files',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          engineVersion: '0.268',
          activeModule: 'map_editor'
        };
      }
    } catch {}
  }
  return null;
};


