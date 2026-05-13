import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface UpdateDialogProps {
  isOpen: boolean;
  version: string;
}

export const UpdateDialog = ({ isOpen, version }: UpdateDialogProps) => {
  const handleUpdate = () => {
    window.open('https://play.google.com/store/apps/details?id=com.prepe.app', '_blank');
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-xs rounded-[32px] p-8">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-black">New Update Available</DialogTitle>
          <DialogDescription className="font-bold text-slate-400">
            Version {version} is now available on Play Store with new features and fixes.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          <Button 
            onClick={handleUpdate}
            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black"
          >
            UPDATE NOW
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
