import { ApplicationError } from '@/protocols';

export function paymentNeeded(): ApplicationError {
  return {
    name: 'PaymentNeeded',
    message: 'You need to pay to proceed this action',
  };
}
