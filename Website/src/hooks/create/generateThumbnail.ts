export const generateThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // For non-image files, just return object URL directly
    if (!file.type.startsWith("image/")) {
      resolve(URL.createObjectURL(file));
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      // Fallback if canvas context isn't available
      resolve(URL.createObjectURL(file));
      return;
    }

    img.onload = () => {
      // Calculate thumbnail dimensions (max 1200px on longest side)
      const maxSize = 900;
      let { width, height } = img;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image to canvas (this creates the thumbnail)
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to data URL (compressed JPEG)
      const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Clean up the original image URL
      URL.revokeObjectURL(img.src);

      resolve(thumbnailDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(URL.createObjectURL(file));
    };

    img.src = URL.createObjectURL(file);
  });
};
