export type Payload = {
    provider: 'google' | 'facebook';
    providerId: string;
    firstName: string;
    lastName: string;
    email: string;
};
