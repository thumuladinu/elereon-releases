// Helper to handle client routing cleanly in both Web and Desktop (Electron/file://) environments
export const safeNavigate = (path) => {
  const isElectron = window.navigator.userAgent.includes('Electron') || window.location.protocol === 'file:';
  if (isElectron) {
    const hashPath = path.startsWith('/') ? path : `/${path}`;
    window.location.hash = `#${hashPath}`;
  } else {
    window.location.href = path;
  }
};
