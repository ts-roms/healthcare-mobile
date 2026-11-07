import createQr from 'qrcode-generator';
import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';

/** Renders a QR code locally from a key. Nothing is sent anywhere to draw it. */
export function QrCodeView({ value, size = 240, color = '#14252F', background = '#FFFFFF' }: { value: string; size?: number; color?: string; background?: string }) {
  const { d, count } = useMemo(() => {
    const qr = createQr(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let path = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) path += `M${c} ${r}h1v1h-1z`;
    return { d: path, count: n };
  }, [value]);

  return (
    <Svg width={size} height={size} viewBox={`-1 -1 ${count + 2} ${count + 2}`} style={{ backgroundColor: background }}>
      <Path d={d} fill={color} />
    </Svg>
  );
}
