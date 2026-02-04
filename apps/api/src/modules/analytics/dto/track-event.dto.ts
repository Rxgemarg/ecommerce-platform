import { IsString, IsOptional, IsIn } from 'class-validator';

export type EventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CHECKOUT_STARTED'
  | 'CHECKOUT_COMPLETED'
  | 'ORDER_PLACED'
  | 'SEARCH'
  | 'USER_LOGIN'
  | 'USER_LOGOUT';

export class TrackEventDto {
  @IsIn([
    'PAGE_VIEW',
    'PRODUCT_VIEW',
    'ADD_TO_CART',
    'REMOVE_FROM_CART',
    'CHECKOUT_STARTED',
    'CHECKOUT_COMPLETED',
    'ORDER_PLACED',
    'SEARCH',
    'USER_LOGIN',
    'USER_LOGOUT',
  ])
  type: EventType;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsOptional()
  payload?: Record<string, any>;
}
