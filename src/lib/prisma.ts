import { PrismaClient } from "@prisma/client";

// its just a method that gives a new instance of the Prisma
const prismaClientSinglton = () => {
    return new PrismaClient
}

type prismaClientSinglton = ReturnType<typeof prismaClientSinglton>

// the whole idea for this globalForPrisma is at a global level whenever we need we can just look for this whether you have an instance of connection or u dont have
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? prismaClientSinglton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma