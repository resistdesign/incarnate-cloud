/**
 * @typedef {Object} ISystemsManager
 * @property {Function} getParameter
 * */

/**
 * Load named configurations from parameter storage.
 * */
export default class ConfigLoader {
  static getFullPath = (basePath = '', name = '') => {
    return `${basePath}/${name}`
      .replace(/\/\//g, '/');
  };

  /**
   * The base path for all configurations to be loaded.
   * @type {string}
   * */
  basePath;

  /**
   * The Systems Manager instance.
   * @type {ISystemsManager}
   * */
  ssm;

  _cache = {};

  constructor(config = {}) {
    Object.assign(this, config);
  }

  /**
   * Load a configuration by name.
   * @param {string} name The name of the configuration.
   * @param {boolean} useCache Use a cached value if available, and cache the value if not.
   * @returns {string} The configuration data.
   * */
  loadConfig = async (name = '', useCache = true) => {
    let configData = undefined;

    if (useCache && this._cache.hasOwnProperty(name)) {
      configData = this._cache[name];
    } else {
      const {
        Parameter: {
          Value
        }
      } = await this.ssm.getParameter({
        Name: ConfigLoader.getFullPath(this.basePath, name),
        WithDecryption: true
      }).promise();
      configData = Value;

      if (useCache) {
        this._cache[name] = configData;
      }
    }

    return configData;
  };

  /**
   * Load a configuration by name.
   * @param {string} name The name of the configuration.
   * @param {boolean} useCache Use a cached value if available, and cache the value if not.
   * @returns {string} The configuration data.
   * */
  loadJSONConfig = async (name = '', useCache = true) => {
    const configData = await this.loadConfig(name, useCache);

    return typeof configData === 'undefined' ?
      configData :
      JSON.parse(configData);
  };
}
