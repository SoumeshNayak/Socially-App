"use client"

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import { toggleFollow } from "@/actions/user.action";
import toast from "react-hot-toast";

function FollowButton({ userId }: { userId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const handleFollow=async()=>{
        setIsLoading(true)
        try {
            await toggleFollow(userId)
            toast.success("Followed successfully")
        } catch (error) {
            console.log(error);
            toast.error("Unable to follow")
        }finally{
            setIsLoading(false)
        }
    }
  return (
    <div>
       <Button
      size={"sm"}
      variant={"secondary"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-20"
    >
      {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Follow"}
    </Button>
    </div>
  )
}

export default FollowButton
