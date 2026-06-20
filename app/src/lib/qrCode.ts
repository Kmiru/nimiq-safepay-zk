import QRCode from 'qrcode'

export async function createQrCodeDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 420,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}