export interface LocationBookmark {
  id: string;
  label: string;
  provider: 'gdrive' | 'onedrive' | 'virtual';
  folderId: string | null; // null represents Root Directory
  folderName: string;
  pathStack: { id: string | null; name: string }[];
  createdAt: number;
}

const STORAGE_KEY = 'mason_location_bookmarks';

export const getLocationBookmarks = (): LocationBookmark[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
};

export const saveLocationBookmarks = (bookmarks: LocationBookmark[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent('mason_bookmarks_updated', { detail: bookmarks }));
  } catch (err) {
    console.warn('Failed to save location bookmarks:', err);
  }
};

export const addLocationBookmark = (
  provider: 'gdrive' | 'onedrive' | 'virtual',
  folderId: string | null,
  folderName: string,
  pathStack: { id: string | null; name: string }[],
  customLabel?: string
): { bookmark: LocationBookmark; created: boolean } => {
  const current = getLocationBookmarks();
  
  // Check if bookmark for exact provider and folderId already exists
  const existing = current.find(b => b.provider === provider && b.folderId === folderId);
  if (existing) {
    return { bookmark: existing, created: false };
  }

  const defaultLabel = customLabel?.trim() || folderName || (
    provider === 'gdrive' ? 'Google Drive Root' :
    provider === 'onedrive' ? 'OneDrive Root' :
    'Virtual Drive'
  );

  const newBookmark: LocationBookmark = {
    id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    label: defaultLabel,
    provider,
    folderId,
    folderName: folderName || defaultLabel,
    pathStack: pathStack && pathStack.length > 0 ? pathStack : [{ id: folderId, name: folderName || defaultLabel }],
    createdAt: Date.now()
  };

  const updated = [newBookmark, ...current];
  saveLocationBookmarks(updated);
  return { bookmark: newBookmark, created: true };
};

export const removeLocationBookmark = (id: string): LocationBookmark[] => {
  const current = getLocationBookmarks();
  const updated = current.filter(b => b.id !== id);
  saveLocationBookmarks(updated);
  return updated;
};

export const toggleLocationBookmark = (
  provider: 'gdrive' | 'onedrive' | 'virtual',
  folderId: string | null,
  folderName: string,
  pathStack: { id: string | null; name: string }[],
  customLabel?: string
): { isBookmarked: boolean; bookmarks: LocationBookmark[] } => {
  const current = getLocationBookmarks();
  const existing = current.find(b => b.provider === provider && b.folderId === folderId);
  if (existing) {
    const updated = removeLocationBookmark(existing.id);
    return { isBookmarked: false, bookmarks: updated };
  } else {
    const res = addLocationBookmark(provider, folderId, folderName, pathStack, customLabel);
    return { isBookmarked: true, bookmarks: getLocationBookmarks() };
  }
};

export const isLocationBookmarked = (
  provider: 'gdrive' | 'onedrive' | 'virtual',
  folderId: string | null
): boolean => {
  const current = getLocationBookmarks();
  return current.some(b => b.provider === provider && b.folderId === folderId);
};
