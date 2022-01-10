"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = GenerateClassNames;

var _path = require("path");

var _utils = require("@linaria/utils");

var _logger = require("@linaria/logger");

var _toValidCSSIdentifier = _interopRequireDefault(require("../utils/toValidCSSIdentifier"));

var _getLinariaComment = _interopRequireDefault(require("../utils/getLinariaComment"));

var _getTemplateType = _interopRequireDefault(require("../utils/getTemplateType"));

var _isSlugVar = _interopRequireDefault(require("../utils/isSlugVar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for Linaria css or styled templates.
 * For each template it generates a slug that will be used as a CSS class for particular Template Expression,
 * and generates a display name for class or styled components.
 * It saves that meta data as comment above the template, to be later used in templateProcessor.
 */
function GenerateClassNames(babel, path, state, options) {
  const {
    libResolver
  } = options;
  const {
    types: t
  } = babel;
  const templateType = (0, _getTemplateType.default)(babel, path, state, libResolver);

  if (!templateType) {
    return;
  }

  const expressions = path.get('quasi').get('expressions');
  (0, _logger.debug)('template-parse:identify-expressions', expressions.length); // Increment the index of the style we're processing
  // This is used for slug generation to prevent collision
  // Also used for display name if it couldn't be determined

  state.index++;
  let [, slug, displayName, predefinedClassName] = (0, _getLinariaComment.default)(path);
  const parent = path.findParent(p => t.isObjectProperty(p) || t.isJSXOpeningElement(p) || t.isVariableDeclarator(p));

  if (!displayName && parent) {
    const parentNode = parent.node;

    if (t.isObjectProperty(parentNode)) {
      if ('name' in parentNode.key) {
        displayName = parentNode.key.name;
      } else if ('value' in parentNode.key) {
        displayName = parentNode.key.value.toString();
      } else {
        const keyPath = parent.get('key');
        displayName = keyPath.getSource();
      }
    } else if (t.isJSXOpeningElement(parentNode) && t.isJSXIdentifier(parentNode.name)) {
      displayName = parentNode.name.name;
    } else if (t.isVariableDeclarator(parentNode) && t.isIdentifier(parentNode.id)) {
      displayName = parentNode.id.name;
    }
  }

  if (!displayName) {
    // Try to derive the path from the filename
    displayName = (0, _path.basename)(state.file.opts.filename);

    if (/^index\.[a-z0-9]+$/.test(displayName)) {
      // If the file name is 'index', better to get name from parent folder
      displayName = (0, _path.basename)((0, _path.dirname)(state.file.opts.filename));
    } // Remove the file extension


    displayName = displayName.replace(/\.[a-z0-9]+$/, '');

    if (displayName) {
      displayName += state.index;
    } else {
      throw path.buildCodeFrameError("Couldn't determine a name for the component. Ensure that it's either:\n" + '- Assigned to a variable\n' + '- Is an object property\n' + '- Is a prop in a JSX element\n');
    }
  } // Custom properties need to start with a letter, so we prefix the slug
  // Also use append the index of the class to the filename for uniqueness in the file


  slug = slug || (0, _toValidCSSIdentifier.default)(`${displayName.charAt(0).toLowerCase()}${(0, _utils.slugify)(`${(0, _path.relative)(state.file.opts.root, state.file.opts.filename)}:${state.index}`)}`); // Collect some useful replacement patterns from the filename
  // Available variables for the square brackets used in `classNameSlug` options

  const file = (0, _path.relative)(process.cwd(), state.file.opts.filename).slice(1);
  const ext = (0, _path.extname)(file);
  const slugVars = {
    hash: slug,
    title: displayName,
    file,
    ext,
    name: (0, _path.basename)(file, ext),
    dir: (0, _path.dirname)(file).split(_path.sep).pop()
  };
  let className = predefinedClassName ? predefinedClassName : options.displayName ? `${(0, _toValidCSSIdentifier.default)(displayName)}_${slug}` : slug; // The className can be defined by the user either as fn or a string

  if (typeof options.classNameSlug === 'function') {
    try {
      className = (0, _toValidCSSIdentifier.default)(options.classNameSlug(slug, displayName, slugVars));
    } catch {
      throw new Error(`classNameSlug option must return a string`);
    }
  }

  if (typeof options.classNameSlug === 'string') {
    const {
      classNameSlug
    } = options; // Variables that were used in the config for `classNameSlug`

    const optionVariables = classNameSlug.match(/\[.*?]/g) || [];
    let cnSlug = classNameSlug;

    for (let i = 0, l = optionVariables.length; i < l; i++) {
      const v = optionVariables[i].slice(1, -1); // Remove the brackets around the variable name
      // Replace the var if it key and value exist otherwise place an empty string

      cnSlug = cnSlug.replace(`[${v}]`, (0, _isSlugVar.default)(v, slugVars) ? slugVars[v] : '');
    }

    className = (0, _toValidCSSIdentifier.default)(cnSlug);
  }

  const type = templateType !== 'css' && templateType !== 'atomic-css' ? 'styled' : templateType;
  (0, _logger.debug)(`template-parse:generated-meta:${type}`, `slug: ${slug}, displayName: ${displayName}, className: ${className}`); // Save evaluated slug and displayName for future usage in templateProcessor

  path.addComment('leading', `linaria ${type} ${slug} ${displayName} ${className}`);
}
//# sourceMappingURL=GenerateClassNames.js.map