import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { imports } from './constants';
import { CreateUserDTO } from '../src/user/dto/create-user.dto';

describe('Authentication (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports,
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    const email = faker.internet.email();
    const password = faker.internet.password();

    const user: CreateUserDTO = {
        email,
        password,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
    };

    let jwtToken: string = undefined;
    let refreshToken: string = undefined;

    it('/api/sign-up (POST) 201', () => {
        return request(app.getHttpServer())
            .post('/api/sign-up')
            .set('Accept', 'application/json')
            .send(user)
            .expect(({ body }) => {
                jwtToken = body.accessToken;
                refreshToken = body.refreshToken;

                expect(body.accessToken).toBeDefined();
                expect(body.refreshToken).toBeDefined();
                expect(body.user.email).toEqual(user.email);
                expect(body.user.emailCanonical).toEqual(
                    user.email.toLowerCase(),
                );
                expect(body.user.firstName).toEqual(user.firstName);
                expect(body.user.lastName).toEqual(user.lastName);
                expect(body.user.password).toBeUndefined();
            })
            .expect(HttpStatus.CREATED);
    });

    it('/api/sign-up (POST) 400', () => {
        return request(app.getHttpServer())
            .post('/api/sign-up')
            .set('Accept', 'application/json')
            .send(user)
            .expect(({ body }) => {
                expect(body.message).toEqual('User email already exists');
            })
            .expect(HttpStatus.BAD_REQUEST);
    });

    it('/api/refresh-token (POST) 200', () => {
        return request(app.getHttpServer())
            .post('/api/refresh-token')
            .set('Accept', 'application/json')
            .send({ refreshToken })
            .expect(({ body }) => {
                jwtToken = body.accessToken;
                refreshToken = body.refreshToken;

                expect(body.accessToken).toBeDefined();
                expect(body.refreshToken).toEqual(refreshToken);
                expect(body.user.email).toEqual(user.email);
                expect(body.user.firstName).toEqual(user.firstName);
                expect(body.user.lastName).toEqual(user.lastName);
                expect(body.user).not.toHaveProperty('password');
            })
            .expect(HttpStatus.OK);
    });

    it('/api/users/me (GET) 200', () => {
        return request(app.getHttpServer())
            .get('/api/users/me')
            .set('Accept', 'application/json')
            .set('Authorization', `Bearer ${jwtToken}`)
            .expect(({ body }) => {
                expect(body.email).toEqual(user.email);
                expect(body.firstName).toEqual(user.firstName);
                expect(body.lastName).toEqual(user.lastName);
            })
            .expect(HttpStatus.OK);
    });
});
