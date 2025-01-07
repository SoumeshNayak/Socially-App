"use server"

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

export async function syncUser(){
    try {
        const {userId}=await auth()
        const user=await currentUser()
        if(!userId || !user) return;
        const exixtingUser=await prisma.user.findUnique({
            where:{clerkId: userId}
        })
        if(exixtingUser){
            return exixtingUser;
        }
        const dbUser=await prisma.user.create({
            data:{
                clerkId: userId,
                name: `${user.firstName || ""} ${user.lastName || ""}`,
                username: user.username??user.emailAddresses[0].emailAddress.split("@")[0],
                email: user.emailAddresses[0].emailAddress,
                image: user.imageUrl
            }
        })
        return dbUser
    } catch (error) {
        console.log("Error",error);
        
    }
}
export async function getUserByClerkId(clerkId:string){
    return prisma.user.findUnique({
        where:{
          clerkId
        },
        include:{
            _count:{
                select:{
                    followers:true,
                    following:true,
                    posts:true
                }
            }
        }
    })
}
//Here with the help of clerk id we are getting user id
export async function getDbUserId(){
    const {userId:clerkId}=await auth()
    if(!clerkId) return null

    const user=await getUserByClerkId(clerkId)
    if(!user) throw new Error("User not found")
    return user.id
}

export async function getRandomUsers(){
    try {
        const userId=await getDbUserId()
        if(!userId) return []
        // Get 3 random user exclude overself and user we alredy follow
        const randomUsers=await prisma.user.findMany({
            where:{
                AND:[
                   {NOT:{id:userId}},
                   {NOT:{
                    followers:{
                        some:{
                            followerId:userId
                        }
                    }
                   }} 
                ]
            },
            select:{
                id:true,
                name:true,
                username:true,
                image:true,
                _count:{
                    select:{
                        followers:true
                    }
                }
            },
            take:3
        })
        return randomUsers;
    } catch (error) {
        console.log(error);
        return []
        
    }
}
export async function toggleFollow(targetUserId:string) {
    try {
    const userId=await getDbUserId()
    if(!userId) return []
    if(userId===targetUserId) throw new Error("You can follow yourself")
    
      const existingFollow=await prisma.follows.findUnique({where:{
        followerId_followingId:{
            followerId:userId,
            followingId:targetUserId
        }
      }})
      if(existingFollow){
        //unfolllow
        await prisma.follows.delete({
            where:{
                followerId_followingId:{
                    followerId:userId,
                    followingId:targetUserId
                }
            }
        })
      }else{
        //follow
        await prisma.$transaction([
            prisma.follows.create({
                data:{
                    followerId:userId,
                    followingId: targetUserId
                }
            }),
            prisma.notification.create({
                data:{
                    type:"FOLLOW",
                    userId:targetUserId,
                    creatorId:userId
                }
            })
        ])
      }
      revalidatePath("/")
      return {success: true}
    } catch (error) {
       console.log(error);
       return {success:false,error}
        
    }
}