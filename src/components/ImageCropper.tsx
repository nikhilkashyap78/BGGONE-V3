import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
    imageFile: File;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageFile, onCropComplete, onCancel }: ImageCropperProps) {
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const reader = new FileReader();
        reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
        reader.readAsDataURL(imageFile);
    }, [imageFile]);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        const crop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                width / height,
                width,
                height,
            ),
            width,
            height,
        );
        setCrop(crop);
    }

    async function handleCrop() {
        if (!completedCrop || !imgRef.current) return;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('No 2d context');
        }

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
        );

        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Canvas is empty');
                return;
            }
            onCropComplete(blob);
        }, 'image/png');
    }

    return (
        <div className="card fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Crop Your Image</h2>

            {!!imgSrc && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', overflow: 'hidden', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                    <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)}>
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imgSrc}
                            style={{ maxHeight: '60vh', objectFit: 'contain' }}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={onCancel}>
                    Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCrop}>
                    Crop & Process
                </button>
            </div>
        </div>
    );
}
