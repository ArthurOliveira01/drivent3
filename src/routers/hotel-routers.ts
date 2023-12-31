import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { getEveryHotel, getHotelWithRoomsById } from '@/controllers/hotel-controller';

const hotelsRouter = Router();

hotelsRouter.use(authenticateToken);
hotelsRouter.get('/', getEveryHotel);
hotelsRouter.get('/:hotelId', getHotelWithRoomsById);

export { hotelsRouter };
