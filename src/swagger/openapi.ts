import Joi from 'joi';
import j2s from 'joi-to-swagger';
import {
  loginSchema,
  verifyOtpSchema,
  changePasswordSchema,
  forgotPasswordRequestOtpSchema,
  forgotPasswordResetSchema,
} from '../auth/authValidator';
import {
  createCompanySchema,
  updateCompanySchema,
  listCompaniesSchema,
  dropdownCompaniesSchema,
  idParamSchema as companyIdParamSchema,
} from '../companies/companyValidator';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
  idParamSchema as customerIdParamSchema,
  bulkCreateCustomersSchema,
  createCustomerDetailSchema,
  updateCustomerDetailSchema,
  customerDetailParamSchema,
} from '../customers/customerValidator';
import {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  idParamSchema as userIdParamSchema,
  dropdownUsersSchema,
} from '../users/userValidator';
import {
  createItemSchema,
  updateItemSchema,
  listItemsSchema,
  idParamSchema as itemIdParamSchema,
  bulkCreateItemsSchema,
} from '../items/itemValidator';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsSchema,
  listTicketServicesSchema,
  ticketDropdownSchema,
  idParamSchema as ticketIdParamSchema,
  ticketServiceParamSchema,
  ticketServiceIdParamSchema,
  createTicketServiceSchema,
  updateTicketServiceSchema,
} from '../tickets/ticketValidator';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

const toOpenApiSchema = (schema: Joi.ObjectSchema | Joi.Schema) => {
  return j2s(schema, {
    components: {},
  }).swagger;
};

const makeParameters = (schema: Joi.ObjectSchema, parameterIn: 'query' | 'path') => {
  const openApiSchema = toOpenApiSchema(schema) as Record<string, unknown>;
  const requiredList = new Set<string>(
    Array.isArray(openApiSchema.required) ? (openApiSchema.required as string[]) : []
  );
  const properties = (openApiSchema.properties ?? {}) as Record<string, Record<string, unknown>>;

  return Object.entries(properties).map(([name, parameterSchema]) => ({
    in: parameterIn,
    name,
    required: parameterIn === 'path' ? true : requiredList.has(name),
    schema: parameterSchema,
  }));
};

const jsonRequestBody = (schema: Joi.ObjectSchema, required = true) => ({
  required,
  content: {
    'application/json': {
      schema: toOpenApiSchema(schema),
    },
  },
});

const successResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {},
          errors: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  },
});

const errorResponses = {
  400: successResponse('Bad request / validation error'),
  401: successResponse('Unauthorized'),
  404: successResponse('Not found'),
  500: successResponse('Internal server error'),
};

const bearerSecurity = [{ bearerAuth: [] }];

const protectedOperation = (operation: Record<string, unknown>) => ({
  ...operation,
  security: bearerSecurity,
  responses: {
    ...(operation.responses as Record<string, unknown>),
    ...errorResponses,
  },
});

const operation = (config: {
  summary: string;
  tags: string[];
  parameters?: Record<string, unknown>[];
  requestBody?: Record<string, unknown>;
  responses?: Record<string, unknown>;
}) => ({
  summary: config.summary,
  tags: config.tags,
  parameters: config.parameters,
  requestBody: config.requestBody,
  responses: {
    ...(config.responses ?? {}),
  },
});

const docsPaths: Record<string, Partial<Record<HttpMethod, Record<string, unknown>>>> = {
  '/health': {
    get: operation({
      summary: 'Health check',
      tags: ['System'],
      responses: {
        200: successResponse('API is running'),
      },
    }),
  },
  '/api/auth/login': {
    post: operation({
      summary: 'Login with email/mobile and password',
      tags: ['Auth'],
      requestBody: jsonRequestBody(loginSchema),
      responses: {
        200: successResponse('Login success'),
        401: successResponse('Invalid credentials'),
        500: successResponse('Internal server error'),
      },
    }),
  },
  '/api/auth/verify-otp': {
    post: protectedOperation(
      operation({
        summary: 'Verify OTP for authenticated user',
        tags: ['Auth'],
        requestBody: jsonRequestBody(verifyOtpSchema),
        responses: {
          200: successResponse('OTP verified'),
        },
      })
    ),
  },
  '/api/auth/change-password': {
    post: protectedOperation(
      operation({
        summary: 'Change current user password',
        tags: ['Auth'],
        requestBody: jsonRequestBody(changePasswordSchema),
        responses: {
          200: successResponse('Password changed'),
        },
      })
    ),
  },
  '/api/auth/forgot-password/request-otp': {
    post: operation({
      summary: 'Request forgot password OTP',
      tags: ['Auth'],
      requestBody: jsonRequestBody(forgotPasswordRequestOtpSchema),
      responses: {
        200: successResponse('OTP sent'),
        404: successResponse('User not found'),
        500: successResponse('Internal server error'),
      },
    }),
  },
  '/api/auth/forgot-password/reset': {
    post: operation({
      summary: 'Reset password using OTP',
      tags: ['Auth'],
      requestBody: jsonRequestBody(forgotPasswordResetSchema),
      responses: {
        200: successResponse('Password reset'),
        400: successResponse('Invalid OTP'),
        404: successResponse('User not found'),
        500: successResponse('Internal server error'),
      },
    }),
  },
  '/api/auth/roles': {
    get: protectedOperation(
      operation({
        summary: 'List roles for current user',
        tags: ['Auth'],
        responses: {
          200: successResponse('Roles fetched'),
        },
      })
    ),
  },
  '/api/companies': {
    post: protectedOperation(
      operation({
        summary: 'Create a company',
        tags: ['Companies'],
        requestBody: jsonRequestBody(createCompanySchema),
        responses: {
          201: successResponse('Company created'),
          200: successResponse('Company created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List companies',
        tags: ['Companies'],
        parameters: makeParameters(listCompaniesSchema, 'query'),
        responses: {
          200: successResponse('Companies fetched'),
        },
      })
    ),
  },
  '/api/companies/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get company dropdown options',
        tags: ['Companies'],
        parameters: makeParameters(dropdownCompaniesSchema, 'query'),
        responses: {
          200: successResponse('Companies dropdown fetched'),
        },
      })
    ),
  },
  '/api/companies/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get company by id',
        tags: ['Companies'],
        parameters: makeParameters(companyIdParamSchema, 'path'),
        responses: {
          200: successResponse('Company fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update company',
        tags: ['Companies'],
        parameters: makeParameters(companyIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateCompanySchema),
        responses: {
          200: successResponse('Company updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete company',
        tags: ['Companies'],
        parameters: makeParameters(companyIdParamSchema, 'path'),
        responses: {
          200: successResponse('Company deleted'),
        },
      })
    ),
  },
  '/api/customers': {
    post: protectedOperation(
      operation({
        summary: 'Create customer',
        tags: ['Customers'],
        requestBody: jsonRequestBody(createCustomerSchema),
        responses: {
          201: successResponse('Customer created'),
          200: successResponse('Customer created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List customers',
        tags: ['Customers'],
        parameters: makeParameters(listCustomersSchema, 'query'),
        responses: {
          200: successResponse('Customers fetched'),
        },
      })
    ),
  },
  '/api/customers/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get customer dropdown options',
        tags: ['Customers'],
        responses: {
          200: successResponse('Customers dropdown fetched'),
        },
      })
    ),
  },
  '/api/customers/customer-types': {
    get: protectedOperation(
      operation({
        summary: 'List customer types',
        tags: ['Customers'],
        responses: {
          200: successResponse('Customer types fetched'),
        },
      })
    ),
  },
  '/api/customers/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export customers to Excel',
        tags: ['Customers'],
        responses: {
          200: {
            description: 'Excel file',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      })
    ),
  },
  '/api/customers/bulk/create': {
    post: protectedOperation(
      operation({
        summary: 'Bulk create customers',
        tags: ['Customers'],
        requestBody: jsonRequestBody(bulkCreateCustomersSchema),
        responses: {
          200: successResponse('Customers created'),
          201: successResponse('Customers created'),
        },
      })
    ),
  },
  '/api/customers/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get customer by id',
        tags: ['Customers'],
        parameters: makeParameters(customerIdParamSchema, 'path'),
        responses: {
          200: successResponse('Customer fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update customer',
        tags: ['Customers'],
        parameters: makeParameters(customerIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateCustomerSchema),
        responses: {
          200: successResponse('Customer updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete customer',
        tags: ['Customers'],
        parameters: makeParameters(customerIdParamSchema, 'path'),
        responses: {
          200: successResponse('Customer deleted'),
        },
      })
    ),
  },
  '/api/customers/{id}/details': {
    post: protectedOperation(
      operation({
        summary: 'Create customer detail',
        tags: ['Customers'],
        parameters: makeParameters(customerIdParamSchema, 'path'),
        requestBody: jsonRequestBody(createCustomerDetailSchema),
        responses: {
          201: successResponse('Customer detail created'),
          200: successResponse('Customer detail created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List customer details',
        tags: ['Customers'],
        parameters: makeParameters(customerIdParamSchema, 'path'),
        responses: {
          200: successResponse('Customer details fetched'),
        },
      })
    ),
  },
  '/api/customers/{id}/details/{detailId}': {
    get: protectedOperation(
      operation({
        summary: 'Get customer detail by id',
        tags: ['Customers'],
        parameters: makeParameters(customerDetailParamSchema, 'path'),
        responses: {
          200: successResponse('Customer detail fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update customer detail',
        tags: ['Customers'],
        parameters: makeParameters(customerDetailParamSchema, 'path'),
        requestBody: jsonRequestBody(updateCustomerDetailSchema),
        responses: {
          200: successResponse('Customer detail updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete customer detail',
        tags: ['Customers'],
        parameters: makeParameters(customerDetailParamSchema, 'path'),
        responses: {
          200: successResponse('Customer detail deleted'),
        },
      })
    ),
  },
  '/api/users': {
    post: protectedOperation(
      operation({
        summary: 'Create user',
        tags: ['Users'],
        requestBody: jsonRequestBody(createUserSchema),
        responses: {
          201: successResponse('User created'),
          200: successResponse('User created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List users',
        tags: ['Users'],
        parameters: makeParameters(listUsersSchema, 'query'),
        responses: {
          200: successResponse('Users fetched'),
        },
      })
    ),
  },
  '/api/users/dashboard': {
    get: protectedOperation(
      operation({
        summary: 'Get dashboard data',
        tags: ['Users'],
        responses: {
          200: successResponse('Dashboard fetched'),
        },
      })
    ),
  },
  '/api/users/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get users dropdown options',
        tags: ['Users'],
        parameters: makeParameters(dropdownUsersSchema, 'query'),
        responses: {
          200: successResponse('Users dropdown fetched'),
        },
      })
    ),
  },
  '/api/users/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get user by id',
        tags: ['Users'],
        parameters: makeParameters(userIdParamSchema, 'path'),
        responses: {
          200: successResponse('User fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update user',
        tags: ['Users'],
        parameters: makeParameters(userIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateUserSchema),
        responses: {
          200: successResponse('User updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete user',
        tags: ['Users'],
        parameters: makeParameters(userIdParamSchema, 'path'),
        responses: {
          200: successResponse('User deleted'),
        },
      })
    ),
  },
  '/api/items': {
    post: protectedOperation(
      operation({
        summary: 'Create item',
        tags: ['Items'],
        requestBody: jsonRequestBody(createItemSchema),
        responses: {
          201: successResponse('Item created'),
          200: successResponse('Item created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List items',
        tags: ['Items'],
        parameters: makeParameters(listItemsSchema, 'query'),
        responses: {
          200: successResponse('Items fetched'),
        },
      })
    ),
  },
  '/api/items/bulk/create': {
    post: protectedOperation(
      operation({
        summary: 'Bulk create items',
        tags: ['Items'],
        requestBody: jsonRequestBody(bulkCreateItemsSchema),
        responses: {
          201: successResponse('Items created'),
          200: successResponse('Items created'),
        },
      })
    ),
  },
  '/api/items/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export items to Excel',
        tags: ['Items'],
        responses: {
          200: {
            description: 'Excel file',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      })
    ),
  },
  '/api/items/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get item by id',
        tags: ['Items'],
        parameters: makeParameters(itemIdParamSchema, 'path'),
        responses: {
          200: successResponse('Item fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update item',
        tags: ['Items'],
        parameters: makeParameters(itemIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateItemSchema),
        responses: {
          200: successResponse('Item updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete item',
        tags: ['Items'],
        parameters: makeParameters(itemIdParamSchema, 'path'),
        responses: {
          200: successResponse('Item deleted'),
        },
      })
    ),
  },
  '/api/tickets': {
    post: protectedOperation(
      operation({
        summary: 'Create ticket',
        tags: ['Tickets'],
        requestBody: jsonRequestBody(createTicketSchema),
        responses: {
          201: successResponse('Ticket created'),
          200: successResponse('Ticket created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List tickets',
        tags: ['Tickets'],
        parameters: makeParameters(listTicketsSchema, 'query'),
        responses: {
          200: successResponse('Tickets fetched'),
        },
      })
    ),
  },
  '/api/tickets/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get ticket dropdown options',
        tags: ['Tickets'],
        parameters: makeParameters(ticketDropdownSchema, 'query'),
        responses: {
          200: successResponse('Ticket dropdown fetched'),
        },
      })
    ),
  },
  '/api/tickets/statuses': {
    get: protectedOperation(
      operation({
        summary: 'List ticket statuses',
        tags: ['Tickets'],
        responses: {
          200: successResponse('Ticket statuses fetched'),
        },
      })
    ),
  },
  '/api/tickets/services': {
    get: protectedOperation(
      operation({
        summary: 'List all ticket services',
        tags: ['Tickets'],
        parameters: makeParameters(listTicketServicesSchema, 'query'),
        responses: {
          200: successResponse('Ticket services fetched'),
        },
      })
    ),
  },
  '/api/tickets/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get ticket by id',
        tags: ['Tickets'],
        parameters: makeParameters(ticketIdParamSchema, 'path'),
        responses: {
          200: successResponse('Ticket fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update ticket',
        tags: ['Tickets'],
        parameters: makeParameters(ticketIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateTicketSchema),
        responses: {
          200: successResponse('Ticket updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete ticket',
        tags: ['Tickets'],
        parameters: makeParameters(ticketIdParamSchema, 'path'),
        responses: {
          200: successResponse('Ticket deleted'),
        },
      })
    ),
  },
  '/api/tickets/{id}/status-history': {
    get: protectedOperation(
      operation({
        summary: 'Get ticket status history',
        tags: ['Tickets'],
        parameters: makeParameters(ticketIdParamSchema, 'path'),
        responses: {
          200: successResponse('Ticket status history fetched'),
        },
      })
    ),
  },
  '/api/tickets/{ticketId}/services': {
    post: protectedOperation(
      operation({
        summary: 'Create ticket service report',
        tags: ['Tickets'],
        parameters: makeParameters(ticketServiceParamSchema, 'path'),
        requestBody: jsonRequestBody(createTicketServiceSchema),
        responses: {
          201: successResponse('Ticket service created'),
          200: successResponse('Ticket service created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List services for a ticket',
        tags: ['Tickets'],
        parameters: makeParameters(ticketServiceParamSchema, 'path'),
        responses: {
          200: successResponse('Ticket services fetched'),
        },
      })
    ),
  },
  '/api/tickets/{ticketId}/services/{serviceId}': {
    get: protectedOperation(
      operation({
        summary: 'Get ticket service by id',
        tags: ['Tickets'],
        parameters: makeParameters(ticketServiceIdParamSchema, 'path'),
        responses: {
          200: successResponse('Ticket service fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update ticket service',
        tags: ['Tickets'],
        parameters: makeParameters(ticketServiceIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateTicketServiceSchema),
        responses: {
          200: successResponse('Ticket service updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete ticket service',
        tags: ['Tickets'],
        parameters: makeParameters(ticketServiceIdParamSchema, 'path'),
        responses: {
          200: successResponse('Ticket service deleted'),
        },
      })
    ),
  },
  '/api/uploads': {
    post: protectedOperation(
      operation({
        summary: 'Upload a file',
        tags: ['Uploads'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: successResponse('File uploaded'),
          200: successResponse('File uploaded'),
        },
      })
    ),
  },
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Gaddiel ERP API',
    version: '1.0.0',
    description: 'REST API documentation for the Gaddiel ERP backend.',
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Companies' },
    { name: 'Customers' },
    { name: 'Users' },
    { name: 'Items' },
    { name: 'Tickets' },
    { name: 'Uploads' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: docsPaths,
};

