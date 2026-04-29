/**
 * FC Career Hub — Logo mark
 * Use <LogoMark size={32} /> anywhere in the app.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo.ico"
      width={size}
      height={size}
      alt="FC Career Hub"
      draggable={false}
      style={{ objectFit: "contain" }}
    />
  );
}
