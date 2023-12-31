import enrollmentsService from '../enrollments-service';
import { paymentNeeded } from '@/errors/needPayment';
import { notFoundError } from '@/errors';
import hotelsRepository from '@/repositories/hotel-repository';
import ticketsRepository from '@/repositories/tickets-repository';

async function findAvailableHotelById(userId: number, hotelId: number) {
  await checkValidHotel(userId);

  const hotelWithRooms = await hotelsRepository.findAvailableHotelById(hotelId);
  if (!hotelWithRooms) throw notFoundError();
  const { id, name, image, createdAt, updatedAt, Rooms } = hotelWithRooms;
  return {
    id,
    name,
    image,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    Rooms: Rooms.map((room: any) => ({
      ...room,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    })),
  };
}

async function findHotel(userId: number) {
  const enrollment = await enrollmentsService.findEnrollmentByUserId(userId);
  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket) throw notFoundError();

  const { isRemote, includesHotel } = ticket.TicketType;
  const notPaid = ticket.status === 'RESERVED';
  if (!includesHotel || isRemote || notPaid) throw paymentNeeded();

  const hotels = await hotelsRepository.findHotel();
  if (!hotels || !hotels.length) throw notFoundError();

  return hotels;
}

async function checkValidHotel(userId: number) {
  await findHotel(userId);
}

const hotelsService = {
  findAvailableHotelById,
  findHotel,
};

export default hotelsService;