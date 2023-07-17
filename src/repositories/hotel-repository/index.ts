import { prisma } from '@/config';

async function findHotel() {
  return await prisma.hotel.findMany();
}

async function findAvailableHotelById(hotelId: number) {
  return await prisma.hotel.findUnique({
    where: { id: hotelId },
    include: {
      Rooms: true,
    },
  });
}

const hotelRepository = {
  findHotel,
  findAvailableHotelById,
};

export default hotelRepository;
