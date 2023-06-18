import {
  EmailField,
  StringField,
  StringFieldOptional,
} from '../../../decorators/field.decorators';

export class CreateCustomerDto {
  @StringField()
  name: string;

  @EmailField()
  email: string;

  @StringField()
  phone: string;

  @StringField()
  city: string;

  @StringField()
  state: string;

  @StringField()
  country: string;

  @StringField()
  postalCode: string;

  @StringField()
  addressLine1: string;

  @StringFieldOptional()
  addressLine2: string;
}
