// Comprime una foto en el propio navegador antes de subirla. Una foto
// sacada directo con la cámara del celular puede pesar varios MB (a veces
// 8-12MB) -- eso a veces ni siquiera llega a nuestro servidor: la
// infraestructura donde corre la app (funciones serverless de Netlify)
// corta pedidos grandes con un error genérico antes de que nuestro código
// pueda dar un mensaje claro. Redimensionar + recomprimir acá evita el
// problema de raíz y de paso hace la subida mucho más rápida.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
// Si ya viene liviana no vale la pena recomprimir (se pierde calidad de
// más sin necesidad).
const SKIP_IF_UNDER_BYTES = 600 * 1024;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= SKIP_IF_UNDER_BYTES) {
    return file;
  }

  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = scaledSize(bitmap.width, bitmap.height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    if ("close" in bitmap) bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // Si algo falla (formato raro, navegador viejo, etc.) subimos el
    // archivo original tal cual en vez de bloquear la carga.
    return file;
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    return await createImageBitmap(file);
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function scaledSize(width: number, height: number) {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) return { width, height };
  const scale = MAX_DIMENSION / Math.max(width, height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
