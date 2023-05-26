declare global {
  namespace NodeJS {
    interface Process {
      setSourceMapsEnabled: (enabled: boolean) => void;
    }
  }
}

export function enableSourceMapsSupport() {
  if ('setSourceMapsEnabled' in process) {
    process.setSourceMapsEnabled(true);
  }
}
