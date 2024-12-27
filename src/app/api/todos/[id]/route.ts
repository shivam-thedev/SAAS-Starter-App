import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest,{ params }: { params: { id: string } }) {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { completed } = await req.json();
      const todoId = params.id;

      const todo = await prisma.todo.findUnique({
        where: { id: todoId },
      });

      if (!todo) {
        return NextResponse.json({ error: "Todo not found" }, { status: 404 });
      }

      if (todo.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updatedTodo = await prisma.todo.update({
        where: { id: todoId },
        data: { completed },
      });

      return NextResponse.json(updatedTodo);
    } catch (error) {
      console.error("Error in getting subscription", error);
      return NextResponse.json(
        { error: "Internal Server error" },
        { status: 500 }
      );
    }
  }

export async function DELETE(req:NextRequest,{params}:{params: {id:string}}){
    const { userId } = await auth()

    if(!userId){
        return NextResponse.json({error:"Unauthorised"},{status:400})
    }

    try {
        const todoId = params.id
        const todo = await prisma.todo.findUnique({
            where:{id:todoId}
        })

        if(!todo){
            return NextResponse.json({error:"Todo not found"},{status:400})
        }

        if(todo.userId !== userId){
            return NextResponse.json({error:"Forbidden"},{status:403})
        }

        await prisma.todo.delete({
            where:{id:todoId}
        })

        return NextResponse.json({message:"todo deleted successfully"},{status:400})
        
    } catch (error) {
        console.error("Error in getting subscription",error)
        return NextResponse.json({error:"Internal Server error"},{status:500})
    }
}