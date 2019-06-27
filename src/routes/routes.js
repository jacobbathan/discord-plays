const axios = require('axios');
const exports = (module.exports = {});

const onGlobalSuccess = response => {
  return response.data;
};

const onGlobalError = error => {
  return Promise.reject(error);
};

exports.pressLeft = () => {
  const config = {
    method: 'GET',
    url: '',
    crossdomain: 'true',
    headers: {'Content-Type': 'application/json'},
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

exports.pressRight = () => {
  const config = {
    method: 'GET',
    url: '',
    crossdomain: 'true',
    headers: {'Content-Type': 'application/json'},
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};

exports.pressA = () => {
  const config = {
    method: 'GET',
    url: '',
    crossdomain: 'true',
    headers: {'Content-Type': 'application/json'},
  };
  return axios(config)
    .then(onGlobalSuccess)
    .catch(onGlobalError);
};
