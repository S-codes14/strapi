'use strict';

const _ = require('lodash');
const yup = require('yup');
const { YupValidationError } = require('@strapi/utils').errors;

const { modelTypes, DEFAULT_TYPES } = require('../../services/constants');
const { isValidCategoryName, isValidIcon } = require('./common');
const createSchema = require('./model-schema');
const { removeEmptyDefaults } = require('./data-transform');

const VALID_RELATIONS = ['oneToOne', 'oneToMany'];
const VALID_TYPES = [...DEFAULT_TYPES, 'component'];

const handleYupError = error => {
  throw new YupValidationError(error);
};

const componentSchema = createSchema(VALID_TYPES, VALID_RELATIONS, {
  modelType: modelTypes.COMPONENT,
})
  .shape({
    name: yup
      .string()
      .min(1)
      .required('name.required'),
    icon: yup
      .string()
      .nullable()
      .test(isValidIcon)
      .required('icon.required'),
    category: yup
      .string()
      .nullable()
      .test(isValidCategoryName)
      .required('category.required'),
  })
  .required()
  .noUnknown();

const nestedComponentSchema = yup.array().of(
  componentSchema
    .shape({
      uid: yup.string(),
      tmpUID: yup.string(),
    })
    .test({
      name: 'mustHaveUIDOrTmpUID',
      message: 'Component must have a uid or a tmpUID',
      test(attr) {
        if (_.has(attr, 'uid') && _.has(attr, 'tmpUID')) return false;
        if (!_.has(attr, 'uid') && !_.has(attr, 'tmpUID')) return false;
        return true;
      },
    })
    .required()
    .noUnknown()
);

const validateComponentInput = data => {
  return yup
    .object({
      component: componentSchema,
      components: nestedComponentSchema,
    })
    .noUnknown()
    .validate(data, {
      strict: true,
      abortEarly: false,
    })
    .catch(handleYupError);
};

const validateUpdateComponentInput = data => {
  if (_.has(data, 'component')) {
    removeEmptyDefaults(data.component);
  }

  if (_.has(data, 'components') && Array.isArray(data.components)) {
    data.components.forEach(data => {
      if (_.has(data, 'uid')) {
        removeEmptyDefaults(data);
      }
    });
  }

  return yup
    .object({
      component: componentSchema,
      components: nestedComponentSchema,
    })
    .noUnknown()
    .validate(data, {
      strict: true,
      abortEarly: false,
    })
    .catch(handleYupError);
};

module.exports = {
  validateComponentInput,
  validateUpdateComponentInput,

  nestedComponentSchema,
};
