import { ProjectData, parseProjectJson } from './projectStorage';

const ONEDRIVE_TOKEN_KEY = 'mourne_onedrive_access_token';
const ONEDRIVE_USER_KEY = 'mourne_onedrive_user_info';
const ONEDRIVE_FOLDER_ID_KEY = 'mourne_onedrive_folder_id';
const ONEDRIVE_FOLDER_NAME_KEY = 'mourne_onedrive_folder_name';
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
  const hash = window.location.hash || window.location.search;
  if (hash.includes('access_token=')) {
    const urlParams = new URLSearchParams(hash.substring(1));
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
  }
}

export const getActiveCloudProvider = (): CloudProvider => {
  return (localStorage.getItem(ACTIVE_CLOUD_PROVIDER_KEY) as CloudProvider) || 'gdrive';
};

export const setActiveCloudProvider = (provider: CloudProvider) => {
  localStorage.setItem(ACTIVE_CLOUD_PROVIDER_KEY, provider);
};

export const getOneDriveToken = (): string | null => {
  return localStorage.getItem(ONEDRIVE_TOKEN_KEY);
};

export const setOneDriveToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(ONEDRIVE_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ONEDRIVE_TOKEN_KEY);
  }
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
 * Connects to Microsoft OneDrive via OAuth Popup / Access Token Prompt
 */
export const authenticateOneDrive = async (manualToken?: string, customClientId?: string): Promise<string> => {
  if (manualToken) {
    setOneDriveToken(manualToken);
    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${manualToken}` }
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem(ONEDRIVE_USER_KEY, JSON.stringify({
          displayName: user.displayName || user.userPrincipalName,
          email: user.mail || user.userPrincipalName
        }));
      }
    } catch (e) {
      console.warn('OneDrive profile fetch failed:', e);
    }
    setActiveCloudProvider('onedrive');
    return manualToken;
  }

  // Popup flow for Microsoft Account OAuth
  return new Promise((resolve, reject) => {
    const redirectUri = window.location.href.split('#')[0].split('?')[0];
    const scopes = encodeURIComponent('files.readwrite user.read offline_access');
    const clientId = customClientId?.trim() || (import.meta as any).env?.VITE_ONEDRIVE_CLIENT_ID || localStorage.getItem('mourne_onedrive_client_id') || 'c1001aef-9d0f-4875-8272-b8cfabcf3afd';
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

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

    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'ONEDRIVE_AUTH_SUCCESS' && event.data.token) {
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
        } catch (e) {
          console.warn('Profile fetch error:', e);
        }
        cleanup();
        resolve(token);
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setInterval(() => {
      if (isHandled) return;

      const currentToken = getOneDriveToken();
      if (currentToken) {
        cleanup();
        setActiveCloudProvider('onedrive');
        resolve(currentToken);
        return;
      }

      try {
        if (popup.closed) {
          cleanup();
          const token = getOneDriveToken();
          if (token) {
            setActiveCloudProvider('onedrive');
            resolve(token);
          } else {
            reject(new Error('OneDrive login window was closed before authorization was completed.'));
          }
          return;
        }

        if (popup.location.href.includes('#access_token=') || popup.location.href.includes('?access_token=')) {
          const urlParams = new URLSearchParams(popup.location.hash.substring(1) || popup.location.search.substring(1));
          const accessToken = urlParams.get('access_token');
          if (accessToken) {
            setOneDriveToken(accessToken);
            setActiveCloudProvider('onedrive');
            cleanup();
            resolve(accessToken);
          }
        }
      } catch (err) {
        // Cross-origin restriction while popup is on microsoftonline.com
      }
    }, 400);
  });
};

export const disconnectOneDrive = () => {
  localStorage.removeItem(ONEDRIVE_TOKEN_KEY);
  localStorage.removeItem(ONEDRIVE_USER_KEY);
};

/**
 * Lists items (folders and files) inside a specific OneDrive directory for the virtual file browser
 */
export const listOneDriveFolderContents = async (folderId?: string | null): Promise<OneDriveItem[]> => {
  const token = getOneDriveToken();
  if (!token) return [];

  let endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor:/children?$select=id,name,folder,file,lastModifiedDateTime,size,@microsoft.graph.downloadUrl`;
  
  if (folderId && folderId !== 'approot' && folderId !== 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children?$select=id,name,folder,file,lastModifiedDateTime,size,@microsoft.graph.downloadUrl`;
  } else if (folderId === 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,folder,file,lastModifiedDateTime,size,@microsoft.graph.downloadUrl`;
  }

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) disconnectOneDrive();
    return [];
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
  const token = getOneDriveToken();
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
  options: { isBackup?: boolean } = {}
): Promise<OneDriveFileInfo> => {
  let token = getOneDriveToken();
  if (!token) throw new Error('Not connected to Microsoft OneDrive.');

  const safeName = (project.name || 'mason_world').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const extension = '.mason';
  const prefix = options.isBackup ? '[BACKUP]_' : '';
  const fileName = `${prefix}${safeName}_${project.id}${extension}`;

  const body = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });

  const selectedFolder = getOneDriveSelectedFolder();
  let endpoint = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/MasonMapEditor/${encodeURIComponent(fileName)}:/content`;

  if (selectedFolder.id && selectedFolder.id !== 'approot' && selectedFolder.id !== 'root') {
    endpoint = `https://graph.microsoft.com/v1.0/me/drive/items/${selectedFolder.id}:/${encodeURIComponent(fileName)}:/content`;
  } else if (selectedFolder.id === 'root') {
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
 * Lists project files on OneDrive in current active folder
 */
export const listOneDriveProjects = async (): Promise<OneDriveFileInfo[]> => {
  const token = getOneDriveToken();
  if (!token) return [];

  const items = await listOneDriveFolderContents(getOneDriveSelectedFolder().id);
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
  const token = getOneDriveToken();
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

