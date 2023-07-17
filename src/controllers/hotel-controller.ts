import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import hotelsService from '@/services/hotel-service';

type AuthenticatedRequestWithParam = AuthenticatedRequest & { params: { hotelId: number } };

export async function getHotelWithRoomsById(req: AuthenticatedRequestWithParam, res: Response) {
  const { hotelId } = req.params;
  const { userId } = req;

  const hotelWithRooms = await hotelsService.findAvailableHotelById(userId, Number(hotelId));

  res.send(hotelWithRooms).status(httpStatus.OK);
}

export async function getEveryHotel(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const hotels = await hotelsService.findHotel(userId);

  res.send(hotels).status(httpStatus.OK);
}