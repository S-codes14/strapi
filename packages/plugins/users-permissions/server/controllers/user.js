'use strict';

/**
 * User.js controller
 *
 * @description: A set of functions called "actions" for managing `User`.
 */

const _ = require('lodash');
const { sanitizeEntity } = require('@strapi/utils');
const { getService } = require('../utils');
const adminUserController = require('./user/admin');
const apiUserController = require('./user/api');

const sanitizeUser = user =>
  sanitizeEntity(user, {
    model: strapi.getModel('plugin::users-permissions.user'),
  });

const resolveController = ctx => {
  const {
    state: { isAuthenticatedAdmin },
  } = ctx;

  return isAuthenticatedAdmin ? adminUserController : apiUserController;
};

const resolveControllerMethod = method => ctx => {
  const controller = resolveController(ctx);
  const callbackFn = controller[method];

  if (!_.isFunction(callbackFn)) {
    return ctx.notFound();
  }

  return callbackFn(ctx);
};

module.exports = {
  create: resolveControllerMethod('create'),
  update: resolveControllerMethod('update'),

  /**
   * Retrieve user records.
   * @return {Object|Array}
   */
  async find(ctx, next, { populate } = {}) {
    const users = await getService('user').fetchAll(ctx.query, populate);

    ctx.body = users.map(sanitizeUser);
  },

  /**
   * Retrieve a user record.
   * @return {Object}
   */
  async findOne(ctx) {
    const { id } = ctx.params;
    let data = await getService('user').fetch({ id });

    if (data) {
      data = sanitizeUser(data);
    }

    ctx.body = data;
  },

  /**
   * Retrieve user count.
   * @return {Number}
   */
  async count(ctx) {
    ctx.body = await getService('user').count(ctx.query);
  },

  /**
   * Destroy a/an user record.
   * @return {Object}
   */
  async destroy(ctx) {
    const { id } = ctx.params;

    const data = await getService('user').remove({ id });

    ctx.send(sanitizeUser(data));
  },

  /**
   * Retrieve authenticated user.
   * @return {Object|Array}
   */
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized();
    }

    ctx.body = sanitizeUser(user);
  },
};
