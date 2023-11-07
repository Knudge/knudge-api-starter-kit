export default function openWindow(
  ...args: [url?: string | URL, target?: string, features?: string]
): WindowProxy | null {
  const otherWindow = window.open(...args);

  if (!otherWindow) {
    return null;
  }

  const { close } = otherWindow;
  const closePromise = new Promise(resolve => {
    otherWindow!.window.close = () => { resolve(undefined); };
  });

  (async () => {
    await closePromise;
    close();
  })().catch(console.error);

  return otherWindow;
}
