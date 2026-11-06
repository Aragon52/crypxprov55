import { Loader2 } from "lucide-react";

interface CubeSpinnerProps {
  fullScreen?: boolean;
  label?: string;
}

const CubeSpinner = ({ fullScreen, label }: CubeSpinnerProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
};

export default CubeSpinner;
