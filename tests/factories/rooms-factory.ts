import faker from '@faker-js/faker';
import { prisma } from '@/config';

export async function generateRooms(hotelId: number) {
  return await prisma.room.create({
    data: {
      hotelId: hotelId,
      capacity: faker.datatype.number(),
      name: faker.commerce.department(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.future(),
    },
  });
}
