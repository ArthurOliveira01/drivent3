import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import httpStatus from 'http-status';
import supertest from 'supertest';
import * as jwt from 'jsonwebtoken';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createEnrollmentWithAddress,
  generateRooms,
  generateHotel,
  createTicket,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createTicketTypeWithoutHotel,
  createUser,
} from '../factories';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const testServer = supertest(app);

describe('GET /hotels', () => {
  describe('when the token is valid', () => {
    it('should respond with status 404 when the user does not have an enrollment yet', async () => {
      const validToken = await generateValidToken();

      const { statusCode } = await testServer.get('/hotels').set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 404 when the user does not have a ticket yet', async () => {
      const user = await createUser();
      const validToken = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const { statusCode } = await testServer.get('/hotels').set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 404 when no hotel exists', async () => {
      const user = await createUser();
      const validToken = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const { statusCode } = await testServer.get('/hotels').set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 402 if the ticket was not paid', async () => {
      const user = await createUser();
      const validToken = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await generateHotel();
      const { statusCode } = await testServer.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it('should respond with status 402 if the ticket type is remote', async () => {
      const user = await createUser();
      const validToken = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await generateHotel();
      const { statusCode } = await testServer.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it('should respond with status 402 if the ticket type does not include a hotel', async () => {
      const user = await createUser();
      const validToken = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithoutHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await generateHotel();
      const { statusCode } = await testServer.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.PAYMENT_REQUIRED);
    });

    it('should respond with status 200 and the hotel with an empty rooms array if the hotel has no rooms', async () => {
      const user = await createUser();
      const validToken = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await generateHotel();

      const { statusCode, body } = await testServer.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.OK);
      expect(body).toEqual(
        expect.objectContaining({
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
          Rooms: [],
        }),
      );
    });

    it('should respond with status 200 and the hotel with a list of rooms', async () => {
      const user = await createUser();
      const validToken = await generateValidToken(user);

      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await generateHotel();
      for (let i = 0; i < 5; i++) {
        await generateRooms(hotel.id);
      }
      const { statusCode, body: hotelWithRooms } = await testServer
        .get(`/hotels/${hotel.id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(statusCode).toEqual(httpStatus.OK);
      expect(hotelWithRooms.Rooms).toHaveLength(5);
      expect(hotelWithRooms).toEqual(
        expect.objectContaining({
          id: hotel.id,
          name: hotel.name,
          image: hotel.image,
          createdAt: hotel.createdAt.toISOString(),
          updatedAt: hotel.updatedAt.toISOString(),
          Rooms: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              capacity: expect.any(Number),
              hotelId: expect.any(Number),
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
            }),
          ]),
        }),
      );
    });
  });

  describe('when the token is invalid', () => {
    it('should respond with status 401 when providing an invalid token', async () => {
      const invalidToken = faker.random.word();

      const response = await testServer.get('/hotels').set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 when not providing a token', async () => {
      const response = await testServer.get('/hotels');

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for the given token', async () => {
      const userWithoutSession = await createUser();
      const invalidToken = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

      const response = await testServer.get('/hotels').set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });
});