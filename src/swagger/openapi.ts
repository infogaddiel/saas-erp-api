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
import {
  createContractSchema,
  updateContractSchema,
  listContractsSchema,
  idParamSchema as contractIdParamSchema,
} from '../contracts/contractValidator';
import {
  bulkCreateProjectsSchema,
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  projectDropdownSchema,
  idParamSchema as projectIdParamSchema,
} from '../projects/projectValidator';
import {
  createLeadSchema,
  updateLeadSchema,
  listLeadsSchema,
  leadDropdownSchema,
  createLeadStatusSchema,
  updateLeadStatusSchema,
  updateLeadCurrentStatusSchema,
  listLeadStatusesSchema,
  leadStatusDropdownSchema,
  idParamSchema as leadIdParamSchema,
} from '../leads/leadValidator';
import {
  createVendorSchema,
  bulkCreateVendorsSchema,
  dropdownVendorsSchema,
  updateVendorSchema,
  listVendorsSchema,
  idParamSchema as vendorIdParamSchema,
} from '../vendors/vendorValidator';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  listPurchaseOrdersSchema,
  idParamSchema as purchaseOrderIdParamSchema,
} from '../purchaseOrders/purchaseOrderValidator';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  listInvoicesSchema,
  idParamSchema as invoiceIdParamSchema,
} from '../invoices/invoiceValidator';
import {
  createReceiptSchema,
  updateReceiptSchema,
  listReceiptsSchema,
  idParamSchema as receiptIdParamSchema,
} from '../receipts/receiptValidator';
import {
  createPaymentSchema,
  updatePaymentSchema,
  listPaymentsSchema,
  idParamSchema as paymentIdParamSchema,
} from '../payments/paymentValidator';
import {
  createCreditNoteSchema,
  updateCreditNoteSchema,
  listCreditNotesSchema,
  exportCreditNotesQuerySchema,
  idParamSchema as creditNoteIdParamSchema,
} from '../creditNotes/creditNoteValidator';

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

const jsonRequestBodyWithExample = (
  schema: Joi.ObjectSchema,
  example: Record<string, unknown>,
  required = true
) => ({
  required,
  content: {
    'application/json': {
      schema: toOpenApiSchema(schema),
      example,
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
      requestBody: jsonRequestBodyWithExample(loginSchema, {
        mobile: '8527607855',
        password: 'password123',
      }),
      responses: {
        200: {
          description: 'Login success. Copy `token` and use it in Swagger Authorize as `Bearer <token>`.',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Login successful' },
                  token: { type: 'string' },
                  user: { type: 'object' },
                },
              },
              example: {
                success: true,
                message: 'Login successful',
                token: '<jwt-token>',
              },
            },
          },
        },
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
        summary: 'Create a company (includes company_code)',
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
        summary: 'Update company (includes company_code)',
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
  '/api/contracts': {
    post: protectedOperation(
      operation({
        summary: 'Create contract',
        tags: ['Contracts'],
        requestBody: jsonRequestBody(createContractSchema),
        responses: {
          201: successResponse('Contract created'),
          200: successResponse('Contract created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List contracts',
        tags: ['Contracts'],
        parameters: makeParameters(listContractsSchema, 'query'),
        responses: {
          200: successResponse('Contracts fetched'),
        },
      })
    ),
  },
  '/api/contracts/dropdown/{customer_id}': {
    get: protectedOperation(
      operation({
        summary: 'Get contracts dropdown options by customer',
        tags: ['Contracts'],
        parameters: [
          {
            in: 'path',
            name: 'customer_id',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: successResponse('Contracts dropdown fetched'),
        },
      })
    ),
  },
  '/api/contracts/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export contracts to Excel',
        tags: ['Contracts'],
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
  '/api/contracts/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get contract by id',
        tags: ['Contracts'],
        parameters: makeParameters(contractIdParamSchema, 'path'),
        responses: {
          200: successResponse('Contract fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update contract',
        tags: ['Contracts'],
        parameters: makeParameters(contractIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateContractSchema),
        responses: {
          200: successResponse('Contract updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete contract',
        tags: ['Contracts'],
        parameters: makeParameters(contractIdParamSchema, 'path'),
        responses: {
          200: successResponse('Contract deleted'),
        },
      })
    ),
  },
  '/api/projects': {
    post: protectedOperation(
      operation({
        summary: 'Create project (supports documents array)',
        tags: ['Projects'],
        requestBody: jsonRequestBody(createProjectSchema),
        responses: {
          201: successResponse('Project created'),
          200: successResponse('Project created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List projects',
        tags: ['Projects'],
        parameters: makeParameters(listProjectsSchema, 'query'),
        responses: {
          200: successResponse('Projects fetched'),
        },
      })
    ),
  },
  '/api/projects/bulk/create': {
    post: protectedOperation(
      operation({
        summary: 'Bulk create projects',
        tags: ['Projects'],
        requestBody: jsonRequestBody(bulkCreateProjectsSchema),
        responses: {
          201: successResponse('Projects created'),
          200: successResponse('Projects created'),
        },
      })
    ),
  },
  '/api/projects/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export projects to Excel',
        tags: ['Projects'],
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
  '/api/projects/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get project dropdown options',
        tags: ['Projects'],
        parameters: makeParameters(projectDropdownSchema, 'query'),
        responses: {
          200: successResponse('Project dropdown fetched'),
        },
      })
    ),
  },
  '/api/projects/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get project by id',
        tags: ['Projects'],
        parameters: makeParameters(projectIdParamSchema, 'path'),
        responses: {
          200: successResponse('Project fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update project (supports documents array)',
        tags: ['Projects'],
        parameters: makeParameters(projectIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateProjectSchema),
        responses: {
          200: successResponse('Project updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete project',
        tags: ['Projects'],
        parameters: makeParameters(projectIdParamSchema, 'path'),
        responses: {
          200: successResponse('Project deleted'),
        },
      })
    ),
  },
  '/api/leads': {
    post: protectedOperation(
      operation({
        summary: 'Create lead',
        tags: ['Leads'],
        requestBody: jsonRequestBody(createLeadSchema),
        responses: {
          201: successResponse('Lead created'),
          200: successResponse('Lead created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List leads',
        tags: ['Leads'],
        parameters: makeParameters(listLeadsSchema, 'query'),
        responses: {
          200: successResponse('Leads fetched'),
        },
      })
    ),
  },
  '/api/leads/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get lead dropdown options',
        tags: ['Leads'],
        parameters: makeParameters(leadDropdownSchema, 'query'),
        responses: {
          200: successResponse('Lead dropdown fetched'),
        },
      })
    ),
  },
  '/api/leads/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get lead by id',
        tags: ['Leads'],
        parameters: makeParameters(leadIdParamSchema, 'path'),
        responses: {
          200: successResponse('Lead fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update lead',
        tags: ['Leads'],
        parameters: makeParameters(leadIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateLeadSchema),
        responses: {
          200: successResponse('Lead updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete lead',
        tags: ['Leads'],
        parameters: makeParameters(leadIdParamSchema, 'path'),
        responses: {
          200: successResponse('Lead deleted'),
        },
      })
    ),
  },
  '/api/leads/statuses': {
    post: protectedOperation(
      operation({
        summary: 'Create lead status',
        tags: ['Leads'],
        requestBody: jsonRequestBody(createLeadStatusSchema),
        responses: {
          201: successResponse('Lead status created'),
          200: successResponse('Lead status created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List lead statuses',
        tags: ['Leads'],
        parameters: makeParameters(listLeadStatusesSchema, 'query'),
        responses: {
          200: successResponse('Lead statuses fetched'),
        },
      })
    ),
  },
  '/api/leads/statuses/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get lead status dropdown options',
        tags: ['Leads'],
        parameters: makeParameters(leadStatusDropdownSchema, 'query'),
        responses: {
          200: successResponse('Lead status dropdown fetched'),
        },
      })
    ),
  },
  '/api/leads/statuses/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get lead status by id',
        tags: ['Leads'],
        parameters: makeParameters(leadIdParamSchema, 'path'),
        responses: {
          200: successResponse('Lead status fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update lead status',
        tags: ['Leads'],
        parameters: makeParameters(leadIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateLeadStatusSchema),
        responses: {
          200: successResponse('Lead status updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete lead status',
        tags: ['Leads'],
        parameters: makeParameters(leadIdParamSchema, 'path'),
        responses: {
          200: successResponse('Lead status deleted'),
        },
      })
    ),
  },
  '/api/vendors': {
    post: protectedOperation(
      operation({
        summary: 'Create vendor',
        tags: ['Vendors'],
        requestBody: jsonRequestBody(createVendorSchema),
        responses: {
          201: successResponse('Vendor created'),
          200: successResponse('Vendor created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List vendors',
        tags: ['Vendors'],
        parameters: makeParameters(listVendorsSchema, 'query'),
        responses: {
          200: successResponse('Vendors fetched'),
        },
      })
    ),
  },
  '/api/vendors/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export vendors to Excel',
        tags: ['Vendors'],
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
  '/api/vendors/bulk/create': {
    post: protectedOperation(
      operation({
        summary: 'Bulk create vendors',
        tags: ['Vendors'],
        requestBody: jsonRequestBody(bulkCreateVendorsSchema),
        responses: {
          200: successResponse('Vendors created'),
          201: successResponse('Vendors created'),
        },
      })
    ),
  },
  '/api/vendors/dropdown': {
    get: protectedOperation(
      operation({
        summary: 'Get vendor dropdown options',
        tags: ['Vendors'],
        parameters: makeParameters(dropdownVendorsSchema, 'query'),
        responses: {
          200: successResponse('Vendors dropdown fetched'),
        },
      })
    ),
  },
  '/api/vendors/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get vendor by id',
        tags: ['Vendors'],
        parameters: makeParameters(vendorIdParamSchema, 'path'),
        responses: {
          200: successResponse('Vendor fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update vendor',
        tags: ['Vendors'],
        parameters: makeParameters(vendorIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateVendorSchema),
        responses: {
          200: successResponse('Vendor updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete vendor',
        tags: ['Vendors'],
        parameters: makeParameters(vendorIdParamSchema, 'path'),
        responses: {
          200: successResponse('Vendor deleted'),
        },
      })
    ),
  },
  '/api/purchase-orders': {
    post: protectedOperation(
      operation({
        summary: 'Create purchase order',
        tags: ['Purchase Orders'],
        requestBody: jsonRequestBody(createPurchaseOrderSchema),
        responses: {
          201: successResponse('Purchase order created'),
          200: successResponse('Purchase order created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List purchase orders',
        tags: ['Purchase Orders'],
        parameters: makeParameters(listPurchaseOrdersSchema, 'query'),
        responses: {
          200: successResponse('Purchase orders fetched'),
        },
      })
    ),
  },
  '/api/purchase-orders/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export purchase orders to Excel',
        tags: ['Purchase Orders'],
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
  '/api/purchase-orders/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get purchase order by id',
        tags: ['Purchase Orders'],
        parameters: makeParameters(purchaseOrderIdParamSchema, 'path'),
        responses: {
          200: successResponse('Purchase order fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update purchase order',
        tags: ['Purchase Orders'],
        parameters: makeParameters(purchaseOrderIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updatePurchaseOrderSchema),
        responses: {
          200: successResponse('Purchase order updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete purchase order',
        tags: ['Purchase Orders'],
        parameters: makeParameters(purchaseOrderIdParamSchema, 'path'),
        responses: {
          200: successResponse('Purchase order deleted'),
        },
      })
    ),
  },
  '/api/payments': {
    post: protectedOperation(
      operation({
        summary: 'Create payment',
        tags: ['Payments'],
        requestBody: jsonRequestBody(createPaymentSchema),
        responses: {
          201: successResponse('Payment created'),
          200: successResponse('Payment created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List payments',
        tags: ['Payments'],
        parameters: makeParameters(listPaymentsSchema, 'query'),
        responses: {
          200: successResponse('Payments fetched'),
        },
      })
    ),
  },
  '/api/payments/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get payment by id',
        tags: ['Payments'],
        parameters: makeParameters(paymentIdParamSchema, 'path'),
        responses: {
          200: successResponse('Payment fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update payment',
        tags: ['Payments'],
        parameters: makeParameters(paymentIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updatePaymentSchema),
        responses: {
          200: successResponse('Payment updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete payment',
        tags: ['Payments'],
        parameters: makeParameters(paymentIdParamSchema, 'path'),
        responses: {
          200: successResponse('Payment deleted'),
        },
      })
    ),
  },
  '/api/receipts': {
    post: protectedOperation(
      operation({
        summary: 'Create receipt',
        tags: ['Receipts'],
        requestBody: jsonRequestBody(createReceiptSchema),
        responses: {
          201: successResponse('Receipt created'),
          200: successResponse('Receipt created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List receipts',
        tags: ['Receipts'],
        parameters: makeParameters(listReceiptsSchema, 'query'),
        responses: {
          200: successResponse('Receipts fetched'),
        },
      })
    ),
  },
  '/api/receipts/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get receipt by id',
        tags: ['Receipts'],
        parameters: makeParameters(receiptIdParamSchema, 'path'),
        responses: {
          200: successResponse('Receipt fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update receipt',
        tags: ['Receipts'],
        parameters: makeParameters(receiptIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateReceiptSchema),
        responses: {
          200: successResponse('Receipt updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete receipt',
        tags: ['Receipts'],
        parameters: makeParameters(receiptIdParamSchema, 'path'),
        responses: {
          200: successResponse('Receipt deleted'),
        },
      })
    ),
  },
  '/api/credit-notes': {
    post: protectedOperation(
      operation({
        summary: 'Create credit note',
        tags: ['Credit Notes'],
        requestBody: jsonRequestBody(createCreditNoteSchema),
        responses: {
          201: successResponse('Credit note created'),
          200: successResponse('Credit note created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List credit notes',
        tags: ['Credit Notes'],
        parameters: makeParameters(listCreditNotesSchema, 'query'),
        responses: {
          200: successResponse('Credit notes fetched'),
        },
      })
    ),
  },
  '/api/credit-notes/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export credit notes to Excel',
        tags: ['Credit Notes'],
        parameters: makeParameters(exportCreditNotesQuerySchema, 'query'),
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
  '/api/credit-notes/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get credit note by id',
        tags: ['Credit Notes'],
        parameters: makeParameters(creditNoteIdParamSchema, 'path'),
        responses: {
          200: successResponse('Credit note fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update credit note',
        tags: ['Credit Notes'],
        parameters: makeParameters(creditNoteIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateCreditNoteSchema),
        responses: {
          200: successResponse('Credit note updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete credit note',
        tags: ['Credit Notes'],
        parameters: makeParameters(creditNoteIdParamSchema, 'path'),
        responses: {
          200: successResponse('Credit note deleted'),
        },
      })
    ),
  },
  '/api/debit-notes': {
    post: protectedOperation(
      operation({
        summary: 'Create debit note',
        tags: ['Debit Notes'],
        requestBody: jsonRequestBody(createCreditNoteSchema),
        responses: {
          201: successResponse('Debit note created'),
          200: successResponse('Debit note created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List debit notes',
        tags: ['Debit Notes'],
        parameters: makeParameters(listCreditNotesSchema, 'query'),
        responses: {
          200: successResponse('Debit notes fetched'),
        },
      })
    ),
  },
  '/api/debit-notes/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export debit notes to Excel',
        tags: ['Debit Notes'],
        parameters: makeParameters(exportCreditNotesQuerySchema, 'query'),
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
  '/api/debit-notes/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get debit note by id',
        tags: ['Debit Notes'],
        parameters: makeParameters(creditNoteIdParamSchema, 'path'),
        responses: {
          200: successResponse('Debit note fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update debit note',
        tags: ['Debit Notes'],
        parameters: makeParameters(creditNoteIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateCreditNoteSchema),
        responses: {
          200: successResponse('Debit note updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete debit note',
        tags: ['Debit Notes'],
        parameters: makeParameters(creditNoteIdParamSchema, 'path'),
        responses: {
          200: successResponse('Debit note deleted'),
        },
      })
    ),
  },
  '/api/invoices': {
    post: protectedOperation(
      operation({
        summary: 'Create invoice',
        tags: ['Invoices'],
        requestBody: jsonRequestBody(createInvoiceSchema),
        responses: {
          201: successResponse('Invoice created'),
          200: successResponse('Invoice created'),
        },
      })
    ),
    get: protectedOperation(
      operation({
        summary: 'List invoices',
        tags: ['Invoices'],
        parameters: makeParameters(listInvoicesSchema, 'query'),
        responses: {
          200: successResponse('Invoices fetched'),
        },
      })
    ),
  },
  '/api/invoices/export/excel': {
    get: protectedOperation(
      operation({
        summary: 'Export invoices to Excel',
        tags: ['Invoices'],
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
  '/api/invoices/{id}': {
    get: protectedOperation(
      operation({
        summary: 'Get invoice by id',
        tags: ['Invoices'],
        parameters: makeParameters(invoiceIdParamSchema, 'path'),
        responses: {
          200: successResponse('Invoice fetched'),
        },
      })
    ),
    put: protectedOperation(
      operation({
        summary: 'Update invoice',
        tags: ['Invoices'],
        parameters: makeParameters(invoiceIdParamSchema, 'path'),
        requestBody: jsonRequestBody(updateInvoiceSchema),
        responses: {
          200: successResponse('Invoice updated'),
        },
      })
    ),
    delete: protectedOperation(
      operation({
        summary: 'Delete invoice',
        tags: ['Invoices'],
        parameters: makeParameters(invoiceIdParamSchema, 'path'),
        responses: {
          200: successResponse('Invoice deleted'),
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
    { name: 'Contracts' },
    { name: 'Projects' },
    { name: 'Leads' },
    { name: 'Vendors' },
    { name: 'Purchase Orders' },
    { name: 'Receipts' },
    { name: 'Payments' },
    { name: 'Credit Notes' },
    { name: 'Debit Notes' },
    { name: 'Invoices' },
    { name: 'Uploads' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Use token from /api/auth/login. In Swagger click Authorize and paste: Bearer <token>.',
      },
    },
  },
  paths: docsPaths,
};
