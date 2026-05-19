const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;

export const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      resolve(file);
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      if (width > height && width > MAX_DIMENSION) {
        height = (height * MAX_DIMENSION) / width;
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = (width * MAX_DIMENSION) / height;
        height = MAX_DIMENSION;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(img.src);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
    img.src = URL.createObjectURL(file);
  });
};
