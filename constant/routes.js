export const BASE = '/api/v1';

export const MODELS = {
    BASE: '/models',
    FEATURED: '/featured',
    MY_MODELS: '/my-models',
    BY_ID: '/:id',
    PURCHASE: '/:id/purchase'
};

export const PURCHASES = {
    BASE: '/purchases',
    MY_PURCHASES: '/my-purchases',
    BY_MODEL: '/model/:modelId',
    STATS: '/stats'
};

export const COLLECTIONS = {
    MODELS: 'models',
    PURCHASES: 'purchases'
};

export const ALL_MODELS = '/models'; // ok
export const MODEL_DETAILS = '/models/:id'; // ok
export const ADD_MODEL = '/add-model'; // ok
export const UPDATE_MODEL = '/update-model/:id'; // ok
export const DELETE_MODEL = '/delete-model/:id'; // ok
export const MY_MODELS = '/my-models';
export const MY_PURCHASES = '/my-purchases'; 
export const MODEL_PURCHASE = (id = 'id') => `/purchase-model/${id}`;
export const COUNT_PURCHASED_MODEL = (id = 'id') => `/purchased-model/${id}`;

