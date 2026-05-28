import { useEffect, useState } from "react";
import { getImage } from "@/data/db";

export function StoredImageView({
  id,
  className,
  alt,
}: {
  id: string;
  className?: string;
  alt?: string;
}) {
  const [url, setUrl] = useState<string | undefined>();
  useEffect(() => {
    let active = true;
    let u: string | undefined;
    getImage(id).then((img) => {
      if (!active || !img) return;
      u = URL.createObjectURL(img.blob);
      setUrl(u);
    });
    return () => {
      active = false;
      if (u) URL.revokeObjectURL(u);
    };
  }, [id]);
  if (!url) return <div className={`bg-muted ${className ?? ""}`} />;
  return <img src={url} alt={alt ?? ""} className={className} />;
}
