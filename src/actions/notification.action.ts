"use server"

import prisma from "@/lib/prisma"
import { getDbUserId } from "./user.action"

export async function getNotification(){
    try {
        const userId=await getDbUserId()
        if(!userId) return []

        const notification=await prisma.notification.findMany({
            where:{
                userId
            },
            include:{
                creator:{
                    select:{
                        id:true,
                        name:true,
                        username:true,
                        image:true
                    }
                },
                post:{
                    select:{
                        id:true,
                        content:true,
                        image:true
                    }
                },
                comment:{
                    select:{
                        id:true,
                        content:true,
                        createdAt:true
                    }
                }
            }
            ,orderBy:{
                createdAt:"desc"
            }
        })
        return notification
    } catch (error) {
        console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
    }
}

export async function markNotificationAsRead(notificationIds:string[]){
    try {
       await prisma.notification.updateMany({
        where:{
            id:{
                in:notificationIds
            }
        },
        data:{
            read:true
        }
       }) 
    } catch (error) {
        console.log(error);
        return{success:false}
        
    }
}