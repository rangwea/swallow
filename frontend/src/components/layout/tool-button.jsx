import { forwardRef } from "react";
import { icons } from "lucide-react";
import { Button } from "@/components/ui/button";

const ToolButton = forwardRef(function ToolButton({ icon, label, ...props }, ref) {
  const Icon = icons[icon];
  return <Button ref={ref} variant="ghost" size="icon" type="button"
    title={label} aria-label={label} {...props}>
    <Icon size={20} strokeWidth={1.75} />
  </Button>;
});
export default ToolButton;
