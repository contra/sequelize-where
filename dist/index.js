"use strict";

exports.__esModule = true;
exports.default = void 0;

var _dotProp = _interopRequireDefault(require("dot-prop"));

var _lodash = _interopRequireDefault(require("lodash.intersection"));

var _isPlainObj = _interopRequireDefault(require("is-plain-obj"));

var _regexpLike = _interopRequireDefault(require("regexp-like"));

var _lodash2 = _interopRequireDefault(require("lodash.isequal"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const falsey = () => false;

const truthy = () => true;

const operators = {
  $eq: queryValue => inputValue => queryValue === inputValue,
  $ne: queryValue => inputValue => queryValue !== inputValue,
  $gte: queryValue => inputValue => inputValue >= queryValue,
  $gt: queryValue => inputValue => inputValue > queryValue,
  $lte: queryValue => inputValue => inputValue <= queryValue,
  $lt: queryValue => inputValue => inputValue < queryValue,
  $not: queryValue => {
    const fn = createFilter(queryValue);
    return inputValue => !fn(inputValue);
  },
  $is: queryValue => createFilter(queryValue),
  $in: queryValue => {
    if (!Array.isArray(queryValue)) return falsey;
    return inputValue => queryValue.indexOf(inputValue) !== -1;
  },
  $notIn: queryValue => {
    if (!Array.isArray(queryValue)) return falsey;
    return inputValue => queryValue.indexOf(inputValue) === -1;
  },
  $like: queryValue => operators.$regexp((0, _regexpLike.default)(queryValue)),
  $notLike: queryValue => inputValue => !operators.$like(queryValue)(inputValue),
  $iLike: queryValue => operators.$regexp((0, _regexpLike.default)(queryValue, true)),
  $notILike: queryValue => inputValue => !operators.$iLike(queryValue)(inputValue),
  $regexp: queryValue => {
    const exp = new RegExp(queryValue);
    return inputValue => exp.test(String(inputValue));
  },
  $notRegexp: queryValue => inputValue => !operators.$regexp(queryValue)(inputValue),
  $iRegexp: queryValue => {
    const exp = new RegExp(queryValue, 'i');
    return inputValue => exp.test(String(inputValue));
  },
  $notIRegexp: queryValue => inputValue => !operators.$iRegexp(queryValue)(inputValue),
  $between: queryValue => inputValue => inputValue > queryValue[0] && inputValue < queryValue[1],
  $notBetween: queryValue => inputValue => !operators.$between(queryValue)(inputValue),
  $overlap: queryValue => inputValue => Array.isArray(inputValue) && inputValue.some(v => queryValue.includes(v)),
  $contains: queryValue => inputValue => Array.isArray(inputValue) && (0, _lodash2.default)((0, _lodash.default)(queryValue, inputValue), queryValue),
  $contained: queryValue => inputValue => Array.isArray(inputValue) && (0, _lodash2.default)((0, _lodash.default)(queryValue, inputValue), inputValue),

  /*
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  */
  $and: queryValue => {
    if (!Array.isArray(queryValue)) return falsey;
    const fns = queryValue.map(q => createFilter(q));
    return v => fns.every(fn => fn(v));
  },
  $or: queryValue => {
    if (!Array.isArray(queryValue)) return falsey;
    const fns = queryValue.map(q => createFilter(q));
    return v => fns.some(fn => fn(v));
  }
};
const opKeys = Object.keys(operators);

const hasOps = o => (0, _isPlainObj.default)(o) && (0, _lodash.default)(Object.keys(o), opKeys).length !== 0;

const createFilter = (where = {}) => {
  if (!where) return truthy;
  if (typeof where === 'function') return where; // nothing to do

  if (Array.isArray(where)) return operators.$and(where);
  const keys = Object.keys(where);
  if (keys.length === 0) return truthy; // short out

  const fns = keys.reduce((prev, k) => {
    const val = where[k];
    const opFn = operators[k]; // let the operator handle it from here

    if (opFn) {
      prev.push(opFn(val));
      return prev;
    } // its a comparison, nothing fancy


    if (!hasOps(val)) {
      prev.push(o => {
        const v = _dotProp.default.get(o, k);

        return operators.$eq(val)(v);
      });
      return prev;
    } // nested operators


    const fn = createFilter(val);
    prev.push(o => {
      const v = _dotProp.default.get(o, k);

      return fn(v);
    });
    return prev;
  }, []);
  return operators.$and(fns);
};

var _default = createFilter;
exports.default = _default;
module.exports = exports.default;