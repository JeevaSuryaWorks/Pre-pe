import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import getCroppedImg from '@/lib/cropImage';

interface ImageCropperModalProps {
    imageSrc: string;
    isOpen: boolean;
    onClose: () => void;
    onCropComplete: (croppedFile: File) => void;
    aspect?: number;
}

export function ImageCropperModal({ imageSrc, isOpen, onClose, onCropComplete, aspect = 1.6 }: ImageCropperModalProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropCompleteLocal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleConfirmCrop = async () => {
        if (!croppedAreaPixels) return;
        try {
            const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (croppedFile) {
                onCropComplete(croppedFile);
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] h-[80vh] sm:h-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-black border-slate-800 fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] sm:rounded-2xl">
                <DialogHeader className="p-4 bg-black/90 text-white absolute top-0 z-20 w-full border-b border-white/10 backdrop-blur-md">
                    <DialogTitle className="text-center font-bold">Crop Verification Document</DialogTitle>
                </DialogHeader>

                <div className="relative flex-1 w-full h-full bg-slate-950 mt-14 mb-16">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={onCropCompleteLocal}
                        onZoomChange={setZoom}
                        objectFit="contain"
                        style={{
                            containerStyle: { background: 'black' },
                        }}
                    />
                </div>

                <DialogFooter className="p-4 bg-black/90 absolute bottom-0 z-20 w-full border-t border-white/10 flex-row gap-3 justify-between sm:justify-end backdrop-blur-md">
                    <Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmCrop} className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-1/2 sm:w-auto">
                        Confirm & Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
