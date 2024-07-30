import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

function AppSetting() {
  const click = () => {
    console.log("aaa")
    toast("hhhhh")
  }

  return (
    <>
      <div>
      <Toaster/>
      <Button onClick={click}>Submit</Button>
      </div>
    </>
  );
}

export default AppSetting;
