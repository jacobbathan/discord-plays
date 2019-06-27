const axios = require('axios');

const onGlobalSuccess = response => {
  return response.data;
};

const onGlobalError = error => {
  return Promise.reject(error);
};

const pressLeft = () => {
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

const pressRight = () => {
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

const pressA = () => {
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
